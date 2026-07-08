# Notes

A personal site combining a **blog** (markdown posts, migrated from the old Hugo/Coder blog) and a learning notebook of **interactive CS/AI sandboxes** — playable explanations of mechanisms that are usually only described in prose (GPU scheduling, backpropagation, matrix multiplication, and so on).

- **Production**: `https://notes.xiaomi388.com`
- **Design ground truth**: the Hugo Coder theme at `~/Developer/blog` (the old blog's source). The chrome is a pixel-level copy of it; when in doubt, measure against `hugo server` there.
- **Author**: Yufan Chen

## Adding content

- **New blog post**: drop a `.md` file into `src/content/en/posts/` and its twin into `src/content/zh/posts/` (same filename = same post, linked language switch). Frontmatter is the Hugo TOML `+++` block (`title`, `date`, `tags`, `draft`). No registration step.
- **About**: edit `src/content/<lang>/about.md`.
- **New sandbox**: register in `src/i18n/sandboxes.js`, component under `src/sandboxes/`.

---

## Objective

Turn abstract CS/AI concepts into things a learner can **manipulate, step through, and break**. The site is a long-running personal notebook, not a product. The bar is "Yufan would find this useful six months from now," not "this could be a startup."

Each entry is a self-contained sandbox: a focused interactive page about one concept. The site is a thin frame around them.

---

## Principles

**Sandboxes are the unit.** Each one is independent, self-contained, and droppable. Adding a new sandbox should feel like adding a note to a notebook — one place to register it, no cross-coupling, no shared state. If a change to one sandbox can break another, the abstraction is wrong.

**Vibe-coding first.** Optimize for flow, not engineering rigor. No monorepo, no design system, no Storybook, no test pyramid. Reach for the smallest thing that works. When in doubt, do less.

**Two visual layers, with a hard boundary.**
- The **site shell** (nav, home, blog pages, about, footer) is minimal and typographic, a pixel-level copy of the Hugo Coder blog aesthetic. No gradients, no decorative panels, no flourish.
- The **inside of a sandbox** is free to express its subject. A GPU sandbox can look like a chip die; a backprop sandbox can look like a notebook page; a matmul sandbox can look like a spreadsheet. They each get their own world — but that world stays inside its sandbox container and never leaks into the chrome.

**Bilingual, both first-class.** Every sandbox, every page of chrome, every label, every explanation must exist in **both English and Chinese**. Neither language is a translation afterthought. URL structure should mirror the sister blog's `/en/…` and `/zh/…` convention so the two sites feel like one. Technical terms (CUDA, SIMT, PTX instructions, variable names) can stay in English in both versions — that's natural for the audience.

**Static and self-hostable.** The site is a pile of static files, deployable to GitHub Pages under a custom domain. No backend, no database, no auth, no analytics dependencies. If a feature needs a server, it doesn't belong here.

**Anti-slop aesthetic.** No purple-on-white gradients. No bento grids. No emoji-heavy UI. No Inter or Roboto. No "AI assistant" color palettes. The site should look like a person made it on purpose — closer to a well-typeset textbook than to a SaaS landing page.

---

## Constraints

- **Hosting**: GitHub Pages, custom subdomain `notes.xiaomi388.com`. Static output only.
- **Languages**: English and Simplified Chinese, equal status, both deployed.
- **Browsers**: Modern evergreen. No IE / legacy concerns.
- **Mobile**: Should be usable on a phone but desktop is the primary target — sandboxes are dense.
- **Dependencies**: Keep the dependency tree small. Every added library should justify its bundle weight against the value it brings to a sandbox.

---

## Existing Material

A first sandbox already exists as a standalone React component (GPU architecture: hierarchical chip explorer, memory hierarchy, SIMT/warp-divergence animation). It will be ported in as the inaugural entry. Treat it as the calibration point for what a "good sandbox" looks like in this project.

Planned sandboxes include backpropagation and matrix multiplication. The list is open-ended; the site is built to keep accreting.

---

## For Claude Code

When making decisions not covered here, default to the principle that makes the project **smaller, simpler, or more uniform**. If a choice would couple sandboxes together, introduce ceremony, or compromise the bilingual symmetry, push back or ask. If a choice adds visual decoration to the site shell, ask before doing it — restraint is the chrome's defining feature.

The reader of this notebook is a working engineer who already knows the basics. Don't over-explain in UI copy. Don't add disclaimers, badges, or "✨ AI-powered" framing. Let the sandboxes speak.
