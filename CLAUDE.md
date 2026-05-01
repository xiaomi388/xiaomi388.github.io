# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A personal blog (xiaomi388.github.io) for Yufan Chen — a software engineer at Google Cloud Platform. Built with [Hugo](https://gohugo.io/) and the [hugo-coder](https://github.com/luizdepra/hugo-coder) theme, deployed automatically to GitHub Pages on every push to `main`.

## Commands

Hugo must be installed locally (version 0.128.0 extended, matching CI):

```bash
# Serve locally with live reload
hugo server

# Build for production
hugo --minify

# Create a new post (en or zh)
hugo new content/en/posts/my-post-title.md
hugo new content/zh/posts/my-post-title.md
```

The theme is a git submodule. After cloning:
```bash
git submodule update --init --recursive
```

## Content Architecture

The site is bilingual (`en` / `zh`), each language living under `content/<lang>/`:

```
content/
  en/
    about/_index.md      # About page
    posts/               # English blog posts
  zh/
    about/_index.md      # About page (Chinese)
    posts/               # Chinese blog posts
```

Every post under `en/posts/` **must** have a matching counterpart in `zh/posts/` with the same filename. The site does **not** auto-translate — both versions must be written manually. Never publish only one language version of a post.

## Micro-blog

`content/en/posts/micro-blog.md` (and its `zh` counterpart) is a permanent running log of scattered thoughts — quotes, observations, and short reflections spanning all years — rather than a standalone article. New entries are prepended at the top of the post body under a `### YYYY-MM-DD` heading. When adding a thought, add it to **both** language files and update `lastmod` in each.

## Front Matter Convention

All posts use TOML front matter (delimited by `+++`). Required fields:

```toml
+++
title   = "Post Title"
date    = 2025-01-01T00:00:00
tags    = ["tag1", "tag2"]
series  = []
draft   = false
lastmod = 2025-01-01T00:00:00
+++
```

- Set `draft = true` while writing; the local server shows drafts by default (`hugo server -D`), but the production build excludes them.
- `lastmod` should be updated whenever post content changes.
- `tags` controls taxonomy pages; `series` groups related multi-part posts (currently unused but wired in the theme).

## Shortcodes

The hugo-coder theme ships a `{{< mermaid >}}` shortcode for inline diagrams (used in `k8s-client-go-cache.md`). Use it for flowcharts and sequence diagrams in technical posts.

## Deployment

CI (`/.github/workflows/hugo.yml`) runs on push to `main`:
1. Installs Hugo extended + Dart Sass.
2. Checks out repo with `submodules: recursive`.
3. Runs `hugo --minify`.
4. Deploys `./public/` to GitHub Pages.

The `public/` directory in the repo is the **local** build output — it is not served by CI (CI re-builds from source). It can be regenerated at any time with `hugo`.

## Giscus Comments

Comments are powered by [Giscus](https://giscus.app/) (GitHub Discussions). Config is in `config.toml` under `[params.giscus]`. The `mapping = "pathname"` setting ties discussions to page paths — renaming a post URL will orphan existing comments.
