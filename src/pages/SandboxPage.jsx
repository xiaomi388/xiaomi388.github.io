import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GpuSandbox from '../sandboxes/gpu/GpuSandbox.jsx';

// Full-screen immersive sandbox view. The chrome here is a dark app bar;
// the interior is the sandbox's own world and deliberately does not inherit
// the site's light/dark theme.
export default function SandboxPage({ sandbox, sandboxes, lang, t }) {
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const isGpu = sandbox.id === 'gpu-architecture';

  const go = (path) => navigate(path);
  const openSandbox = (s) => {
    setShowInfo(false);
    navigate(`/${lang}/s/${s.id}`);
  };

  const D = {
    bg: '#0d1117',
    bgBar: '#161b22',
    bgPanel: '#161b22',
    border: '#30363d',
    borderSoft: '#21262d',
    fg: '#c9d1d9',
    fg2: '#8b949e',
    fg3: '#484f58',
    accent: '#58a6ff',
    tag: { bg: '#21262d', fg: '#8b949e' },
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
        background: D.bg,
        color: D.fg,
        // Dark UI keeps grayscale antialiasing (the light chrome uses the
        // platform default to match the blog's text rendering).
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* App bar */}
      <header
        style={{
          height: '44px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 0,
          borderBottom: `1px solid ${D.border}`,
          background: D.bgBar,
          zIndex: 10,
        }}
      >
        <a
          href={`/${lang}`}
          onClick={(e) => {
            e.preventDefault();
            go(`/${lang}`);
          }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: D.fg2,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            paddingRight: '16px',
            borderRight: `1px solid ${D.border}`,
            marginRight: '16px',
          }}
        >
          ← {lang === 'en' ? 'Notes' : '目录'}
        </a>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: D.fg3,
            paddingRight: '12px',
            marginRight: '12px',
            borderRight: `1px solid ${D.border}`,
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
            fontSize: '14px',
            color: D.fg,
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
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '0.15em 0.5em',
                borderRadius: '3px',
                background: D.tag.bg,
                color: D.tag.fg,
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
              color: D.fg3,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 150ms, color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = D.fg;
              e.currentTarget.style.background = D.borderSoft;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = D.fg3;
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {t.lang}
          </button>
          <button
            onClick={() => setShowInfo((v) => !v)}
            title={lang === 'en' ? 'About this sandbox' : '关于此沙盒'}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '4px',
              background: showInfo ? D.borderSoft : 'transparent',
              color: showInfo ? D.fg : D.fg3,
              cursor: 'pointer',
              fontSize: '14px',
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
                background: D.bg,
                color: D.fg3,
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  color: D.accent,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {sandbox.cat}
              </div>
              <div
                style={{ color: D.fg2, fontSize: '15px', fontWeight: 600 }}
                lang={lang === 'zh' ? 'zh' : undefined}
              >
                {sandbox[lang].title}
              </div>
              <div style={{ marginTop: '8px', color: D.fg3 }}>
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
              background: D.bgPanel,
              borderLeft: `1px solid ${D.border}`,
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
                  fontSize: '11px',
                  color: D.fg3,
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
                  color: D.fg3,
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
                fontSize: '18px',
                fontWeight: 600,
                lineHeight: 1.3,
                color: D.fg,
                margin: 0,
              }}
              lang={lang === 'zh' ? 'zh' : undefined}
            >
              {sandbox[lang].title}
            </h2>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: D.fg3 }}>
                {sandbox.date}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: D.fg3 }}>
                ·
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: D.fg3 }}>
                {sandbox.mins} {lang === 'en' ? 'min' : '分钟'}
              </span>
            </div>

            <p
              style={{ fontSize: '14px', lineHeight: 1.75, color: D.fg2, margin: 0 }}
              lang={lang === 'zh' ? 'zh' : undefined}
            >
              {sandbox[lang].body}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sandbox.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: '0.2em 0.55em',
                    borderRadius: '3px',
                    background: D.tag.bg,
                    color: D.tag.fg,
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
                borderTop: `1px solid ${D.borderSoft}`,
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
                    style={{ fontSize: '13px', color: D.accent, textDecoration: 'none' }}
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
                    style={{ fontSize: '13px', color: D.accent, textDecoration: 'none' }}
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
