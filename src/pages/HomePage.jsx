import { useState } from 'react';
import { Link } from 'react-router-dom';

// Site intro + sandbox index with tag filters.
export default function HomePage({ lang, t, sandboxes }) {
  const [filter, setFilter] = useState('all');
  const allTags = [...new Set(sandboxes.flatMap((s) => s.tags))].sort();
  const shown =
    filter === 'all' ? sandboxes : sandboxes.filter((s) => s.tags.includes(filter));

  return (
    <div>
      <section
        style={{
          borderBottom: '1px solid var(--border)',
          padding: 'var(--s-8) 0 var(--s-7)',
        }}
      >
        <div
          className="container"
          style={{ maxWidth: 'var(--container-wide)', textAlign: 'center' }}
        >
          <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--fg)' }}>
            {t.heading}
          </h1>
          <p
            style={{
              marginTop: 'var(--s-4)',
              fontSize: 'var(--fs-md)',
              color: 'var(--fg-2)',
              maxWidth: '52ch',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}
            lang={lang === 'zh' ? 'zh' : undefined}
          >
            {t.subheading}
          </p>
        </div>
      </section>

      <div
        className="container"
        style={{
          maxWidth: 'var(--container-wide)',
          paddingTop: 'var(--s-7)',
          paddingBottom: 'var(--s-9)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--s-2)',
            alignItems: 'center',
            marginBottom: 'var(--s-5)',
          }}
        >
          {['all', ...allTags].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--fs-xs)',
                padding: '0.25em 0.65em',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: filter === tag ? 'var(--accent)' : 'var(--bg)',
                color: filter === tag ? '#fff' : 'var(--fg-3)',
                borderColor: filter === tag ? 'var(--accent)' : 'var(--border)',
                transition: 'all 150ms ease',
              }}
            >
              {tag === 'all' ? t.filterAll : tag}
            </button>
          ))}
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--fg-3)',
            }}
          >
            {shown.length} / {sandboxes.length}
          </span>
        </div>

        <div className="sandbox-list">
          {shown.map((s) => (
            <Link key={s.id} className="sandbox-item" to={`/${lang}/s/${s.id}`}>
              <span className="sandbox-title" lang={lang === 'zh' ? 'zh' : undefined}>
                {s[lang].title}
              </span>
              <span className="sandbox-meta">
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--fg-3)',
                    marginRight: '0.6em',
                  }}
                >
                  {s.cat}
                </span>
                {s.mins} {t.mins}
              </span>
              <span className="sandbox-desc" lang={lang === 'zh' ? 'zh' : undefined}>
                {s[lang].desc}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
