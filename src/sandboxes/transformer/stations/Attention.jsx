import { useState, useEffect } from 'react';
import { useTx, VecStrip, Bars, ArcDiagram, Card, Panel } from '../bits.jsx';
import { CFG } from '../model.js';

/* Station ②: one attention head, end to end, on real numbers. */
export default function Attention({ fwd, fwdNoMask, dispWords }) {
  const { S } = useTx();
  const T = fwd.T;
  const [l, setL] = useState(1);
  const [h, setH] = useState(0);
  // default query = the position that predicts the last content word
  // (e.g. "cat" in "…the cat sit ." — the row where agreement is decided)
  const defQ = Math.max(0, T - 3);
  const [query, setQuery] = useState(defQ);
  const [causal, setCausal] = useState(true);
  const [step, setStep] = useState(null);

  useEffect(() => { setQuery(Math.max(0, T - 3)); }, [T]);

  const src = causal ? fwd : fwdNoMask;
  const layer = src.layers[l];
  const head = layer.heads[h];
  const off = h * CFG.DH;
  const q = Math.min(query, T - 1);

  const qVec = Array.from({ length: CFG.DH }, (_, p) => layer.Q[q * CFG.D + off + p]);
  const scores = Array.from({ length: T }, (_, j) => head.scores[q * T + j]);
  const weights = Array.from({ length: T }, (_, j) => head.weights[q * T + j]);
  const outVec = Array.from({ length: CFG.DH }, (_, p) => head.headOut[q * CFG.DH + p]);
  const argmax = weights.indexOf(Math.max(...weights));
  const wSum = weights.reduce((a, b) => a + b, 0);

  const bright = step == null ? [0, 1, 2, 3] : [[0, 1], [1], [1], [2], [3]][step];
  const dim = (idx) => step != null && !bright.includes(idx);

  const hintKey = `L${l}H${h}`;
  const hint = S.headHints[hintKey] || S.headHints.default;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title={S.attnTitle}>{S.attnCap}</Card>

      {/* controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>{S.headLabel}</span>
        <span style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
          {Array.from({ length: CFG.LAYERS * CFG.HEADS }, (_, i) => {
            const li = Math.floor(i / CFG.HEADS), hi = i % CFG.HEADS;
            const on = li === l && hi === h;
            return (
              <button key={i} onClick={() => { setL(li); setH(hi); }} style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                border: 0, borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                padding: '5px 9px',
                background: on ? 'var(--accent-soft)' : 'var(--bg)',
                color: on ? 'var(--accent)' : 'var(--fg-3)',
              }}>
                L{li}H{hi}
              </button>
            );
          })}
        </span>
        <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>{S.maskLabel}</span>
        <span style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
          {[[true, S.maskOn], [false, S.maskOff]].map(([v, label]) => (
            <button key={label} onClick={() => setCausal(v)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
              border: 0, padding: '5px 11px',
              background: causal === v ? 'var(--accent-soft)' : 'var(--bg)',
              color: causal === v ? 'var(--accent)' : 'var(--fg-3)',
            }}>
              {label}
            </button>
          ))}
        </span>
      </div>

      {/* arcs + tokens */}
      <div>
        <ArcDiagram words={dispWords} query={q} weights={head.weights} T={T} />
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {dispWords.map((_, i) => (
            <button key={i} onClick={() => setQuery(i)} title="query"
              style={{
                width: 72, flex: 'none', height: 6, borderRadius: 3, cursor: 'pointer',
                border: 'none',
                background: i === q ? 'var(--accent)' : 'var(--border)',
              }} />
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 4 }}>{S.queryHint}</div>
      </div>

      {/* step chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {S.stepChips.map((c, i) => (
          <button key={i} onClick={() => setStep(step === i ? null : i)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer',
            padding: '5px 12px', borderRadius: 999,
            border: '1px solid ' + (step === i ? 'var(--accent)' : 'var(--border)'),
            background: step === i ? 'var(--accent-soft)' : 'var(--bg)',
            color: step === i ? 'var(--accent)' : 'var(--fg-2)',
          }}>
            {i + 1} {c}
          </button>
        ))}
      </div>
      {step != null && (
        <div style={{ fontSize: 14.5, color: 'var(--fg-2)', marginTop: -8 }}>{S.stepCaps[step]}</div>
      )}

      {/* pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <Panel label={S.qVec + ` · "${dispWords[q]}"`} dim={dim(0)}>
          <VecStrip vec={qVec} cellW={16} h={20} scale={1.5} />
          <div style={{ height: 10 }} />
          <div className="tx-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 6 }}>{S.kVecs}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {dispWords.map((w, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="tx-mono" style={{ fontSize: 11.5, width: 56, textAlign: 'right', color: 'var(--fg-3)' }}>
                  {w === '<s>' ? '⟨s⟩' : w}
                </span>
                <VecStrip vec={Array.from({ length: CFG.DH }, (_, p) => layer.K[j * CFG.D + off + p])} cellW={9} h={11} scale={1.5} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel label={S.scores} dim={dim(1)}>
          <Bars items={dispWords.map((w, j) => ({
            label: w, value: scores[j],
            masked: causal && j > q,
          }))} />
        </Panel>

        <Panel label={`${S.weightsBar} · Σ = ${wSum.toFixed(2)}`} dim={dim(2)}>
          <Bars maxAbs={1} items={dispWords.map((w, j) => ({
            label: w, value: weights[j],
            masked: causal && j > q,
            hl: j === argmax,
          }))} />
        </Panel>

        <Panel label={S.vVecs} dim={dim(3)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {dispWords.map((w, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.15 + weights[j] * 0.85 }}>
                <span className="tx-mono" style={{ fontSize: 11.5, width: 56, textAlign: 'right', color: 'var(--fg-3)' }}>
                  {w === '<s>' ? '⟨s⟩' : w}
                </span>
                <VecStrip vec={Array.from({ length: CFG.DH }, (_, p) => layer.V[j * CFG.D + off + p])} cellW={9} h={11} scale={1.5} />
                <span className="tx-mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>×{weights[j].toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 10 }} />
          <div className="tx-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 5 }}>{S.outVec}</div>
          <VecStrip vec={outVec} cellW={16} h={20} scale={1.5} />
        </Panel>
      </div>

      <Card accent="#b26a00">{hint}</Card>
    </div>
  );
}
