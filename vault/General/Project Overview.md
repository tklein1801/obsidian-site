---
title: Project Overview
tags: [general, overview, features]
icon: clipboard-list
---

# Project Overview

**Obsidian Site** is a self-hostable alternative to [Obsidian Publish](https://obsidian.md/publish). It converts your Obsidian vault into a fully static website at build time — no server runtime required, no subscription fees, complete control over your data.

## What it is

You write notes in Obsidian using Markdown (with full Obsidian syntax support), configure a single TypeScript file, run one build command, and get a ready-to-deploy static website.

> [!info] Static means fast
> Every page is pre-rendered at build time. There is no database, no backend, and no Node.js server needed in production. Just HTML, CSS, and JavaScript files.

## Features

### ✍️ Content
- Full **Obsidian Markdown** support: `[[wikilinks]]`, `![[embeds]]`, `==highlights==`, callouts, tags
- **Frontmatter** support (title, tags, icon, and any custom fields)
- **Syntax highlighting** for 100+ languages via Shiki
- **Canvas** files rendered as interactive, pannable/zoomable boards

### 🔍 Search
- **Advanced query language**: `tag:name`, `#shorthand`, `title:foo`, `path:folder`
- Multi-token AND filtering — combine operators freely
- Instant client-side search, no external service needed

### 🕸 Relations
- **Backlinks panel** — see which notes link to the current one
- **Graph view** — interactive force-directed graph of all note relations
- **Mini graph** — per-note local relation graph in the sidebar
- Node size scales with link count (more connected = visually larger)

### 🎨 UI
- Dark-mode first, fully **responsive** design
- Customizable color scheme via `vault.config.ts`
- Breadcrumb navigation for nested vault folders
- Tag pills that open the search modal pre-filtered
- **Code copy button** on all code blocks

### ⚙️ Developer Experience
- Built with **Astro** — extremely fast builds, island architecture
- Fully **TypeScript** typed
- **119 unit tests** covering all core logic
- Pre-commit hooks with Husky + lint-staged

## How it works

```
Your Obsidian Vault (.md + .canvas files)
        │
        ▼
   Vault Parser (src/lib/vault.ts)
   - Reads all files
   - Builds slug index, tag index, backlink map
        │
        ▼
   Markdown Engine (src/lib/markdown.ts)
   - Parses Obsidian syntax
   - Resolves wikilinks → slugs
   - Applies syntax highlighting
        │
        ▼
   Astro Build (astro.config.mjs)
   - Generates one HTML file per note
   - Bundles React islands (Search, Graph, Canvas)
        │
        ▼
   Static Output (dist/)
   - Deploy anywhere — Vercel, Netlify, Cloudflare Pages, nginx
```

See [[Canvas/Architecture]] for an interactive visual overview.
