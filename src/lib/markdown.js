// NOTE: keep this module free of CSS imports — scripts/gen-feeds.mjs runs it
// in plain node. The Monokai theme CSS is imported in main.jsx.
import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import go from 'highlight.js/lib/languages/go';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import cpp from 'highlight.js/lib/languages/cpp';

hljs.registerLanguage('go', go);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('cpp', cpp);

// ---------------------------------------------------------------------------
// Frontmatter — the blog's TOML `+++` blocks. Only the handful of scalar
// shapes the posts actually use: strings, dates, booleans, string arrays.
// ---------------------------------------------------------------------------
export function parseFrontmatter(raw) {
  const m = raw.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+\r?\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^\s*(\w+)\s*=\s*(.+?)\s*$/);
    if (!kv) continue;
    const [, key, rawVal] = kv;
    let val;
    if (rawVal === 'true' || rawVal === 'false') {
      val = rawVal === 'true';
    } else if (rawVal.startsWith('[')) {
      val = [...rawVal.matchAll(/["']([^"']*)["']/g)].map((x) => x[1]);
    } else if (/^["']/.test(rawVal)) {
      val = rawVal.slice(1, -1);
    } else {
      val = rawVal; // bare dates like 2025-07-13T14:10:00
    }
    meta[key] = val;
  }
  return { meta, body: raw.slice(m[0].length) };
}

// ---------------------------------------------------------------------------
// Hugo bits: {{< mermaid >}} shortcode and heading anchors.
// ---------------------------------------------------------------------------
function transformShortcodes(md) {
  return md
    .replace(/\{\{<\s*mermaid\s*>\}\}/g, '<div class="mermaid">')
    .replace(/\{\{<\s*\/mermaid\s*>\}\}/g, '</div>');
}

// Hugo's anchorize: lowercase, spaces → -, strip most punctuation.
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s/-]/gu, '')
    .replace(/[\s/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeMarked() {
  const marked = new Marked();
  marked.use({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slugify(this.parser.parseInline(tokens, this.parser.textRenderer));
        // Matches the blog's markup: hover-visible link icon after the text.
        return `<h${depth} id="${id}">
  ${text}
  <a class="heading-link" href="#${id}">
    <i class="fa-solid fa-link" aria-hidden="true" title="Link to heading"></i>
    <span class="sr-only">Link to heading</span>
  </a>
</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const t = title ? ` title="${title}"` : '';
        const external = /^https?:\/\//.test(href) && !href.includes('xiaomi388.com');
        const attrs = external ? ' class="external-link" target="_blank" rel="noopener"' : '';
        return `<a href="${href}"${t}${attrs}>${text}</a>`;
      },
      code({ text, lang }) {
        const language = lang && hljs.getLanguage(lang) ? lang : null;
        const body = language
          ? hljs.highlight(text, { language }).value
          : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const cls = language ? ` class="language-${language} hljs"` : ' class="hljs"';
        return `<div class="highlight"><pre tabindex="0"><code${cls}>${body}</code></pre></div>\n`;
      },
    },
  });
  return marked;
}

const marked = makeMarked();

export function renderMarkdown(md) {
  return marked.parse(transformShortcodes(md));
}

// ---------------------------------------------------------------------------
// Reading time — Hugo: (words + 212) / 213, integer division, min 1.
// Word count approximates Hugo's .WordCount (whitespace-separated tokens of
// the plain text; the blog does not set hasCJKLanguage, so CJK runs count
// as single words — which is why zh posts show shorter times).
// ---------------------------------------------------------------------------
export function readingTime(md) {
  const plain = transformShortcodes(md)
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, ''))
    .replace(/[#>*_`|[\]()-]/g, ' ');
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.floor((words + 212) / 213));
}

export function readingTimeLabel(mins) {
  // The blog shows English here in both languages (theme i18n fallback).
  return mins === 1 ? 'One-minute read' : `${mins}-minute read`;
}
