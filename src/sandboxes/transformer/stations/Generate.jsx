import { useState, useRef, useEffect, useMemo } from 'react';
import { useTx, Bars, TokenRow, ArcDiagram, Card, Panel } from '../bits.jsx';
import { VOCAB, CFG, encode, forward, nextDistribution, sampleNext, BOS, EOS } from '../model.js';

const PREFIXES = [['the'], ['a'], ['the', 'dogs', 'near']];

/* Station ④: real autoregressive sampling from the toy model. */
export default function Generate() {
  const { S } = useTx();
  const [seq, setSeq] = useState([BOS, 'the']);
  const [temp, setTemp] = useState(0.9);
  const [greedy, setGreedy] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const done = seq[seq.length - 1] === EOS || seq.length >= CFG.T_MAX;
  const ids = useMemo(() => encode(seq), [seq]);
  const probs = useMemo(() => nextDistribution(ids, greedy ? 1 : temp), [ids, greedy, temp]);
  const top = useMemo(() => (
    probs
      .map((p, id) => ({ p, id }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 8)
  ), [probs]);

  const stepOnce = () => {
    setSeq((cur) => {
      if (cur[cur.length - 1] === EOS || cur.length >= CFG.T_MAX) return cur;
      const { id } = sampleNext(encode(cur), { temp, greedy, rand: Math.random() });
      return [...cur, VOCAB[id]];
    });
  };
  const runAll = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setSeq((cur) => {
        if (cur[cur.length - 1] === EOS || cur.length >= CFG.T_MAX) {
          clearInterval(timer.current);
          return cur;
        }
        const { id } = sampleNext(encode(cur), { temp, greedy, rand: Math.random() });
        return [...cur, VOCAB[id]];
      });
    }, 380);
  };
  const restart = (prefix) => {
    clearInterval(timer.current);
    setSeq([BOS, ...(prefix ?? ['the'])]);
  };

  /* the subject-finder head's view from the newest token */
  const fwd = useMemo(() => forward(ids), [ids]);
  const lookWeights = fwd.layers[1].heads[0].weights;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title={S.genTitle}>{S.genCap}</Card>

      {/* controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={stepOnce} disabled={done} style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, cursor: done ? 'not-allowed' : 'pointer',
          background: 'var(--accent)', color: '#fff', border: 0, borderRadius: 5,
          padding: '8px 14px', fontWeight: 600, opacity: done ? 0.4 : 1,
        }}>
          {S.nextBtn}
        </button>
        <button onClick={runAll} disabled={done} style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, cursor: done ? 'not-allowed' : 'pointer',
          background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border-strong)',
          borderRadius: 5, padding: '8px 12px', opacity: done ? 0.4 : 1,
        }}>
          {S.autoBtn}
        </button>
        <button onClick={() => restart()} style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer',
          background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border-strong)',
          borderRadius: 5, padding: '8px 12px',
        }}>
          {S.genReset}
        </button>
        <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>{S.prefixLabel}</span>
        <span style={{ display: 'inline-flex', gap: 6 }}>
          {PREFIXES.map((p, i) => (
            <button key={i} onClick={() => restart(p)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
              padding: '5px 10px', borderRadius: 5,
              border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg-2)',
            }}>
              {p.join(' ')}…
            </button>
          ))}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
          {[[false, S.sampleLabel], [true, S.greedyLabel]].map(([v, label]) => (
            <button key={label} onClick={() => setGreedy(v)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
              border: 0, padding: '5px 12px',
              background: greedy === v ? 'var(--accent-soft)' : 'var(--bg)',
              color: greedy === v ? 'var(--accent)' : 'var(--fg-3)',
            }}>
              {label}
            </button>
          ))}
        </span>
        <span style={{ fontSize: 14, color: greedy ? 'var(--fg-3)' : 'var(--fg-2)' }}>
          {S.tempLabel} <span className="tx-mono">{temp.toFixed(1)}</span>
        </span>
        <input
          type="range" min={0.1} max={2} step={0.1} value={temp} disabled={greedy}
          onChange={(e) => setTemp(Number(e.target.value))}
          style={{ width: 160, accentColor: 'var(--accent)', opacity: greedy ? 0.4 : 1 }}
        />
      </div>

      {/* the growing sequence; all but the last position are "cached" */}
      <div>
        <TokenRow words={seq} sel={seq.length - 1} cachedUpTo={seq.length - 2} />
        <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 6 }}>{S.cachedNote}</div>
      </div>

      {done && <Card accent="#2e7d32">{S.doneNote}</Card>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        <Panel label={S.probsTitle}>
          <Bars maxAbs={Math.max(...top.map((t) => t.p))} items={top.map(({ p, id }, i) => ({
            label: VOCAB[id], value: p, hl: i === 0, digits: 3,
          }))} />
        </Panel>
        <Panel label={S.lookNote}>
          <ArcDiagram words={seq} query={seq.length - 1} weights={lookWeights} T={seq.length} pitch={56} height={56} />
        </Panel>
      </div>
    </div>
  );
}
