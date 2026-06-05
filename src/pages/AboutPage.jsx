// Centered bio page, matching the hugo-coder blog about style.
export default function AboutPage({ lang, t }) {
  return (
    <div>
      <section className="about-centered">
        <div className="container">
          <h1>{t.aboutTitle}</h1>
          <p
            style={{
              color: 'var(--fg-3)',
              marginTop: 'var(--s-2)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            notes.xiaomi388.com
          </p>
          <ul className="about-links">
            <li>
              <a href="https://github.com/xiaomi388" target="_blank" rel="noopener">
                <i className="fab fa-github"></i>github
              </a>
            </li>
            <li>
              <a
                href="https://blog.xiaomi388.com/index.xml"
                target="_blank"
                rel="noopener"
              >
                <i className="fas fa-rss"></i>rss
              </a>
            </li>
            <li>
              <a href="https://blog.xiaomi388.com" target="_blank" rel="noopener">
                blog
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 'var(--s-9)' }}>
        <hr style={{ margin: '0 0 var(--s-7)' }} />
        <div className="content">
          {t.aboutBio.map((p, i) => (
            <p
              key={i}
              lang={lang === 'zh' ? 'zh' : undefined}
              style={{ marginBottom: 'var(--s-5)' }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
