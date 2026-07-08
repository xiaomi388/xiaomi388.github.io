import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { UI } from './i18n/ui.js';
import { SANDBOXES } from './i18n/sandboxes.js';
import { getPost, getAbout } from './lib/posts.js';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import HeroPage from './pages/HeroPage.jsx';
import PostsPage from './pages/PostsPage.jsx';
import PostPage from './pages/PostPage.jsx';
import SandboxesPage from './pages/SandboxesPage.jsx';
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
  const { lang, id, slug, tag } = useParams();
  const valid = LANGS.includes(lang);
  const t = valid ? UI[lang] : null;

  useEffect(() => {
    if (valid) document.documentElement.lang = lang;
  }, [lang, valid]);

  // Per-page titles, blog format: "<page> · Yufan Chen" (home: just the name).
  useEffect(() => {
    if (!valid) return;
    const page =
      kind === 'posts' ? t.postsHeading
      : kind === 'post' ? getPost(lang, slug)?.title
      : kind === 'tag' ? tag.charAt(0).toUpperCase() + tag.slice(1)
      : kind === 'about' ? getAbout(lang)?.title
      : kind === 'sandboxes' ? t.heading
      : kind === 'sandbox' ? SANDBOXES.find((s) => s.id === id)?.[lang]?.title
      : null;
    document.title = page ? `${page} · ${t.siteTitle}` : t.siteTitle;
  }, [valid, kind, lang, slug, tag, id, t]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [kind, id, slug, tag, lang]);

  if (!valid) return <Navigate to={`/${DEFAULT_LANG}`} replace />;

  if (kind === 'sandbox') {
    const sandbox = SANDBOXES.find((s) => s.id === id);
    if (!sandbox) return <Navigate to={`/${lang}/sandboxes`} replace />;
    return (
      <SandboxPage
        sandbox={sandbox}
        sandboxes={SANDBOXES}
        lang={lang}
        t={t}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Blog-style floating theme toggle, fixed to the bottom-right corner */}
      <div className="float-container">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          <i className="fas fa-adjust fa-fw" aria-hidden="true"></i>
        </button>
      </div>
      <Nav kind={kind} lang={lang} t={t} />
      {/* flex column so the hero can center itself in the leftover height,
          exactly like the blog's `.content { flex: 1; display: flex }` */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {kind === 'home' && <HeroPage t={t} />}
        {kind === 'posts' && <PostsPage lang={lang} t={t} />}
        {kind === 'post' && <PostPage lang={lang} slug={slug} theme={theme} />}
        {kind === 'tag' && <PostsPage lang={lang} t={t} tag={tag} />}
        {kind === 'sandboxes' && (
          <SandboxesPage lang={lang} t={t} sandboxes={SANDBOXES} />
        )}
        {kind === 'about' && <AboutPage lang={lang} />}
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
      <Route path="/:lang/posts" element={page('posts')} />
      <Route path="/:lang/posts/:slug" element={page('post')} />
      <Route path="/:lang/tags/:tag" element={page('tag')} />
      <Route path="/:lang/sandboxes" element={page('sandboxes')} />
      <Route path="/:lang/about" element={page('about')} />
      <Route path="/:lang/s/:id" element={page('sandbox')} />
      <Route path="*" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
    </Routes>
  );
}
