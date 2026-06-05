import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { UI } from './i18n/ui.js';
import { SANDBOXES } from './i18n/sandboxes.js';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SandboxPage from './pages/SandboxPage.jsx';

const LANGS = ['en', 'zh'];
const DEFAULT_LANG = 'en';

function initialTheme() {
  const saved = typeof localStorage !== 'undefined' && localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// A single route target. Resolves the language from the URL, keeps the
// <html> attributes in sync, and decides whether to draw the site chrome.
// Sandbox pages are full-screen worlds with no nav/footer.
function Page({ kind, theme, setTheme }) {
  const { lang, id } = useParams();
  const valid = LANGS.includes(lang);
  const t = valid ? UI[lang] : null;

  useEffect(() => {
    if (valid) document.documentElement.lang = lang;
  }, [lang, valid]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [kind, id, lang]);

  if (!valid) return <Navigate to={`/${DEFAULT_LANG}`} replace />;

  if (kind === 'sandbox') {
    const sandbox = SANDBOXES.find((s) => s.id === id);
    if (!sandbox) return <Navigate to={`/${lang}`} replace />;
    return <SandboxPage sandbox={sandbox} sandboxes={SANDBOXES} lang={lang} t={t} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav kind={kind} lang={lang} t={t} theme={theme} setTheme={setTheme} />
      <main style={{ flex: 1 }}>
        {kind === 'home' && (
          <HomePage lang={lang} t={t} sandboxes={SANDBOXES} />
        )}
        {kind === 'about' && <AboutPage lang={lang} t={t} />}
      </main>
      <Footer t={t} />
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* private mode / storage disabled — non-fatal */
    }
  }, [theme]);

  const page = (kind) => <Page kind={kind} theme={theme} setTheme={setTheme} />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
      <Route path="/:lang" element={page('home')} />
      <Route path="/:lang/about" element={page('about')} />
      <Route path="/:lang/s/:id" element={page('sandbox')} />
      <Route path="*" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
    </Routes>
  );
}
