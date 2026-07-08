// Generates RSS feeds into dist/ after the vite build:
//   dist/en/index.xml, dist/zh/index.xml, dist/index.xml (= en)
// Reads the same markdown the site renders, via src/lib/markdown.js.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, renderMarkdown } from '../src/lib/markdown.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://blog.xiaomi388.com';
const TITLE = 'Yufan Chen';

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function loadPosts(lang) {
  const dir = join(root, 'src/content', lang, 'posts');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { meta, body } = parseFrontmatter(readFileSync(join(dir, f), 'utf8'));
      return { slug: f.replace(/\.md$/, ''), meta, body };
    })
    .filter((p) => p.meta.draft !== true)
    .sort((a, b) => String(b.meta.date).localeCompare(String(a.meta.date)));
}

function feed(lang) {
  const posts = loadPosts(lang);
  const link = `${SITE}/${lang}/posts`;
  const items = posts
    .map((p) => {
      const url = `${SITE}/${lang}/posts/${p.slug}`;
      const pub = new Date(String(p.meta.date)).toUTCString();
      return `    <item>
      <title>${esc(p.meta.title ?? p.slug)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pub}</pubDate>
      <description>${esc(renderMarkdown(p.body))}</description>
    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${TITLE}</title>
    <link>${link}</link>
    <description>Recent content on ${TITLE}</description>
    <language>${lang === 'zh' ? 'zh-cn' : 'en'}</language>
    <atom:link href="${SITE}/${lang}/index.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

for (const lang of ['en', 'zh']) {
  mkdirSync(join(root, 'dist', lang), { recursive: true });
  writeFileSync(join(root, 'dist', lang, 'index.xml'), feed(lang));
}
writeFileSync(join(root, 'dist', 'index.xml'), feed('en'));
console.log('feeds: dist/en/index.xml, dist/zh/index.xml, dist/index.xml');
