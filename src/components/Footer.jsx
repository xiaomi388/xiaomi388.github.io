export default function Footer({ t }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">{t.footerLine(year)}</div>
    </footer>
  );
}
