import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GpuSandbox from '../sandboxes/gpu/GpuSandbox.jsx';

// Full-screen sandbox view. The chrome is a minimal blog-style app bar;
// everything reads the site's design tokens, so the page follows the
// light/dark toggle like the rest of the site.
export default function SandboxPage({ sandbox, sandboxes, lang, t, theme, setTheme }) {
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const isGpu = sandbox.id === 'gpu-architecture';

  const openSandbox = (s) => {
    setShowInfo(false);
    navigate(`/${lang}/s/${s.id}`);
  };

  const idx = sandboxes.findIndex((s) => s.id === sandbox.id);
  const prev = sandboxes[idx - 1];
  const next = sandboxes[idx + 1];

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)',
        color: 'var(--fg)',
      }}
    >
      {/* Blog-style floating theme toggle, same as the chrome pages */}
      <div className="float-container">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          <i className="fas fa-adjust fa-fw" aria-hidden="true"></i>
        </button>
      </div>

      {/* App bar */}
      <header
        style={{
          height: '52px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 0,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          zIndex: 10,
        }}
      >
        <a
          href={`/${lang}/sandboxes`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/${lang}/sandboxes`);
          }}
          style={{
            fontSize: '16px',
            color: 'var(--accent)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            paddingRight: '16px',
            borderRight: '1px solid var(--border)',
            marginRight: '16px',
          }}
        >
          ← {t.nav.sandboxes}
        </a>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--fg-3)',
            paddingRight: '12px',
            marginRight: '12px',
            borderRight: '1px solid var(--border)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {sandbox.cat}
        </span>

        <span
          style={{
            fontWeight: 600,
            fontSize: '16px',
            color: 'var(--heading)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          lang={lang === 'zh' ? 'zh' : undefined}
        >
          {sandbox[lang].title}
        </span>

        <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
          {sandbox.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '13px',
                padding: '3px 6px',
                borderRadius: '6px',
                background: 'var(--tag-bg)',
                color: 'var(--tag-fg)',
                lineHeight: 1.5,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: '12px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => navigate(`/${lang === 'en' ? 'zh' : 'en'}/s/${sandbox.id}`)}
            title={lang === 'en' ? 'Switch to Chinese' : '切换到英文'}
            style={{
              height: '32px',
              padding: '0 10px',
              border: 'none',
              borderRadius: '4px',
              background: 'transparent',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '15px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            {t.lang}
          </button>
          <button
            onClick={() => setShowInfo((v) => !v)}
            title={lang === 'en' ? 'About this sandbox' : '关于此沙盒'}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid ' + (showInfo ? 'var(--accent)' : 'transparent'),
              borderRadius: '4px',
              background: showInfo ? 'var(--accent-soft)' : 'transparent',
              color: showInfo ? 'var(--accent)' : 'var(--fg-3)',
              cursor: 'pointer',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 150ms, color 150ms',
            }}
          >
            ℹ
          </button>
        </div>
      </header>

      {/* Sandbox viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
          {isGpu ? (
            <GpuSandbox lang={lang} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--bg)',
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {sandbox.cat}
              </div>
              <div
                style={{ color: 'var(--heading)', fontSize: '17px', fontWeight: 600 }}
                lang={lang === 'zh' ? 'zh' : undefined}
              >
                {sandbox[lang].title}
              </div>
              <div style={{ marginTop: '8px', color: 'var(--fg-3)' }}>
                {lang === 'en' ? 'Interactive sandbox coming soon' : '可交互沙盒即将推出'}
              </div>
            </div>
          )}
        </div>

        {/* Info side panel */}
        {showInfo && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '340px',
              maxWidth: '90vw',
              background: 'var(--bg)',
              borderLeft: '1px solid var(--border)',
              padding: '24px 20px',
              overflowY: 'auto',
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--fg-3)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {sandbox.cat}
              </span>
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--fg-3)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                lineHeight: 1.3,
                color: 'var(--heading)',
                margin: 0,
              }}
              lang={lang === 'zh' ? 'zh' : undefined}
            >
              {sandbox[lang].title}
            </h2>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--fg-3)' }}>
                {sandbox.date}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--fg-3)' }}>
                ·
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--fg-3)' }}>
                {sandbox.mins} {lang === 'en' ? 'min' : '分钟'}
              </span>
            </div>

            <p
              style={{ fontSize: '15px', lineHeight: 1.75, color: 'var(--fg-2)', margin: 0 }}
              lang={lang === 'zh' ? 'zh' : undefined}
            >
              {sandbox[lang].body}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sandbox.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '13px',
                    padding: '3px 6px',
                    borderRadius: '6px',
                    background: 'var(--tag-bg)',
                    color: 'var(--tag-fg)',
                    lineHeight: 1.5,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                {prev && (
                  <a
                    href={`/${lang}/s/${prev.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      openSandbox(prev);
                    }}
                    style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    ← {prev[lang].title}
                  </a>
                )}
              </div>
              <div>
                {next && (
                  <a
                    href={`/${lang}/s/${next.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      openSandbox(next);
                    }}
                    style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    {next[lang].title} →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
