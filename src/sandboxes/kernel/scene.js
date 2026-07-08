/* Life of a Kernel — three.js scene.
   All motion is a pure function of the master clock t (seconds), so the
   scrubber can jump anywhere and the film stays deterministic.
   Colors come in a light and a dark set to follow the site theme. */
import * as THREE from 'three';
import {
  CAM_KEYS, TOTAL, SM_COUNT, GRID_BLOCKS, WARP_ROWS,
  FOCUS_BLOCK, blockSchedule,
} from './script.js';

/* ---------- layout ---------- */
const SM_X = [-13.75, -8.25, -2.75, 2.75, 8.25, 13.75];
const SM_Z = [-9, -4.5, 4.5, 9];
const smPos = (i) => [SM_X[i % 6], 1.8, SM_Z[Math.floor(i / 6)]];
const TOWERS = [[-21, -6], [-21, 6], [21, -6], [21, 6]];
const SLABS_PER_TOWER = 5;

const hoverPos = (b) => [-12.1 + (b % 12) * 2.2, 13, -7.7 + Math.floor(b / 12) * 2.2];
const slotPos = (sm, slot) => {
  const [x, , z] = smPos(sm);
  return [x + (slot - 1) * 1.35, 3.1, z];
};

const BOARD_Y = 4.8;
const boardLanePos = (row, lane) => [
  SM_X[1] + (lane - 15.5) * 0.24,
  BOARD_Y,
  SM_Z[1] - 1.4 + row * 0.4,
];
const rowCenter = (row) => [SM_X[1], BOARD_Y, SM_Z[1] - 1.4 + row * 0.4];

/* ---------- themes ---------- */
const THEMES = {
  light: {
    bg: '#fafafa', die: '#d8d8d8', sm: '#ececec', smActive: '#c5d9f2',
    l2: '#e2c893', hbmDim: '#e6d9bd', hbm: '#d0a656',
    block: '#8f76c0', blockSel: '#1565c0',
    warpDim: '#cfc3e6', warpActive: '#1565c0', warpStall: '#bdbdbd', warpSel: '#b26a00',
    particle: '#b26a00', beam: '#b26a00', request: '#b26a00',
    label: '#616161', hemi: '#ffffff', ground: '#e8e8e8', dirI: 0.75, hemiI: 0.95,
  },
  dark: {
    bg: '#212121', die: '#303030', sm: '#3d3d3d', smActive: '#2b4d74',
    l2: '#6e5426', hbmDim: '#463c2c', hbm: '#a67c3a',
    block: '#7e68b0', blockSel: '#42a5f5',
    warpDim: '#4a3d6e', warpActive: '#42a5f5', warpStall: '#5a5a5a', warpSel: '#d99a3d',
    particle: '#d99a3d', beam: '#d99a3d', request: '#d99a3d',
    label: '#aaaaaa', hemi: '#ffffff', ground: '#181818', dirI: 0.55, hemiI: 0.7,
  },
};

/* ---------- helpers ---------- */
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, t) => {
  const u = clamp01((t - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp3 = (a, b, u) => [
  a[0] + (b[0] - a[0]) * u,
  a[1] + (b[1] - a[1]) * u,
  a[2] + (b[2] - a[2]) * u,
];

function makeLabelSprite(text, colorHex) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 96;
  const ctx = cv.getContext('2d');
  const draw = (color) => {
    ctx.clearRect(0, 0, 256, 96);
    ctx.font = '600 44px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 48);
  };
  draw(colorHex);
  const tex = new THREE.CanvasTexture(cv);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5.6, 2.1, 1);
  sprite.userData.redraw = (color) => { draw(color); tex.needsUpdate = true; };
  return sprite;
}

/* connect a unit-Y cylinder mesh between two points */
const _va = new THREE.Vector3(); const _vb = new THREE.Vector3();
const _dir = new THREE.Vector3(); const _up = new THREE.Vector3(0, 1, 0);
function setBeam(mesh, a, b, radius) {
  _va.set(...a); _vb.set(...b);
  _dir.subVectors(_vb, _va);
  const len = _dir.length();
  mesh.position.copy(_va).addScaledVector(_dir, 0.5);
  mesh.scale.set(radius, len, radius);
  mesh.quaternion.setFromUnitVectors(_up, _dir.normalize());
}

export function createScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);

  let theme = THEMES.light;

  /* lights */
  const hemi = new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.95);
  const dir = new THREE.DirectionalLight(0xffffff, 0.75);
  dir.position.set(24, 42, 14);
  scene.add(hemi, dir);

  /* die + L2 */
  const dieMat = new THREE.MeshLambertMaterial();
  const die = new THREE.Mesh(new THREE.BoxGeometry(36, 1, 24), dieMat);
  die.position.y = 0.5;
  scene.add(die);
  const l2Mat = new THREE.MeshLambertMaterial();
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(32, 1, 3.2), l2Mat);
  l2.position.set(0, 1.5, 0);
  scene.add(l2);

  /* SMs (instanced, per-instance color for activity) */
  const smMat = new THREE.MeshLambertMaterial();
  const sms = new THREE.InstancedMesh(new THREE.BoxGeometry(4.6, 1.6, 3.4), smMat, SM_COUNT);
  scene.add(sms);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < SM_COUNT; i++) {
    dummy.position.set(...smPos(i));
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    sms.setMatrixAt(i, dummy.matrix);
    sms.setColorAt(i, new THREE.Color('#ffffff'));
  }
  sms.instanceMatrix.needsUpdate = true;

  /* HBM towers (instanced slabs, brightness = fill level) */
  const hbmMat = new THREE.MeshLambertMaterial();
  const hbm = new THREE.InstancedMesh(
    new THREE.BoxGeometry(4.6, 0.72, 7.2), hbmMat, TOWERS.length * SLABS_PER_TOWER);
  scene.add(hbm);
  for (let tI = 0; tI < TOWERS.length; tI++) {
    for (let s = 0; s < SLABS_PER_TOWER; s++) {
      const idx = tI * SLABS_PER_TOWER + s;
      dummy.position.set(TOWERS[tI][0], 0.45 + s * 0.95, TOWERS[tI][1]);
      dummy.updateMatrix();
      hbm.setMatrixAt(idx, dummy.matrix);
      hbm.setColorAt(idx, new THREE.Color('#ffffff'));
    }
  }
  hbm.instanceMatrix.needsUpdate = true;

  /* grid blocks */
  const blockMat = new THREE.MeshLambertMaterial();
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), blockMat, GRID_BLOCKS);
  scene.add(blocks);
  for (let b = 0; b < GRID_BLOCKS; b++) blocks.setColorAt(b, new THREE.Color('#ffffff'));

  /* warp board: 8 rows × 32 lanes above the focus SM */
  const boardMat = new THREE.MeshLambertMaterial();
  const board = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.17, 0.1, 0.3), boardMat, WARP_ROWS * 32);
  scene.add(board);
  for (let i = 0; i < WARP_ROWS * 32; i++) board.setColorAt(i, new THREE.Color('#ffffff'));

  /* memcpy / writeback particles */
  const PARTS = 64;
  const partMat = new THREE.MeshLambertMaterial();
  const parts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), partMat, PARTS);
  scene.add(parts);

  /* ch4 memory request */
  const reqMat = new THREE.MeshLambertMaterial();
  const req = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), reqMat);
  req.visible = false;
  scene.add(req);

  /* ch5 beams */
  const beamMat = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.85 });
  const fatBeam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10), beamMat);
  fatBeam.visible = false;
  scene.add(fatBeam);

  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.75 });
  const focusRow = 4;
  const gatherGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(32 * 2 * 3);
    const c = rowCenter(focusRow);
    for (let l = 0; l < 32; l++) {
      const p = boardLanePos(focusRow, l);
      pos.set([...p, ...c], l * 6);
    }
    gatherGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  }
  const gather = new THREE.LineSegments(gatherGeo, lineMat);
  gather.visible = false;
  scene.add(gather);

  const scatterGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(32 * 2 * 3);
    for (let l = 0; l < 32; l++) {
      const p = boardLanePos(focusRow, l);
      const tz = -10 + hash(l * 3 + 1) * 20;
      const ty = 0.8 + hash(l * 7 + 2) * 4;
      pos.set([...p, -18.8, ty, tz], l * 6);
    }
    scatterGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  }
  const scatter = new THREE.LineSegments(scatterGeo, lineMat);
  scatter.visible = false;
  scene.add(scatter);

  /* the million-thread flash (ch2 finale) */
  const N_PTS = 150000;
  const ptsGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(N_PTS * 3);
    for (let i = 0; i < N_PTS; i++) {
      pos[i * 3] = -17 + hash(i) * 34;
      pos[i * 3 + 1] = 3 + hash(i + 1e6) * 8;
      pos[i * 3 + 2] = -11.5 + hash(i + 2e6) * 23;
    }
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  }
  const ptsMat = new THREE.PointsMaterial({ size: 0.05, transparent: true, opacity: 0, depthWrite: false });
  const cloud = new THREE.Points(ptsGeo, ptsMat);
  cloud.visible = false;
  scene.add(cloud);

  /* labels */
  const labels = [
    { sprite: makeLabelSprite('HBM', theme.label), pos: [-21, 6.6, -6] },
    { sprite: makeLabelSprite('HBM', theme.label), pos: [21, 6.6, 6] },
    { sprite: makeLabelSprite('L2', theme.label), pos: [0, 3.6, 0] },
    { sprite: makeLabelSprite('SM', theme.label), pos: [13.75, 4.4, 9] },
  ];
  labels.forEach((l) => { l.sprite.position.set(...l.pos); scene.add(l.sprite); });

  /* colors as THREE.Color, refreshed per theme */
  const C = {};
  function applyTheme(name) {
    theme = THEMES[name] || THEMES.light;
    for (const k of Object.keys(theme)) {
      if (typeof theme[k] === 'string' && theme[k].startsWith('#')) C[k] = new THREE.Color(theme[k]);
    }
    renderer.setClearColor(theme.bg);
    dieMat.color.set(theme.die);
    l2Mat.color.set(theme.l2);
    smMat.color.set('#ffffff');
    hbmMat.color.set('#ffffff');
    blockMat.color.set('#ffffff');
    boardMat.color.set('#ffffff');
    partMat.color.set(theme.particle);
    reqMat.color.set(theme.request);
    beamMat.color.set(theme.beam);
    lineMat.color.set(theme.beam);
    ptsMat.color.set(theme.blockSel);
    hemi.intensity = theme.hemiI;
    hemi.groundColor.set(theme.ground);
    dir.intensity = theme.dirI;
    labels.forEach((l) => l.sprite.userData.redraw(theme.label));
  }
  applyTheme('light');

  /* camera interpolation over CAM_KEYS */
  function cameraAt(t, yaw, pitch) {
    let i = 0;
    while (i < CAM_KEYS.length - 2 && t >= CAM_KEYS[i + 1][0]) i++;
    const [t0, p0, g0] = CAM_KEYS[i];
    const [t1, p1, g1] = CAM_KEYS[i + 1];
    const u = smooth(t0, t1, t);
    const pos = lerp3(p0, p1, u);
    const tgt = lerp3(g0, g1, u);
    // user look offset: orbit pos around tgt
    if (yaw !== 0 || pitch !== 0) {
      const v = new THREE.Vector3(pos[0] - tgt[0], pos[1] - tgt[1], pos[2] - tgt[2]);
      const sph = new THREE.Spherical().setFromVector3(v);
      sph.theta += yaw;
      sph.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, sph.phi + pitch));
      v.setFromSpherical(sph);
      pos[0] = tgt[0] + v.x; pos[1] = tgt[1] + v.y; pos[2] = tgt[2] + v.z;
    }
    camera.position.set(...pos);
    camera.lookAt(...tgt);
  }

  const colA = new THREE.Color();

  /* which warp row issues at time t (skipping the stalled row during ch4) */
  function activeRow(t) {
    if (t < 33) return -1;
    const cycle = Math.floor((t - 33) / 0.35);
    if (t >= 45 && t < 53) {
      const rows = [0, 1, 3, 4, 5, 6, 7];
      return rows[cycle % 7];
    }
    return cycle % 8;
  }

  function update(t, opts) {
    const { yaw = 0, pitch = 0, coalesced = true, selBlock = 31, selTid = 140 } = opts;
    cameraAt(t, yaw, pitch);

    /* labels visible in ch0 + ch6 */
    labels.forEach((l) => {
      l.sprite.material.opacity = t < 8 ? 1 - smooth(6.5, 8, t) : t >= 68 ? smooth(68, 70, t) : 0;
      l.sprite.visible = l.sprite.material.opacity > 0.01;
    });

    /* HBM fill (ch1) + pulse when the ch4 request arrives */
    for (let tI = 0; tI < TOWERS.length; tI++) {
      for (let s = 0; s < SLABS_PER_TOWER; s++) {
        const idx = tI * SLABS_PER_TOWER + s;
        const fill = smooth(9 + s * 1.5, 10.2 + s * 1.5, t);
        colA.copy(C.hbmDim).lerp(C.hbm, fill);
        // request hits the west-front tower around t≈49
        if (tI === 0 && t >= 48.6 && t <= 50.2) {
          colA.lerp(C.blockSel, 0.5 * Math.sin(((t - 48.6) / 1.6) * Math.PI));
        }
        hbm.setColorAt(idx, colA);
      }
    }
    hbm.instanceColor.needsUpdate = true;

    /* SM activity: tinted while blocks are resident */
    for (let i = 0; i < SM_COUNT; i++) {
      let active = 0;
      for (let slot = 0; slot < 3; slot++) {
        // representative block for (sm, slot) in wave 1
        const b = slot * 24 + i;
        const sc = blockSchedule(b);
        if (t >= sc.land && t < sc.retire) active = 1;
      }
      // wave 2 tenants
      const b2 = 72 + i;
      const sc2 = blockSchedule(b2);
      if (t >= sc2.land && t < sc2.retire) active = 1;
      colA.copy(new THREE.Color(theme.sm)).lerp(C.smActive, active * (0.7 + 0.3 * Math.sin(t * 3 + i)));
      sms.setColorAt(i, colA);
    }
    sms.instanceColor.needsUpdate = true;

    /* blocks */
    const boardOpen = smooth(32, 33, t) * (1 - smooth(65.5, 66.5, t));
    for (let b = 0; b < GRID_BLOCKS; b++) {
      const sc = blockSchedule(b);
      const appear = 18.5 + (b / GRID_BLOCKS) * 2.5;
      let p; let scale = smooth(appear, appear + 0.7, t);
      if (t < sc.depart) {
        p = hoverPos(b);
        // gentle idle bob while waiting
        p = [p[0], p[1] + Math.sin(t * 1.7 + b) * 0.15, p[2]];
      } else if (t < sc.land) {
        const u = smooth(sc.depart, sc.land, t);
        p = lerp3(hoverPos(b), slotPos(sc.sm, sc.slot), u);
        p[1] += Math.sin(u * Math.PI) * 2.2;
      } else {
        p = slotPos(sc.sm, sc.slot);
        const gone = smooth(sc.retire, sc.retire + 0.8, t);
        scale *= 1 - gone;
      }
      // the focus block unfolds into the warp board (fixed — the camera
      // dives into FOCUS_SM regardless of which block the user clicked)
      if (b === FOCUS_BLOCK) scale *= 1 - boardOpen;
      dummy.position.set(...p);
      dummy.scale.setScalar(Math.max(scale, 0.0001));
      dummy.updateMatrix();
      blocks.setMatrixAt(b, dummy.matrix);
      colA.copy(b === selBlock ? C.blockSel : C.block);
      blocks.setColorAt(b, colA);
    }
    blocks.instanceMatrix.needsUpdate = true;
    blocks.instanceColor.needsUpdate = true;

    /* warp board */
    board.visible = boardOpen > 0.001;
    if (board.visible) {
      const act = activeRow(t);
      const stalled = t >= 45 && t < 53 ? 2 : -1;
      for (let r = 0; r < WARP_ROWS; r++) {
        for (let l = 0; l < 32; l++) {
          const idx = r * 32 + l;
          const p = boardLanePos(r, l);
          dummy.position.set(...p);
          const isAct = r === act;
          dummy.scale.setScalar(boardOpen * (isAct ? 1.35 : 1));
          dummy.updateMatrix();
          board.setMatrixAt(idx, dummy.matrix);
          if (idx === selTid) colA.copy(C.warpSel);
          else if (r === stalled) colA.copy(C.warpStall);
          else if (isAct) colA.copy(C.warpActive);
          else colA.copy(C.warpDim);
          // reactivation flash after the load returns
          if (r === 2 && t >= 53 && t < 54) colA.lerp(C.warpActive, Math.sin(((t - 53)) * Math.PI));
          board.setColorAt(idx, colA);
        }
      }
      board.instanceMatrix.needsUpdate = true;
      board.instanceColor.needsUpdate = true;
    }

    /* memcpy (ch1) and writeback (ch6) particles */
    for (let pI = 0; pI < PARTS; pI++) {
      let p = null; let scale = 0;
      const tower = TOWERS[pI % 4];
      if (t >= 8 && t < 19) {
        const start = 8.2 + hash(pI) * 8;
        const u = (t - start) / 1.7;
        if (u >= 0 && u <= 1) {
          const src = [-50, 15 + hash(pI + 40) * 8, 20 + hash(pI + 80) * 14];
          const dst = [tower[0], 4.5, tower[1]];
          p = lerp3(src, dst, smooth(0, 1, u));
          scale = Math.sin(u * Math.PI);
        }
      } else if (t >= 68 && t < 74) {
        const start = 68.2 + hash(pI) * 3.4;
        const u = (t - start) / 1.6;
        if (u >= 0 && u <= 1) {
          const src = [tower[0], 4.5, tower[1]];
          const dst = [52, 16 + hash(pI + 40) * 8, 18 + hash(pI + 80) * 14];
          p = lerp3(src, dst, u * u);
          scale = Math.sin(u * Math.PI);
        }
      }
      dummy.position.set(...(p ?? [0, -10, 0]));
      dummy.scale.setScalar(Math.max(scale, 0.0001));
      dummy.updateMatrix();
      parts.setMatrixAt(pI, dummy.matrix);
    }
    parts.instanceMatrix.needsUpdate = true;

    /* ch4 memory request round-trip */
    if (t >= 45 && t <= 53.2) {
      req.visible = true;
      const u = (t - 45) / 8;
      const P0 = rowCenter(2);
      const P1 = [SM_X[1], 1.7, 0];         // L2, under the focus SM column
      const P2 = [-18.6, 3.2, -6];          // west HBM tower face
      let p;
      if (u < 0.22) p = lerp3(P0, P1, smooth(0, 0.22, u));
      else if (u < 0.48) p = lerp3(P1, P2, smooth(0.22, 0.48, u));
      else if (u < 0.56) p = P2;            // dwell: the slow part
      else if (u < 0.82) p = lerp3(P2, P1, smooth(0.56, 0.82, u));
      else p = lerp3(P1, P0, smooth(0.82, 1, u));
      req.position.set(...p);
      const dwell = u >= 0.48 && u < 0.56 ? 1 + 0.5 * Math.sin(t * 12) : 1;
      req.scale.setScalar(dwell);
    } else {
      req.visible = false;
    }

    /* ch5 beams */
    const beamsOn = t >= 58.6 && t < 67.5;
    const pulse = 0.55 + 0.35 * Math.sin(t * 5);
    if (beamsOn && coalesced) {
      fatBeam.visible = true; gather.visible = true; scatter.visible = false;
      setBeam(fatBeam, rowCenter(focusRow), [-18.8, 3.4, -2], 0.26);
      beamMat.opacity = pulse;
      lineMat.opacity = 0.5;
    } else if (beamsOn) {
      fatBeam.visible = false; gather.visible = false; scatter.visible = true;
      lineMat.opacity = pulse;
    } else {
      fatBeam.visible = false; gather.visible = false; scatter.visible = false;
    }

    /* million-thread flash */
    const cloudOp = smooth(29.5, 30.4, t) * (1 - smooth(31.2, 32, t));
    cloud.visible = cloudOp > 0.01;
    ptsMat.opacity = cloudOp * 0.55;

    renderer.render(scene, camera);
  }

  /* picking */
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function pick(clientX, clientY, chapterId) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    if (chapterId === 2) {
      const hit = raycaster.intersectObject(blocks)[0];
      if (hit && hit.instanceId != null) return { type: 'block', id: hit.instanceId };
    } else if (chapterId >= 3 && chapterId <= 5) {
      const hit = raycaster.intersectObject(board)[0];
      if (hit && hit.instanceId != null) return { type: 'lane', id: hit.instanceId };
    }
    return null;
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    renderer.dispose();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
  }

  return { update, pick, resize, dispose, setTheme: applyTheme, TOTAL };
}
