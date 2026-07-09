import { useState, useMemo } from 'react';
import { TxCtx } from './bits.jsx';
import { STR, PRESETS } from './strings.js';
import { forward, encode, BOS } from './model.js';
import Embeddings from './stations/Embeddings.jsx';
import Attention from './stations/Attention.jsx';
import Block from './stations/Block.jsx';
import Generate from './stations/Generate.jsx';

const TX_CSS = `
.tx * { box-sizing: border-box; }
.tx { font-family: var(--font-body); background: var(--bg); color: var(--fg); min-height: 100%; }
.tx-wrap { max-width: 1080px; margin: 0 auto; padding: 32px 22px 64px; }
.tx-mono { font-family: var(--font-mono); }
.tx-tab { font-weight: 600; font-size: 15px; background: var(--bg); color: var(--fg-2);
  border: 1px solid var(--border); border-radius: 6px; padding: 8px 15px; cursor: pointer;
  transition: .15s; font-family: var(--font-body); }
.tx-tab:hover { color: var(--fg); border-color: var(--border-strong); }
.tx-tab.on { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }
`;

/* The transformer dissection bench: a live 18k-param model, four stations. */
export default function TransformerSandbox({ lang = 'en', theme = 'light' }) {
  const S = STR[lang];
  const [tab, setTab] = useState('emb');
  const [words, setWords] = useState(PRESETS[1]); // "the dogs near the cat sit ."

  const dispWords = useMemo(() => [BOS, ...words], [words]);
  const ids = useMemo(() => encode(dispWords), [dispWords]);
  const fwd = useMemo(() => forward(ids), [ids]);
  const fwdNoMask = useMemo(() => forward(ids, { causal: false }), [ids]);

  const ctx = useMemo(() => ({ lang, theme, S }), [lang, theme, S]);

  return (
    <TxCtx.Provider value={ctx}>
      <div className="tx" lang={lang === 'zh' ? 'zh' : undefined}>
        <style>{TX_CSS}</style>
        <div className="tx-wrap">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {S.stations.map((st) => (
                <button key={st.id} className={'tx-tab' + (tab === st.id ? ' on' : '')}
                  onClick={() => setTab(st.id)}>
                  {st.label}
                </button>
              ))}
            </div>
            <span className="tx-mono" style={{
              fontSize: 12, color: 'var(--tag-fg)', background: 'var(--tag-bg)',
              borderRadius: 6, padding: '4px 9px',
            }}>
              {S.modelBadge}
            </span>
          </div>

          {tab === 'emb' && (
            <Embeddings words={words} setWords={setWords} fwd={fwd} dispWords={dispWords} />
          )}
          {tab === 'attn' && (
            <Attention fwd={fwd} fwdNoMask={fwdNoMask} dispWords={dispWords} />
          )}
          {tab === 'block' && (
            <Block fwd={fwd} dispWords={dispWords} />
          )}
          {tab === 'gen' && <Generate />}
        </div>
      </div>
    </TxCtx.Provider>
  );
}
