import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAbout } from '../lib/posts.js';
import { renderMarkdown } from '../lib/markdown.js';

// About — the blog's about page: big linked title + rendered markdown,
// content sourced from src/content/<lang>/about.md.
export default function AboutPage({ lang }) {
  const about = getAbout(lang);
  const html = useMemo(() => (about ? renderMarkdown(about.body) : ''), [about]);
  if (!about) return null;

  return (
    <div className="container list page-content" lang={lang === 'zh' ? 'zh' : undefined}>
      <header className="page-header">
        <h1>
          <Link className="title-link" to={`/${lang}/about`}>
            {about.title}
          </Link>
        </h1>
      </header>
      <div className="post-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
