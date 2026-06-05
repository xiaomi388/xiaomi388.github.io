export default function Footer({ t }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container" style={{ maxWidth: 'var(--container-wide)' }}>
        {t.footerLine(year)}
        {' · '}
        <a href="https://blog.xiaomi388.com" target="_blank" rel="noopener">
          blog
        </a>
      </div>
    </footer>
  );
}
