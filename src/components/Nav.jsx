import { Link, useLocation } from 'react-router-dom';

// Site chrome navigation. Matches the hugo-coder blog structure:
// site title + nav links + separator + language switch + theme toggle.
export default function Nav({ kind, lang, t, theme, setTheme }) {
  const location = useLocation();
  const otherLang = lang === 'en' ? 'zh' : 'en';
  const togglePath = location.pathname.replace(/^\/(en|zh)/, `/${otherLang}`);

  return (
    <nav className="navigation">
      <div className="container" style={{ maxWidth: 'var(--container-wide)' }}>
        <Link className="navigation-title" to={`/${lang}`}>
          {t.siteTitle}
        </Link>
        <ul className="navigation-list">
          <li className="navigation-item">
            <Link
              className="navigation-link"
              aria-current={kind === 'home' ? 'page' : undefined}
              to={`/${lang}`}
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
          <li className="navigation-item">
            <span className="menu-separator">|</span>
          </li>
          <li className="navigation-item">
            <Link
              className="navigation-link"
              style={{ whiteSpace: 'nowrap' }}
              to={togglePath}
            >
              {t.lang}
            </Link>
          </li>
          <li className="navigation-item">
            <button
              className="nav-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} fa-fw`}></i>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
