import { useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getPost, renderPost, formatDate } from '../lib/posts.js';
import { readingTimeLabel } from '../lib/markdown.js';
import Giscus from '../components/Giscus.jsx';

// Single blog post — the blog's <article> structure verbatim:
// post-title, post-meta (calendar/clock/tag icons), rendered content,
// footer with giscus comments.
export default function PostPage({ lang, slug, theme }) {
  const post = getPost(lang, slug);
  const html = useMemo(() => (post ? renderPost(post) : ''), [post]);

  // Mermaid diagrams: load the library only when a post actually has one.
  useEffect(() => {
    if (!html.includes('class="mermaid"')) return;
    let cancelled = false;
    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return;
      mermaid.initialize({ startOnLoad: false });
      mermaid.run({ querySelector: '.mermaid' });
    });
    return () => {
      cancelled = true;
    };
  }, [html]);

  if (!post) return <Navigate to={`/${lang}/posts`} replace />;

  return (
    <div className="container post page-content" lang={lang === 'zh' ? 'zh' : undefined}>
      <article>
        <header>
          <div className="post-title">
            <h1 className="title">
              <Link className="title-link" to={`/${lang}/posts/${slug}`}>
                {post.title}
              </Link>
            </h1>
          </div>
          <div className="post-meta">
            <div className="date">
              <span className="posted-on">
                <i className="fas fa-calendar" aria-hidden="true"></i>{' '}
                <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
              </span>
              <span className="reading-time">
                <i className="fas fa-clock" aria-hidden="true"></i>{' '}
                {readingTimeLabel(post.mins)}
              </span>
            </div>
            {post.tags.length > 0 && (
              <div className="tags">
                <i className="fas fa-tag" aria-hidden="true"></i>
                {post.tags.map((tag, i) => (
                  <span key={tag}>
                    {i > 0 && (
                      <>
                        {' '}
                        <span className="separator">•</span>
                      </>
                    )}{' '}
                    <span className="tag">
                      <Link to={`/${lang}/tags/${tag}`}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </Link>
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="post-content" dangerouslySetInnerHTML={{ __html: html }} />

        <footer>
          <Giscus term={`posts/${slug}/`} theme={theme} lang={lang} />
        </footer>
      </article>
    </div>
  );
}
