# Obsidian Site

A self-hostable, **fully static** alternative to [Obsidian Publish](https://obsidian.md/publish) — built directly from your Obsidian vault.

> **Built with GitHub Copilot & Claude Sonnet 4.6**
> This project was developed entirely with the help of [GitHub Copilot](https://github.com/features/copilot) using the Claude Sonnet 4.6 (medium) model. From architecture decisions to implementation, testing, and documentation — every part of this codebase was created through AI-assisted development.

---

## What is it?

Obsidian Site takes your Obsidian vault — a folder of Markdown files, Canvas boards, and attachments — and compiles it into a fast, searchable, self-hostable static website. No subscription, no vendor lock-in, no server required at runtime.

## Features

| Feature | Details |
|---|---|
| **Markdown** | Full Obsidian syntax — wikilinks, callouts, highlights, comments, embeds |
| **Full-text search** | Client-side search across all notes (⌘K / Ctrl+K) |
| **Graph view** | Interactive knowledge graph of all note connections |
| **Relations** | Per-note backlinks, outlinks, and a mini graph in the right panel |
| **Canvas (beta)** | Render `.canvas` boards with zoom, pan, and node navigation |
| **Mermaid diagrams** | Flowcharts, sequence diagrams, class diagrams, and more |
| **Sidebar** | Folder tree, search, home and graph links |
| **Tags** | Inline `#tag` and frontmatter tags with search integration |
| **Table of contents** | Auto-generated TOC from headings in the right panel |
| **Syntax highlighting** | Shiki with `github-dark` theme, copy button on hover |
| **Responsive** | Mobile-friendly with collapsible sidebar |
| **Theming** | Customisable accent colour, fonts, and layout via `vault.config.ts` |
| **Fully static** | No backend, no server, no runtime dependencies |

## Quick start

```bash
# 1. Clone the repository
git clone https://github.com/OWNER/obsidian-site
cd obsidian-site

# 2. Install dependencies
npm install

# 3. Place your vault notes in the vault/ directory
#    (or symlink your existing vault)
ln -sf /path/to/your/vault vault

# 4. Start the dev server
npm run dev

# 5. Build for production
npm run build
# → static output in ./dist/
```

## Standalone Docker hosting

The easiest way to host — no need to clone this repo at all. Drop a single `Dockerfile` into your vault folder:

```
my-vault/
├── Dockerfile        ← copy from vault/Dockerfile in this repo
├── vault.config.ts   ← optional configuration
├── index.md
└── ...
```

```bash
docker build -t my-docs .
docker run -p 8080:80 my-docs
# → http://localhost:8080
```

See the [Deployment docs](vault/How%20to%20Document/Deployment.md) for the full guide including Docker Compose, Netlify, Vercel, GitHub Pages, and nginx.

## Configuration

Edit `vault.config.ts` to customise your site:

```ts
export const siteConfig = {
  siteName: 'My Knowledge Base',
  homeNote: 'index',
  lang: 'en',
  accentColor: '#7c6aec',
};
```

## Tech stack

| Layer | Technology |
|---|---|
| Static site generator | [Astro](https://astro.build) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Interactive islands | [React](https://react.dev) |
| Markdown pipeline | [Remark](https://github.com/remarkjs/remark) + [Rehype](https://github.com/rehypejs/rehype) |
| Syntax highlighting | [Shiki](https://shiki.style) |
| Diagrams | [Mermaid](https://mermaid.js.org) |
| Canvas renderer | [React Flow](https://reactflow.dev) |
| Testing | [Vitest](https://vitest.dev) |

## Development

```bash
npm test              # run tests
npm run test:coverage # coverage report
npm run build         # production build
```

Pre-commit hooks (Husky + lint-staged) run TypeScript type checking and the full test suite before every commit.

---

*Obsidian® is a registered trademark of Dynalist Inc. This project is not affiliated with or endorsed by Obsidian.*

