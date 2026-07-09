/* Trains the toy transformer on the synthetic grammar and writes
   ../weights.json. Zero dependencies: a ~200-line matrix autograd,
   Adam, and a pre-LN GPT. Run:  node src/sandboxes/transformer/train/train.mjs
   Prints loss curve, held-out accuracy, agreement metrics, sample
   generations, and per-head attention summaries (used to write the
   observation hints in the sandbox copy). */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOCAB, T_MAX, genSentence, VERB_PAIRS, BOS } from './grammar.mjs';

/* ---------- config ---------- */
const D = 32, HEADS = 4, DH = 8, LAYERS = 2, DMLP = 64;
const STEPS = 2500, BATCH = 16, LR0 = 3e-3, LR1 = 2e-4;
const SEED = 1337;

const V = VOCAB.length;
const tokId = new Map(VOCAB.map((w, i) => [w, i]));

/* ---------- rng ---------- */
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const randn = () => {
  const u = 1 - rng(), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/* ---------- matrix autograd ---------- */
let TAPE = [];
function node(r, c) {
  const n = { r, c, d: new Float32Array(r * c), g: new Float32Array(r * c), back: null, prev: [] };
  return n;
}
function track(n) { if (n.back) TAPE.push(n); return n; }

function param(r, c, std) {
  const n = node(r, c);
  for (let i = 0; i < n.d.length; i++) n.d[i] = randn() * std;
  return n;
}

function mm(A, B) { // A(r×k) @ B(k×c)
  const O = node(A.r, B.c);
  const k = A.c;
  for (let i = 0; i < A.r; i++) for (let p = 0; p < k; p++) {
    const a = A.d[i * k + p];
    if (a === 0) continue;
    for (let j = 0; j < B.c; j++) O.d[i * B.c + j] += a * B.d[p * B.c + j];
  }
  O.back = () => {
    for (let i = 0; i < A.r; i++) for (let j = 0; j < B.c; j++) {
      const go = O.g[i * B.c + j];
      if (go === 0) continue;
      for (let p = 0; p < k; p++) {
        A.g[i * k + p] += go * B.d[p * B.c + j];
        B.g[p * B.c + j] += go * A.d[i * k + p];
      }
    }
  };
  return track(O);
}

function mmT(A, B) { // A(r×k) @ B(c×k)ᵀ → r×c
  const O = node(A.r, B.r);
  const k = A.c;
  for (let i = 0; i < A.r; i++) for (let j = 0; j < B.r; j++) {
    let s = 0;
    for (let p = 0; p < k; p++) s += A.d[i * k + p] * B.d[j * k + p];
    O.d[i * B.r + j] = s;
  }
  O.back = () => {
    for (let i = 0; i < A.r; i++) for (let j = 0; j < B.r; j++) {
      const go = O.g[i * B.r + j];
      if (go === 0) continue;
      for (let p = 0; p < k; p++) {
        A.g[i * k + p] += go * B.d[j * k + p];
        B.g[j * k + p] += go * A.d[i * k + p];
      }
    }
  };
  return track(O);
}

function add(A, B) {
  const O = node(A.r, A.c);
  for (let i = 0; i < O.d.length; i++) O.d[i] = A.d[i] + B.d[i];
  O.back = () => {
    for (let i = 0; i < O.d.length; i++) { A.g[i] += O.g[i]; B.g[i] += O.g[i]; }
  };
  return track(O);
}

function addRow(A, b) { // + 1×c bias row
  const O = node(A.r, A.c);
  for (let i = 0; i < A.r; i++) for (let j = 0; j < A.c; j++) O.d[i * A.c + j] = A.d[i * A.c + j] + b.d[j];
  O.back = () => {
    for (let i = 0; i < A.r; i++) for (let j = 0; j < A.c; j++) {
      A.g[i * A.c + j] += O.g[i * A.c + j];
      b.g[j] += O.g[i * A.c + j];
    }
  };
  return track(O);
}

function scale(A, s) {
  const O = node(A.r, A.c);
  for (let i = 0; i < O.d.length; i++) O.d[i] = A.d[i] * s;
  O.back = () => { for (let i = 0; i < O.d.length; i++) A.g[i] += O.g[i] * s; };
  return track(O);
}

function gelu(A) {
  const O = node(A.r, A.c);
  const t = new Float32Array(A.d.length);
  for (let i = 0; i < A.d.length; i++) {
    const x = A.d[i];
    const u = Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x));
    t[i] = u;
    O.d[i] = 0.5 * x * (1 + u);
  }
  O.back = () => {
    for (let i = 0; i < A.d.length; i++) {
      const x = A.d[i], u = t[i];
      const du = (1 - u * u) * 0.7978845608 * (1 + 3 * 0.044715 * x * x);
      A.g[i] += O.g[i] * (0.5 * (1 + u) + 0.5 * x * du);
    }
  };
  return track(O);
}

function lnRow(A, g, b) {
  const O = node(A.r, A.c);
  const c = A.c;
  const mu = new Float32Array(A.r), iv = new Float32Array(A.r);
  const xh = new Float32Array(A.d.length);
  for (let i = 0; i < A.r; i++) {
    let m = 0;
    for (let j = 0; j < c; j++) m += A.d[i * c + j];
    m /= c;
    let v = 0;
    for (let j = 0; j < c; j++) { const dd = A.d[i * c + j] - m; v += dd * dd; }
    v = 1 / Math.sqrt(v / c + 1e-5);
    mu[i] = m; iv[i] = v;
    for (let j = 0; j < c; j++) {
      const h = (A.d[i * c + j] - m) * v;
      xh[i * c + j] = h;
      O.d[i * c + j] = h * g.d[j] + b.d[j];
    }
  }
  O.back = () => {
    for (let i = 0; i < A.r; i++) {
      let sg = 0, sgx = 0;
      for (let j = 0; j < c; j++) {
        const go = O.g[i * c + j];
        g.g[j] += go * xh[i * c + j];
        b.g[j] += go;
        const gh = go * g.d[j];
        sg += gh; sgx += gh * xh[i * c + j];
      }
      for (let j = 0; j < c; j++) {
        const gh = O.g[i * c + j] * g.d[j];
        A.g[i * c + j] += iv[i] * (gh - sg / c - xh[i * c + j] * sgx / c);
      }
    }
  };
  return track(O);
}

function causalSoftmax(A) { // T×T, row i uses cols 0..i
  const O = node(A.r, A.c);
  for (let i = 0; i < A.r; i++) {
    let mx = -Infinity;
    for (let j = 0; j <= i; j++) mx = Math.max(mx, A.d[i * A.c + j]);
    let s = 0;
    for (let j = 0; j <= i; j++) { const e = Math.exp(A.d[i * A.c + j] - mx); O.d[i * A.c + j] = e; s += e; }
    for (let j = 0; j <= i; j++) O.d[i * A.c + j] /= s;
  }
  O.back = () => {
    for (let i = 0; i < A.r; i++) {
      let dot = 0;
      for (let j = 0; j <= i; j++) dot += O.g[i * A.c + j] * O.d[i * A.c + j];
      for (let j = 0; j <= i; j++) {
        A.g[i * A.c + j] += O.d[i * A.c + j] * (O.g[i * A.c + j] - dot);
      }
    }
  };
  return track(O);
}

function gather(E, ids) {
  const O = node(ids.length, E.c);
  for (let i = 0; i < ids.length; i++) O.d.set(E.d.subarray(ids[i] * E.c, (ids[i] + 1) * E.c), i * E.c);
  O.back = () => {
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < E.c; j++) E.g[ids[i] * E.c + j] += O.g[i * E.c + j];
    }
  };
  return track(O);
}

function sliceCols(A, s0, len) {
  const O = node(A.r, len);
  for (let i = 0; i < A.r; i++) O.d.set(A.d.subarray(i * A.c + s0, i * A.c + s0 + len), i * len);
  O.back = () => {
    for (let i = 0; i < A.r; i++) for (let j = 0; j < len; j++) A.g[i * A.c + s0 + j] += O.g[i * len + j];
  };
  return track(O);
}

function sliceRows(A, r0, len) {
  const O = node(len, A.c);
  O.d.set(A.d.subarray(r0 * A.c, (r0 + len) * A.c));
  O.back = () => {
    for (let i = 0; i < len * A.c; i++) A.g[r0 * A.c + i] += O.g[i];
  };
  return track(O);
}

/* cross-entropy over rows 0..T-2 predicting ids[1..]; returns mean loss */
function ceLoss(logits, ids) {
  const T = ids.length;
  const Vc = logits.c;
  let loss = 0;
  const probs = new Float32Array((T - 1) * Vc);
  for (let i = 0; i < T - 1; i++) {
    let mx = -Infinity;
    for (let j = 0; j < Vc; j++) mx = Math.max(mx, logits.d[i * Vc + j]);
    let s = 0;
    for (let j = 0; j < Vc; j++) { const e = Math.exp(logits.d[i * Vc + j] - mx); probs[i * Vc + j] = e; s += e; }
    for (let j = 0; j < Vc; j++) probs[i * Vc + j] /= s;
    loss -= Math.log(probs[i * Vc + ids[i + 1]] + 1e-9);
  }
  loss /= (T - 1);
  const back = () => {
    for (let i = 0; i < T - 1; i++) {
      for (let j = 0; j < Vc; j++) logits.g[i * Vc + j] += probs[i * Vc + j] / (T - 1);
      logits.g[i * Vc + ids[i + 1]] -= 1 / (T - 1);
    }
  };
  return { loss, back };
}

function backward() {
  for (let i = TAPE.length - 1; i >= 0; i--) TAPE[i].back();
}

/* ---------- model ---------- */
const P = {};
const PARAMS = [];
const reg = (name, r, c, std) => { const p = param(r, c, std); P[name] = p; PARAMS.push(p); return p; };

reg('tok', V, D, 0.08);
reg('pos', T_MAX, D, 0.08);
for (let l = 0; l < LAYERS; l++) {
  reg(`ln1g${l}`, 1, D, 0); P[`ln1g${l}`].d.fill(1);
  reg(`ln1b${l}`, 1, D, 0);
  reg(`wq${l}`, D, D, 0.08); reg(`wk${l}`, D, D, 0.08);
  reg(`wv${l}`, D, D, 0.08); reg(`wo${l}`, D, D, 0.04);
  reg(`ln2g${l}`, 1, D, 0); P[`ln2g${l}`].d.fill(1);
  reg(`ln2b${l}`, 1, D, 0);
  reg(`w1${l}`, D, DMLP, 0.08); reg(`b1${l}`, 1, DMLP, 0);
  reg(`w2${l}`, DMLP, D, 0.04); reg(`b2${l}`, 1, D, 0);
}
reg('lnfg', 1, D, 0); P.lnfg.d.fill(1);
reg('lnfb', 1, D, 0);

function forward(ids) {
  const T = ids.length;
  let x = add(gather(P.tok, ids), gather(P.pos, Array.from({ length: T }, (_, i) => i)));
  const attnW = []; // [layer][head] softmax matrices (data only, for inspection)
  for (let l = 0; l < LAYERS; l++) {
    const h1 = lnRow(x, P[`ln1g${l}`], P[`ln1b${l}`]);
    const Q = mm(h1, P[`wq${l}`]), K = mm(h1, P[`wk${l}`]), Vv = mm(h1, P[`wv${l}`]);
    let attnOut = null;
    const perHead = [];
    for (let h = 0; h < HEADS; h++) {
      const Qh = sliceCols(Q, h * DH, DH);
      const Kh = sliceCols(K, h * DH, DH);
      const Vh = sliceCols(Vv, h * DH, DH);
      const S = scale(mmT(Qh, Kh), 1 / Math.sqrt(DH));
      const W = causalSoftmax(S);
      perHead.push(W);
      const Oh = mm(W, Vh);
      const part = mm(Oh, sliceRows(P[`wo${l}`], h * DH, DH));
      attnOut = attnOut ? add(attnOut, part) : part;
    }
    attnW.push(perHead);
    x = add(x, attnOut);
    const h2 = lnRow(x, P[`ln2g${l}`], P[`ln2b${l}`]);
    const m = addRow(mm(h2, P[`w1${l}`]), P[`b1${l}`]);
    const m2 = addRow(mm(gelu(m), P[`w2${l}`]), P[`b2${l}`]);
    x = add(x, m2);
  }
  const xf = lnRow(x, P.lnfg, P.lnfb);
  const logits = mmT(xf, P.tok);
  return { logits, attnW };
}

/* ---------- Adam ---------- */
const M = PARAMS.map((p) => new Float32Array(p.d.length));
const Vm = PARAMS.map((p) => new Float32Array(p.d.length));
let adamT = 0;
function adamStep(lr) {
  adamT++;
  const b1 = 0.9, b2 = 0.999;
  const c1 = 1 - Math.pow(b1, adamT), c2 = 1 - Math.pow(b2, adamT);
  PARAMS.forEach((p, k) => {
    for (let i = 0; i < p.d.length; i++) {
      const g = p.g[i];
      M[k][i] = b1 * M[k][i] + (1 - b1) * g;
      Vm[k][i] = b2 * Vm[k][i] + (1 - b2) * g * g;
      p.d[i] -= lr * (M[k][i] / c1) / (Math.sqrt(Vm[k][i] / c2) + 1e-8);
    }
  });
}
const zeroGrads = () => PARAMS.forEach((p) => p.g.fill(0));

/* ---------- data ---------- */
const encode = (words) => words.map((w) => {
  const id = tokId.get(w);
  if (id == null) throw new Error('OOV: ' + w);
  return id;
});
const evalRng = mulberry32(999);
const HELD = Array.from({ length: 400 }, () => genSentence(evalRng));

/* ---------- train ---------- */
console.log(`vocab ${V} · params ${PARAMS.reduce((a, p) => a + p.d.length, 0)}`);
const t0 = Date.now();
for (let step = 0; step < STEPS; step++) {
  zeroGrads();
  let lossAcc = 0;
  for (let b = 0; b < BATCH; b++) {
    TAPE = [];
    const ids = encode(genSentence(rng).words);
    const { logits } = forward(ids);
    const { loss, back } = ceLoss(logits, ids);
    lossAcc += loss;
    back();
    backward();
  }
  // grads accumulated over batch; scale inside adam via lr/BATCH-equivalent
  PARAMS.forEach((p) => { for (let i = 0; i < p.g.length; i++) p.g[i] /= BATCH; });
  const prog = step / STEPS;
  const lr = LR1 + 0.5 * (LR0 - LR1) * (1 + Math.cos(Math.PI * prog));
  adamStep(lr);
  if (step % 250 === 0 || step === STEPS - 1) {
    console.log(`step ${String(step).padStart(4)}  loss ${(lossAcc / BATCH).toFixed(4)}  lr ${lr.toFixed(5)}`);
  }
}
console.log(`trained in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

/* ---------- eval ---------- */
const noGrad = (ids) => { TAPE = []; return forward(ids); };
const softmaxRow = (arr) => {
  const mx = Math.max(...arr);
  const e = arr.map((v) => Math.exp(v - mx));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
};

let correct = 0, total = 0;
let agreeOk = 0, agreeN = 0, possOk = 0, possN = 0, distrOk = 0, distrN = 0;
for (const { words, meta } of HELD) {
  const ids = encode(words);
  const { logits } = noGrad(ids);
  const Vc = logits.c;
  for (let i = 0; i < ids.length - 1; i++) {
    let best = 0;
    for (let j = 1; j < Vc; j++) if (logits.d[i * Vc + j] > logits.d[i * Vc + best]) best = j;
    if (best === ids[i + 1]) correct++;
    total++;
  }
  if (meta.verbPos > 0) {
    const row = meta.verbPos - 1;
    const probs = softmaxRow(Array.from(logits.d.subarray(row * Vc, (row + 1) * Vc)));
    let sg = 0, pl = 0;
    for (const [a, b] of VERB_PAIRS) { sg += probs[tokId.get(a)]; pl += probs[tokId.get(b)]; }
    const ok = meta.plural ? pl > sg : sg > pl;
    agreeOk += ok ? 1 : 0; agreeN++;
    if (meta.distractorPos > 0) { distrOk += ok ? 1 : 0; distrN++; }
  }
  if (meta.possPos > 0) {
    const row = meta.possPos - 1;
    const probs = softmaxRow(Array.from(logits.d.subarray(row * Vc, (row + 1) * Vc)));
    const ok = meta.plural
      ? probs[tokId.get('their')] > probs[tokId.get('its')]
      : probs[tokId.get('its')] > probs[tokId.get('their')];
    possOk += ok ? 1 : 0; possN++;
  }
}
console.log(`held-out top-1: ${(correct / total * 100).toFixed(1)}%`);
console.log(`verb agreement: ${(agreeOk / agreeN * 100).toFixed(1)}%  (${agreeN})`);
console.log(`  across distractor: ${distrN ? (distrOk / distrN * 100).toFixed(1) : '—'}%  (${distrN})`);
console.log(`its/their agreement: ${(possOk / possN * 100).toFixed(1)}%  (${possN})`);

/* sample generations (greedy + temperature) */
function generate(temp, seed) {
  const r = mulberry32(seed);
  const ids = [tokId.get(BOS)];
  for (let step = 0; step < T_MAX - 1; step++) {
    const { logits } = noGrad(ids);
    const row = ids.length - 1;
    const arr = Array.from(logits.d.subarray(row * V, (row + 1) * V));
    let next;
    if (temp === 0) {
      next = arr.indexOf(Math.max(...arr));
    } else {
      const p = softmaxRow(arr.map((v) => v / temp));
      let u = r(), acc = 0;
      next = V - 1;
      for (let j = 0; j < V; j++) { acc += p[j]; if (u < acc) { next = j; break; } }
    }
    ids.push(next);
    if (VOCAB[next] === '.') break;
  }
  return ids.map((i) => VOCAB[i]).join(' ');
}
console.log('greedy :', generate(0, 1));
for (let k = 0; k < 6; k++) console.log('t=0.9  :', generate(0.9, 100 + k));

/* attention inspection: verb→subject vs verb→distractor, per head */
console.log('\nattention (verb-position query), averaged over held-out:');
const acc = Array.from({ length: LAYERS }, () => Array.from({ length: HEADS }, () => ({ subj: 0, dist: 0, prev: 0, bos: 0, n: 0 })));
for (const { words, meta } of HELD) {
  if (meta.verbPos <= 0) continue;
  const ids = encode(words);
  const { attnW } = noGrad(ids);
  for (let l = 0; l < LAYERS; l++) for (let h = 0; h < HEADS; h++) {
    const W = attnW[l][h];
    const row = meta.verbPos;
    const a = acc[l][h];
    a.subj += W.d[row * W.c + meta.subjPos];
    if (meta.distractorPos > 0) a.dist += W.d[row * W.c + meta.distractorPos];
    a.prev += W.d[row * W.c + (row - 1)];
    a.bos += W.d[row * W.c + 0];
    a.n++;
  }
}
for (let l = 0; l < LAYERS; l++) for (let h = 0; h < HEADS; h++) {
  const a = acc[l][h];
  console.log(`L${l}H${h}: subj ${(a.subj / a.n).toFixed(2)}  distractor ${(a.dist / a.n).toFixed(2)}  prev ${(a.prev / a.n).toFixed(2)}  bos ${(a.bos / a.n).toFixed(2)}`);
}

/* ---------- export ---------- */
const round = (arr) => Array.from(arr, (v) => Math.round(v * 1e5) / 1e5);
const out = {
  config: { V, D, HEADS, DH, LAYERS, DMLP, T_MAX },
  vocab: VOCAB,
  tok: round(P.tok.d), pos: round(P.pos.d),
  layers: Array.from({ length: LAYERS }, (_, l) => ({
    ln1g: round(P[`ln1g${l}`].d), ln1b: round(P[`ln1b${l}`].d),
    wq: round(P[`wq${l}`].d), wk: round(P[`wk${l}`].d),
    wv: round(P[`wv${l}`].d), wo: round(P[`wo${l}`].d),
    ln2g: round(P[`ln2g${l}`].d), ln2b: round(P[`ln2b${l}`].d),
    w1: round(P[`w1${l}`].d), b1: round(P[`b1${l}`].d),
    w2: round(P[`w2${l}`].d), b2: round(P[`b2${l}`].d),
  })),
  lnfg: round(P.lnfg.d), lnfb: round(P.lnfb.d),
};
const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'weights.json');
writeFileSync(dest, JSON.stringify(out));
console.log(`\nwrote ${dest} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
