import { Link } from 'react-router-dom';
import { formatDate } from '../lib/posts.js';

// Sandbox index — the blog's posts-list design:
// big page title, then date + bold title rows, newest first.
export default function SandboxesPage({ lang, t, sandboxes }) {
  const sorted = [...sandboxes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="container list page-content">
      <header className="page-header">
        <h1>
          <Link className="title-link" to={`/${lang}/sandboxes`}>
            {t.heading}
          </Link>
        </h1>
      </header>

      <ul>
        {sorted.map((s) => (
          <li key={s.id}>
            <span className="date">{formatDate(s.date, lang)}</span>
            <Link
              className="title"
              to={`/${lang}/s/${s.id}`}
              lang={lang === 'zh' ? 'zh' : undefined}
            >
              {s[lang].title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
