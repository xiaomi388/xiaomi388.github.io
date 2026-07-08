// Home — the blog's centered hero, verbatim (including the empty h2 the
// theme emits, which nudges the name up exactly like on the blog).
export default function HeroPage({ t }) {
  return (
    <section className="container centered">
      <div className="about">
        <h1>{t.siteTitle}</h1>
        <h2></h2>
      </div>
    </section>
  );
}
