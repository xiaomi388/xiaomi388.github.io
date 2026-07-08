import { parseFrontmatter, renderMarkdown, readingTime } from './markdown.js';

// Every .md dropped into src/content/<lang>/posts/ becomes a post — no
// registration step. Frontmatter is the blog's TOML `+++` format.
const postFiles = import.meta.glob('../content/*/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const aboutFiles = import.meta.glob('../content/*/about.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function load(files, pattern) {
  const out = [];
  for (const [path, raw] of Object.entries(files)) {
    const m = path.match(pattern);
    if (!m) continue;
    const { meta, body } = parseFrontmatter(raw);
    if (meta.draft === true) continue;
    out.push({
      lang: m[1],
      slug: m[2] ?? 'about',
      title: meta.title ?? '',
      date: String(meta.date ?? '').slice(0, 10),
      tags: meta.tags ?? [],
      body,
      mins: readingTime(body),
    });
  }
  return out;
}

const all = load(postFiles, /content\/(\w+)\/posts\/(.+)\.md$/).sort((a, b) =>
  b.date.localeCompare(a.date)
);
const abouts = load(aboutFiles, /content\/(\w+)\/(about)\.md$/);

export function getPosts(lang, tag) {
  const posts = all.filter((p) => p.lang === lang);
  return tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
}

export function getPost(lang, slug) {
  return all.find((p) => p.lang === lang && p.slug === slug) ?? null;
}

// Whether a translation exists (for the nav language switcher).
export function hasTranslation(lang, slug) {
  return all.some((p) => p.lang === lang && p.slug === slug);
}

export function getAbout(lang) {
  return abouts.find((p) => p.lang === lang) ?? null;
}

export function renderPost(post) {
  return renderMarkdown(post.body);
}

// Blog date formats: en "September 7, 2025", zh "九月 7, 2025".
const ZH_MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  const month = (lang === 'zh' ? ZH_MONTHS : EN_MONTHS)[m - 1];
  return `${month} ${d}, ${y}`;
}
