/* Shared atoms for the transformer sandbox: theme-aware diverging colors,
   vector strips, matrix heatmaps, token rows, bars, and the attention arc
   diagram. Everything reads the site design tokens. */
import { createContext, useContext } from 'react';

export const TxCtx = createContext({ lang: 'en', theme: 'light', S: null });
export const useTx = () => useContext(TxCtx);

/* ---------- diverging color scale (blue ← 0 → red) ---------- */
const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const NEG = hex2rgb('#1565c0');
const POS = hex2rgb('#c62828');
const BG = { light: hex2rgb('#fafafa'), dark: hex2rgb('#2c2c2c') };
const NEG_D = hex2rgb('#64a5e8');
const POS_D = hex2rgb('#e57373');

export function cellColor(v, theme, scale = 2) {
  const t = Math.max(-1, Math.min(1, v / scale));
  const dark = theme === 'dark';
  const target = t < 0 ? (dark ? NEG_D : NEG) : (dark ? POS_D : POS);
  const bg = BG[dark ? 'dark' : 'light'];
  const a = Math.abs(t);
  const mix = bg.map((b, i) => Math.round(b + (target[i] - b) * a));
  return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
}

const fmt = (v, d = 2) => (v >= 0 ? '+' : '') + v.toFixed(d);

/* ---------- a horizontal strip for one vector ---------- */
export function VecStrip({ vec, cellW = 6, h = 16, scale = 2, label }) {
  const { theme } = useTx();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        {Array.from(vec, (v, i) => (
          <span key={i} title={`[${i}] ${fmt(v, 3)}`}
            style={{ width: cellW, height: h, background: cellColor(v, theme, scale), display: 'block' }} />
        ))}
      </span>
      {label && <span className="tx-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{label}</span>}
    </span>
  );
}

/* ---------- matrix heatmap: dims down, tokens across ---------- */
export function MatrixGrid({ flat, T, D, words, cellW = 14, cellH = 4, scale = 2 }) {
  const { theme } = useTx();
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: T }, (_, tk) => (
        <div key={tk} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          {Array.from({ length: D }, (_, d) => {
            const v = flat[tk * D + d];
            return (
              <span key={d} title={`${words ? words[tk] : tk}[${d}] = ${fmt(v, 3)}`}
                style={{ width: cellW, height: cellH, background: cellColor(v, theme, scale), display: 'block' }} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ---------- attention pattern (T×T) as a small heatmap ---------- */
export function AttnGrid({ weights, T, words, cell = 13, onHover }) {
  const { theme } = useTx();
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
      {Array.from({ length: T }, (_, i) => (
        <div key={i} style={{ display: 'flex' }}>
          {Array.from({ length: T }, (_, j) => {
            const w = weights[i * T + j];
            return (
              <span key={j}
                title={`q="${words[i]}" → k="${words[j]}"  w=${w.toFixed(2)}`}
                onMouseEnter={onHover ? () => onHover(i, j, w) : undefined}
                style={{
                  width: cell, height: cell, display: 'block',
                  background: cellColor(w * 2.2, theme, 1),
                  opacity: j > i ? 0.15 : 1,
                }} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ---------- token pills ---------- */
export function TokenRow({ words, sel, onSel, cachedUpTo = -1, pitch }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: pitch ? 'nowrap' : 'wrap' }}>
      {words.map((w, i) => {
        const isSel = i === sel;
        const cached = i <= cachedUpTo;
        return (
          <button key={i} onClick={onSel ? () => onSel(i) : undefined}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 13,
              padding: '4px 0', width: pitch || undefined,
              minWidth: pitch ? undefined : 40,
              paddingLeft: pitch ? 0 : 10, paddingRight: pitch ? 0 : 10,
              textAlign: 'center',
              borderRadius: 5, cursor: onSel ? 'pointer' : 'default',
              border: '1px solid ' + (isSel ? 'var(--accent)' : 'var(--border)'),
              background: isSel ? 'var(--accent-soft)' : cached ? 'var(--bg-secondary)' : 'var(--bg)',
              color: isSel ? 'var(--accent)' : cached ? 'var(--fg-3)' : 'var(--fg)',
              opacity: cached ? 0.75 : 1,
            }}>
            {w === '<s>' ? '⟨s⟩' : w}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- horizontal bars with real values ---------- */
export function Bars({ items, maxAbs }) {
  const mx = maxAbs ?? Math.max(0.0001, ...items.map((it) => Math.abs(it.value)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: it.masked ? 0.45 : 1 }}>
          <span className="tx-mono" style={{ fontSize: 12, width: 64, textAlign: 'right', color: it.hl ? 'var(--accent)' : 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {it.label === '<s>' ? '⟨s⟩' : it.label}
          </span>
          <div style={{ flex: 1, height: 13, background: 'var(--bg-secondary)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0,
              width: `${Math.abs(it.value) / mx * 100}%`,
              background: it.masked
                ? 'repeating-linear-gradient(45deg, var(--border-strong) 0 4px, transparent 4px 8px)'
                : it.value < 0 ? '#8ea8c8' : it.hl ? 'var(--accent)' : '#b26a00',
              borderRadius: 3,
            }} />
          </div>
          <span className="tx-mono" style={{ fontSize: 11.5, width: 52, color: 'var(--fg-3)' }}>
            {it.masked ? '—' : it.value.toFixed(it.digits ?? 2)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- attention arcs above a token row ---------- */
export function ArcDiagram({ words, query, weights, T, pitch = 72, height = 74 }) {
  const cx = (i) => i * (pitch + 6) + pitch / 2;
  const width = T * (pitch + 6);
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {Array.from({ length: T }, (_, j) => {
          const w = weights[query * T + j];
          if (j === query || w < 0.01) return null;
          const x1 = cx(query), x2 = cx(j);
          const mid = (x1 + x2) / 2;
          const lift = Math.min(height - 8, 18 + Math.abs(x2 - x1) * 0.22);
          return (
            <path key={j}
              d={`M ${x1} ${height} Q ${mid} ${height - lift} ${x2} ${height}`}
              fill="none" stroke="var(--accent)"
              strokeWidth={1 + w * 7} strokeLinecap="round" opacity={0.25 + w * 0.75}>
              <title>{`${words[query]} → ${words[j]}  w = ${w.toFixed(2)}`}</title>
            </path>
          );
        })}
        {/* self weight shown as a dot above the query */}
        {weights[query * T + query] > 0.01 && (
          <circle cx={cx(query)} cy={height - 8} r={2 + weights[query * T + query] * 6}
            fill="var(--accent)" opacity={0.5}>
            <title>{`self  w = ${weights[query * T + query].toFixed(2)}`}</title>
          </circle>
        )}
      </svg>
      <div style={{ display: 'flex', gap: 6 }}>
        {words.map((w, i) => (
          <span key={i} className="tx-mono" style={{
            width: pitch, textAlign: 'center', fontSize: 13, padding: '4px 0',
            borderRadius: 5, flex: 'none',
            border: '1px solid ' + (i === query ? 'var(--accent)' : 'var(--border)'),
            background: i === query ? 'var(--accent-soft)' : 'var(--bg)',
            color: i === query ? 'var(--accent)' : 'var(--fg)',
          }}>
            {w === '<s>' ? '⟨s⟩' : w}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- station section chrome ---------- */
export function Card({ title, children, accent }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${accent || 'var(--accent)'}`, borderRadius: 5,
      padding: '12px 16px', fontSize: 15.5, lineHeight: 1.7, color: 'var(--fg-2)',
    }}>
      {title && <div style={{ fontWeight: 600, color: 'var(--heading)', marginBottom: 4 }}>{title}</div>}
      {children}
    </div>
  );
}

export function Panel({ label, children, dim }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px',
      background: 'var(--bg)', opacity: dim ? 0.45 : 1, transition: 'opacity .2s',
    }}>
      {label && (
        <div className="tx-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
