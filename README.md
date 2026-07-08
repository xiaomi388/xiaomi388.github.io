# blog.xiaomi388.com

A personal site combining a **blog** (markdown posts, migrated from the old
Hugo/Coder blog) and a notebook of **interactive CS/AI sandboxes** — playable
explanations of mechanisms usually only described in prose.

Every post, sandbox, page, and label is **bilingual** (English + Simplified
Chinese), served under `/en/…` and `/zh/…` routes.

## Develop

```sh
npm install
npm run dev      # vite dev server
npm run build    # → dist/ (also writes 404.html for SPA routing on Pages)
npm run preview  # serve the production build locally
```

## Layout

```
index.html                 entry; loads the styles + React app
scripts/
  gen-feeds.mjs            build step: emits RSS to dist/{en,zh}/index.xml
src/
  main.jsx                 BrowserRouter mount
  App.jsx                  routes (/:lang, /:lang/posts[/:slug], /:lang/tags/:tag,
                           /:lang/sandboxes, /:lang/about, /:lang/s/:id), theme
  styles/                  design-system CSS (foundations + shell)
  content/
    en/posts/*.md          blog posts (TOML +++ frontmatter, Hugo-compatible)
    zh/posts/*.md          same filename = same post, linked language switch
    en/about.md zh/about.md
  lib/
    markdown.js            frontmatter parser + marked renderer (hljs, mermaid)
    posts.js               content glob loaders, sorting, dates
  i18n/
    ui.js                  chrome strings (en/zh)
    sandboxes.js           sandbox catalog (en/zh)
  components/              Nav, Footer, Giscus (site chrome)
  pages/                   HeroPage, PostsPage, PostPage, SandboxesPage,
                           AboutPage, SandboxPage
  sandboxes/
    gpu/GpuSandbox.jsx     the GPU-architecture sandbox (its own dark world)
public/
  fonts/                   self-hosted Font Awesome
  CNAME                    custom domain
```

## Adding a blog post

1. Drop a markdown file into `src/content/en/posts/my-post.md`.
2. Drop its Chinese twin into `src/content/zh/posts/my-post.md`
   (same filename = same post; the nav language switch links them).
3. Use the Hugo TOML frontmatter, same as the existing posts:

   ```markdown
   +++
   title = "My Post Title"
   date = 2026-07-08T10:00:00Z
   tags = ["golang", "kubernetes"]
   draft = false
   +++

   Content here…
   ```

No registration step — the build globs the directory, so the post
auto-appears in `/en/posts`, its tag pages, and the RSS feeds. Code blocks
get Monokai highlighting, `{{< mermaid >}}` blocks render as diagrams, and
giscus comments attach automatically. A post that exists in only one
language falls back to the other language's home page in the switcher.

To edit the about page, edit `src/content/en/about.md` and
`src/content/zh/about.md`.

## Adding a sandbox

1. Add a catalog entry (with `en`/`zh` copy) to `src/i18n/sandboxes.js`.
2. Drop the sandbox component under `src/sandboxes/<id>/`.
3. Wire it into `src/pages/SandboxPage.jsx` (the `isGpu`-style switch).

Each sandbox is self-contained: the **site chrome** stays minimal and typographic
(matching the blog), while a sandbox **interior** is free to express its subject and
lives in its own dark visual world.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: it builds with Vite and
publishes `dist/` to GitHub Pages under the `blog.xiaomi388.com` custom domain.
