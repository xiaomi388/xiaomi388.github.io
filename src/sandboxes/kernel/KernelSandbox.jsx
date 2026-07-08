import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createScene, THEMES } from './scene.js';
import {
  TOTAL, CHAPTERS, chapterAt, CODE_SEGMENTS, UI_STR,
  FOCUS_BLOCK, FOCUS_TID, blockSchedule,
} from './script.js';

/* Monokai token colors for the hand-tokenized code panel */
const TOK = {
  k: '#f92672',
  n: '#66d9ef',
  f: '#a6e22e',
  c: '#75715e',
  '': '#f8f8f2',
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function KernelSandbox({ lang = 'en', theme = 'light' }) {
  const s = UI_STR[lang];
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const sceneRef = useRef(null);
  const clockRef = useRef({ t: 0, playing: true, speed: 1, yaw: 0, pitch: 0, dragging: false });

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [coalesced, setCoalesced] = useState(true);
  const [selBlock, setSelBlock] = useState(FOCUS_BLOCK);
  const [selTid, setSelTid] = useState(FOCUS_TID);
  const [codeOpen, setCodeOpen] = useState(true);
  const [tooltip, setTooltip] = useState(null); // {x, y, text}
  const [failed, setFailed] = useState(false);
  const [hintOn, setHintOn] = useState(true);

  const coalescedRef = useRef(coalesced);
  coalescedRef.current = coalesced;
  const selRef = useRef({ selBlock, selTid });
  selRef.current = { selBlock, selTid };

  const ch = chapterAt(t);

  /* scene + master clock */
  useEffect(() => {
    const scene = createScene(canvasRef.current);
    if (!scene) { setFailed(true); return undefined; }
    sceneRef.current = scene;

    const wrap = wrapRef.current;
    const doResize = () => scene.resize(wrap.clientWidth, wrap.clientHeight);
    doResize();
    const ro = new ResizeObserver(doResize);
    ro.observe(wrap);

    let raf;
    let last = performance.now();
    const loop = (now) => {
      const c = clockRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (c.playing) {
        c.t += dt * c.speed;
        if (c.t >= TOTAL) { c.t = TOTAL; c.playing = false; setPlaying(false); }
        setT(c.t);
      }
      if (!c.dragging) {
        const decay = Math.min(1, dt * 2.2);
        c.yaw += (0 - c.yaw) * decay;
        c.pitch += (0 - c.pitch) * decay;
      }
      scene.update(c.t, {
        yaw: c.yaw,
        pitch: c.pitch,
        coalesced: coalescedRef.current,
        selBlock: selRef.current.selBlock,
        selTid: selRef.current.selTid,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const hintTimer = setTimeout(() => setHintOn(false), 8000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hintTimer);
      ro.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setTheme(theme);
  }, [theme, failed]);

  /* drag-to-look + click-to-pick */
  const downRef = useRef(null);
  const onPointerDown = (e) => {
    downRef.current = { x: e.clientX, y: e.clientY, moved: false };
    clockRef.current.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = downRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    if (d.moved) {
      clockRef.current.yaw = Math.max(-0.6, Math.min(0.6, clockRef.current.yaw - e.movementX * 0.004));
      clockRef.current.pitch = Math.max(-0.4, Math.min(0.4, clockRef.current.pitch - e.movementY * 0.003));
    }
  };
  const onPointerUp = (e) => {
    const d = downRef.current;
    downRef.current = null;
    clockRef.current.dragging = false;
    if (!d || d.moved || !sceneRef.current) return;
    const hit = sceneRef.current.pick(e.clientX, e.clientY, chapterAt(clockRef.current.t).id);
    if (!hit) { setTooltip(null); return; }
    if (hit.type === 'block') {
      setSelBlock(hit.id);
      setTooltip({
        x: e.clientX, y: e.clientY,
        text: s.blockNote(hit.id, blockSchedule(hit.id).sm),
      });
    } else if (hit.type === 'lane') {
      setSelTid(hit.id);
      setTooltip({ x: e.clientX, y: e.clientY, text: s.laneNote(FOCUS_BLOCK, hit.id) });
    }
  };
  useEffect(() => {
    if (!tooltip) return undefined;
    const id = setTimeout(() => setTooltip(null), 5000);
    return () => clearTimeout(id);
  }, [tooltip]);

  const seek = (v) => {
    clockRef.current.t = v;
    setT(v);
    setTooltip(null);
  };
  const togglePlay = () => {
    const c = clockRef.current;
    if (!c.playing && c.t >= TOTAL) c.t = 0;
    c.playing = !c.playing;
    setPlaying(c.playing);
  };

  /* the annotation line under the code panel, per chapter */
  const annotation =
    ch.id === 2 ? s.blockNote(selBlock, blockSchedule(selBlock).sm)
    : ch.id === 3 ? s.laneNote(FOCUS_BLOCK, selTid)
    : ch.id === 5 ? s.transactions(coalesced ? 1 : 32)
    : null;

  const zhLang = lang === 'zh' ? 'zh' : undefined;

  if (failed) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column', gap: 12,
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--fg-2)', fontSize: 16, padding: 24,
      }} lang={zhLang}>
        <div>{s.webglFail}</div>
        <Link to={`/${lang}/s/gpu-architecture`} style={{ color: 'var(--accent)' }}>
          {s.webglFallback}
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      lang={zhLang}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {/* drag hint */}
      {hintOn && (
        <div style={{
          position: 'absolute', top: 12, right: 14, fontSize: 13,
          fontFamily: 'var(--font-mono)', color: 'var(--fg-3)',
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 5, padding: '5px 10px', opacity: 0.9, pointerEvents: 'none',
        }}>
          {s.dragHint}
        </div>
      )}

      {/* code panel — Monokai like the blog's code blocks, in both themes */}
      <div style={{ position: 'absolute', top: 14, left: 14, width: 'min(400px, 46vw)' }}>
        <button
          onClick={() => setCodeOpen((v) => !v)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
            background: 'var(--bg)', color: 'var(--fg-2)',
            border: '1px solid var(--border)', borderRadius: 5,
            padding: '4px 10px', marginBottom: 6,
          }}
        >
          {codeOpen ? `▾ ${s.hideCode}` : `▸ ${s.showCode}`}
        </button>
        {codeOpen && (
          <div style={{
            background: '#272822', borderRadius: 8, padding: '10px 0',
            fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.75,
            boxShadow: '0 2px 10px rgba(0,0,0,.25)', overflowX: 'auto',
          }}>
            {CODE_SEGMENTS.map((seg) => {
              const activeSeg = ch.code === seg.id;
              return (
                <div key={seg.id} style={{ opacity: activeSeg ? 1 : 0.45, marginBottom: 6 }}>
                  <div style={{ color: '#75715e', fontSize: 11, padding: '0 14px 2px' }}>
                    {seg.label[lang]}
                  </div>
                  {seg.lines.map((line) => {
                    const hl = activeSeg && ch.hl === line.n;
                    return (
                      <div key={line.n} style={{
                        padding: '0 14px', whiteSpace: 'pre',
                        background: hl ? '#49483e' : 'transparent',
                        borderLeft: '3px solid ' + (hl ? 'var(--accent)' : 'transparent'),
                      }}>
                        {line.toks[lang].map((tok, i) => (
                          <span key={i} style={{ color: TOK[tok[1]] }}>{tok[0]}</span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {annotation && (
              <div style={{
                margin: '4px 10px 0', padding: '6px 10px', borderRadius: 5,
                background: '#3e3d32', color: '#e6db74', fontSize: 12,
              }}>
                {annotation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* caption card */}
      <div style={{
        position: 'absolute', left: 14, bottom: 104, maxWidth: 'min(500px, 60vw)',
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)', borderRadius: 5,
        padding: '12px 16px', fontSize: 15, lineHeight: 1.65, color: 'var(--fg-2)',
      }}>
        <div style={{
          fontWeight: 600, color: 'var(--heading)', marginBottom: 4, fontSize: 15,
        }}>
          {ch.id + 1} / {CHAPTERS.length} · {ch.title[lang]}
        </div>
        {ch.cap[lang]}
        {ch.id === 5 && (
          <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{s.accessLabel}</span>
            <span style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
              {[[true, s.coalesced], [false, s.scattered]].map(([v, label]) => (
                <button key={label} onClick={() => setCoalesced(v)} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer',
                  border: 0, padding: '5px 11px',
                  background: coalesced === v ? 'var(--accent-soft)' : 'var(--bg)',
                  color: coalesced === v ? 'var(--accent)' : 'var(--fg-2)',
                }}>
                  {label}
                </button>
              ))}
            </span>
            <span className="gx-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: coalesced ? 'var(--fg-3)' : '#c62828' }}>
              {s.transactions(coalesced ? 1 : 32)}
            </span>
          </div>
        )}
      </div>

      {/* color legend — swatches match the active scene theme */}
      <div style={{
        position: 'absolute', right: 14, bottom: 104,
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 5, padding: '9px 12px',
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.9,
        color: 'var(--fg-2)',
      }}>
        {s.legend.map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{
              width: 11, height: 11, borderRadius: 2, flex: 'none',
              background: (THEMES[theme] || THEMES.light)[key],
              border: '1px solid var(--border)',
            }} />
            {label}
          </div>
        ))}
      </div>

      {/* pick tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x + 12, (wrapRef.current?.clientWidth ?? 800) - 320),
          top: tooltip.y - 44,
          background: 'var(--bg-secondary)', border: '1px solid var(--accent)',
          borderRadius: 5, padding: '6px 10px', fontSize: 13,
          fontFamily: 'var(--font-mono)', color: 'var(--fg)', maxWidth: 320,
          pointerEvents: 'none',
        }}>
          {tooltip.text}
        </div>
      )}

      {/* control bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--bg)', borderTop: '1px solid var(--border)',
        padding: '8px 14px 10px',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 7 }}>
          {CHAPTERS.map((c) => (
            <button key={c.id} onClick={() => seek(c.t0)} style={{
              fontSize: 12.5, cursor: 'pointer', borderRadius: 5, padding: '3px 10px',
              border: '1px solid ' + (c.id === ch.id ? 'var(--accent)' : 'var(--border)'),
              background: c.id === ch.id ? 'var(--accent-soft)' : 'transparent',
              color: c.id === ch.id ? 'var(--accent)' : 'var(--fg-3)',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              {c.id + 1} · {c.title[lang]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={togglePlay} style={{
            fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', border: 0,
            borderRadius: 5, padding: '7px 14px', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {playing ? s.pause : t >= TOTAL ? s.replay : s.play}
          </button>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="range" min={0} max={TOTAL} step={0.05} value={t}
              onChange={(e) => seek(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            {/* chapter ticks */}
            {CHAPTERS.slice(1).map((c) => (
              <span key={c.id} style={{
                position: 'absolute', left: `${(c.t0 / TOTAL) * 100}%`, top: -3,
                width: 1.5, height: 7, background: 'var(--fg-3)', pointerEvents: 'none',
              }} />
            ))}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>
            {fmt(t)} / {fmt(TOTAL)}
          </span>
          <span style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
            {[1, 2].map((v) => (
              <button key={v} onClick={() => { setSpeed(v); clockRef.current.speed = v; }} style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                border: 0, padding: '5px 9px',
                background: speed === v ? 'var(--accent-soft)' : 'var(--bg)',
                color: speed === v ? 'var(--accent)' : 'var(--fg-3)',
              }}>
                {v}×
              </button>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
