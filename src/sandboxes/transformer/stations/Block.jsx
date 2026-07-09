import { useState } from 'react';
import { useTx, VecStrip, AttnGrid, TokenRow, Card, Panel } from '../bits.jsx';
import { CFG } from '../model.js';

const Arrow = () => (
  <span style={{ color: 'var(--fg-3)', fontSize: 18, alignSelf: 'center' }}>→</span>
);

/* Station ③: the full block — attention (tokens talk) vs MLP (tokens think). */
export default function Block({ fwd, dispWords }) {
  const { S } = useTx();
  const T = fwd.T;
  const [l, setL] = useState(0);
  const [tok, setTok] = useState(T - 2 >= 0 ? T - 2 : 0);
  const layer = fwd.layers[l];
  const tk = Math.min(tok, T - 1);

  const xIn = l === 0 ? fwd.x0 : fwd.layers[l - 1].x2;
  const rowVec = (flat, i, c) => Array.from({ length: c }, (_, j) => flat[i * c + j]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title={S.blockTitle}>{S.blockCap}</Card>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>{S.layerLabel}</span>
        <span style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
          {[0, 1].map((li) => (
            <button key={li} onClick={() => setL(li)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer',
              border: 0, borderLeft: li > 0 ? '1px solid var(--border)' : 'none',
              padding: '5px 14px',
              background: l === li ? 'var(--accent-soft)' : 'var(--bg)',
              color: l === li ? 'var(--accent)' : 'var(--fg-3)',
            }}>
              L{li}
            </button>
          ))}
        </span>
        <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>{S.tokenLabel}</span>
        <TokenRow words={dispWords} sel={tk} onSel={setTok} />
      </div>

      {/* the two moves, side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        <Panel label={`${S.blockAttn} · ${S.blockAttnSub}`}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {layer.heads.map((head, h) => (
              <div key={h} style={{ textAlign: 'center' }}>
                <AttnGrid weights={head.weights} T={T} words={dispWords} cell={Math.max(8, Math.min(15, Math.floor(150 / T)))} />
                <div className="tx-mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 3 }}>
                  {S.headGrid(l, h)}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel label={`${S.blockMlp} · ${S.blockMlpSub}`}>
          <div style={{ fontSize: 13.5, color: 'var(--fg-2)', marginBottom: 8 }}>
            {S.mlpDetail(dispWords[tk] === '<s>' ? '⟨s⟩' : dispWords[tk])}
          </div>
          <VecStrip vec={rowVec(layer.mlpAct, tk, CFG.DMLP)} cellW={6} h={22} scale={1.2} />
        </Panel>
      </div>

      {/* residual stream for the selected token, through this layer */}
      <Panel label={`residual stream · "${dispWords[tk] === '<s>' ? '⟨s⟩' : dispWords[tk]}"`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            [rowVec(xIn, tk, CFG.D), 'x'],
            [rowVec(layer.attnOut, tk, CFG.D), '+ attention out'],
            [rowVec(layer.x1, tk, CFG.D), '= x₁'],
            [rowVec(layer.mlpOut, tk, CFG.D), '+ MLP out'],
            [rowVec(layer.x2, tk, CFG.D), '= x₂ → next layer'],
          ].map(([vec, label], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <VecStrip vec={vec} cellW={9} h={15} />
              <span className="tx-mono" style={{ fontSize: 12, color: i % 2 === 0 ? 'var(--fg)' : 'var(--fg-3)' }}>{label}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* structure summary */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[S.blockAttn.split('—')[0].trim(), S.blockResidual, S.blockLn, S.blockMlp.split('—')[0].trim(), S.blockResidual].map((label, i) => (
          <span key={i} style={{ display: 'flex', gap: 8 }}>
            {i > 0 && <Arrow />}
            <span className="tx-mono" style={{
              fontSize: 12.5, padding: '6px 12px', borderRadius: 5,
              border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--fg-2)',
            }}>
              {label}
            </span>
          </span>
        ))}
        <Arrow />
        <span className="tx-mono" style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>{S.blockRepeat}</span>
      </div>
      <div className="tx-mono" style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: -6 }}>
        {S.blockLogits}
      </div>
    </div>
  );
}
