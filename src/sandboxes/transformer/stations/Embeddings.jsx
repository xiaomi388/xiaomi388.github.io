import { useTx, MatrixGrid, Card } from '../bits.jsx';
import { VOCAB, CFG, tokId } from '../model.js';
import { PRESETS } from '../strings.js';

/* Station ①: sentence → token ids → embedding matrix (+ positions). */
export default function Embeddings({ words, setWords, fwd, dispWords }) {
  const { S } = useTx();
  const T = fwd.T;
  const maxEditable = CFG.T_MAX - 2; // minus BOS and '.'

  const body = words.slice(0, -1); // editable words, '.' stays last
  const addWord = (w) => {
    if (!w || body.length >= maxEditable) return;
    setWords([...body, w, '.']);
  };
  const removeAt = (i) => {
    if (body.length <= 1) return;
    setWords([...body.slice(0, i), ...body.slice(i + 1), '.']);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title={S.embTitle}>{S.embCap}</Card>

      {/* sentence picker / builder */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>{S.presetLabel}</span>
        <select
          onChange={(e) => { if (e.target.value !== '') setWords(PRESETS[Number(e.target.value)]); }}
          value={PRESETS.findIndex((p) => p.join(' ') === words.join(' '))}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13, padding: '5px 8px',
            background: 'var(--bg)', color: 'var(--fg)',
            border: '1px solid var(--border-strong)', borderRadius: 5,
          }}
        >
          <option value={-1}>…</option>
          {PRESETS.map((p, i) => (
            <option key={i} value={i}>{p.slice(0, -1).join(' ')}</option>
          ))}
        </select>
        <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>{S.addWord}</span>
        <select
          value=""
          onChange={(e) => addWord(e.target.value)}
          disabled={body.length >= maxEditable}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13, padding: '5px 8px',
            background: 'var(--bg)', color: 'var(--fg)',
            border: '1px solid var(--border-strong)', borderRadius: 5,
          }}
        >
          <option value="">—</option>
          {VOCAB.slice(2).map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {/* the sentence as removable pills, with ids underneath */}
      <div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {dispWords.map((w, i) => {
            const removable = i > 0 && i < dispWords.length - 1 && body.length > 1;
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <button
                  onClick={removable ? () => removeAt(i - 1) : undefined}
                  title={removable ? '×' : undefined}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 13, padding: '4px 10px',
                    borderRadius: 5, border: '1px solid var(--border)',
                    background: 'var(--bg)', color: 'var(--fg)',
                    cursor: removable ? 'pointer' : 'default',
                  }}
                >
                  {w === '<s>' ? '⟨s⟩' : w}{removable ? ' ×' : ''}
                </button>
                <div className="tx-mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 3 }}>
                  {tokId.get(w)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="tx-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 4 }}>
          ↑ {S.embIds}
        </div>
      </div>

      {/* tok + pos = x, as real heatmaps */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {[
          [fwd.emb, S.embTok],
          [fwd.posE, S.embPos],
          [fwd.x0, S.embSum],
        ].map(([flat, label], k) => (
          <div key={k}>
            <div style={{ fontSize: 13.5, color: k === 2 ? 'var(--fg)' : 'var(--fg-2)', marginBottom: 6, maxWidth: 260, fontWeight: k === 2 ? 600 : 400 }}>
              {label}
            </div>
            <MatrixGrid flat={flat} T={T} D={CFG.D} words={dispWords} />
            <div className="tx-mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 3 }}>
              {T} × {CFG.D}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
