import { Link, useLocation } from 'react-router-dom';
import { hasTranslation } from '../lib/posts.js';

// Site chrome navigation — the hugo-coder header.html structure verbatim:
// inline title, hidden checkbox + hamburger label (pure-CSS mobile menu),
// float-right list of links + | separator + language switch.
// (The theme toggle is the blog-style floating corner button in App.jsx.)
export default function Nav({ kind, lang, t }) {
  const location = useLocation();
  const otherLang = lang === 'en' ? 'zh' : 'en';

  // Like the blog: link to the translated page when it exists, else home.
  let togglePath = location.pathname.replace(/^\/(en|zh)/, `/${otherLang}`);
  const postMatch = location.pathname.match(/^\/(en|zh)\/posts\/(.+)$/);
  if (postMatch && !hasTranslation(otherLang, postMatch[2])) {
    togglePath = `/${otherLang}`;
  }

  return (
    <nav className="navigation">
      <section className="container">
        <Link className="navigation-title" to={`/${lang}`}>
          {t.siteTitle}
        </Link>
        {/* key: remount unchecked on route change — the blog closes it via full page load */}
        <input type="checkbox" id="menu-toggle" key={location.pathname} />
        <label className="menu-button float-right" htmlFor="menu-toggle">
          <i className="fas fa-bars fa-fw" aria-hidden="true"></i>
        </label>
        <ul className="navigation-list">
          <li className="navigation-item">
            <Link
              className="navigation-link"
              aria-current={kind === 'posts' ? 'page' : undefined}
              to={`/${lang}/posts`}
            >
              {t.nav.blog}
            </Link>
          </li>
          <li className="navigation-item">
            <Link
              className="navigation-link"
              aria-current={kind === 'sandboxes' ? 'page' : undefined}
              to={`/${lang}/sandboxes`}
            >
              {t.nav.sandboxes}
            </Link>
          </li>
          <li className="navigation-item">
            <Link
              className="navigation-link"
              aria-current={kind === 'about' ? 'page' : undefined}
              to={`/${lang}/about`}
            >
              {t.nav.about}
            </Link>
          </li>
          <li className="navigation-item menu-separator">
            <span>|</span>
          </li>
          <li className="navigation-item">
            <Link to={togglePath}>{t.lang}</Link>
          </li>
        </ul>
      </section>
    </nav>
  );
}
