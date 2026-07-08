import { Link } from 'react-router-dom';
import { getPosts, formatDate } from '../lib/posts.js';

// Blog posts index — the blog's list layout: big title, then
// date + bold title rows, newest first. Also serves /:lang/tags/:tag.
export default function PostsPage({ lang, t, tag }) {
  const posts = getPosts(lang, tag);
  // Hugo titleizes taxonomy terms ("kubernetes" → "Kubernetes").
  const heading = tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : t.postsHeading;

  return (
    <div className="container list page-content">
      <header className="page-header">
        <h1>
          <Link className="title-link" to={tag ? `/${lang}/tags/${tag}` : `/${lang}/posts`}>
            {heading}
          </Link>
        </h1>
      </header>

      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <span className="date">{formatDate(p.date, lang)}</span>
            <Link
              className="title"
              to={`/${lang}/posts/${p.slug}`}
              lang={lang === 'zh' ? 'zh' : undefined}
            >
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
