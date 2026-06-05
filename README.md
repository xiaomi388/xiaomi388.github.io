# notes.xiaomi388.com

A personal notebook of **interactive CS/AI sandboxes** — playable explanations of
mechanisms usually only described in prose. Sister site to the writing blog at
[blog.xiaomi388.com](https://blog.xiaomi388.com).

Every sandbox, page, and label is **bilingual** (English + Simplified Chinese),
served under `/en/…` and `/zh/…` routes mirroring the blog.

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
src/
  main.jsx                 BrowserRouter mount
  App.jsx                  routes (/:lang, /:lang/about, /:lang/s/:id), theme
  styles/                  design-system CSS (foundations + shell)
  i18n/
    ui.js                  chrome strings (en/zh)
    sandboxes.js           sandbox catalog (en/zh)
  components/              Nav, Footer (site chrome)
  pages/                   HomePage, AboutPage, SandboxPage
  sandboxes/
    gpu/GpuSandbox.jsx     the GPU-architecture sandbox (its own dark world)
public/
  fonts/                   self-hosted Font Awesome
  CNAME                    custom domain
```

## Adding a sandbox

1. Add a catalog entry (with `en`/`zh` copy) to `src/i18n/sandboxes.js`.
2. Drop the sandbox component under `src/sandboxes/<id>/`.
3. Wire it into `src/pages/SandboxPage.jsx` (the `isGpu`-style switch).

Each sandbox is self-contained: the **site chrome** stays minimal and typographic
(matching the blog), while a sandbox **interior** is free to express its subject and
lives in its own dark visual world.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: it builds with Vite and
publishes `dist/` to GitHub Pages under the `notes.xiaomi388.com` custom domain.
