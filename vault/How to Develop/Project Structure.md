---
title: Project Structure
tags: [dev, architecture, structure]
icon: folder-tree
---

# Project Structure

```
obsidian-site/
│
├── vault/                        ← Your Obsidian vault (content)
│   ├── index.md                  ← Home page note
│   ├── _attachments/             ← Images and files
│   └── ...                       ← Your notes and folders
│
├── src/
│   ├── components/               ← UI components
│   │   ├── BacklinksPanel.astro  ← Backlinks panel (server-rendered)
│   │   ├── CanvasView.tsx        ← Interactive canvas (React island)
│   │   ├── GraphView.tsx         ← Force-directed graph (React island)
│   │   ├── SearchModal.tsx       ← Full-screen search (React island)
│   │   ├── Sidebar.astro         ← Left sidebar with navigation
│   │   └── __tests__/            ← Component tests
│   │
│   ├── layouts/
│   │   └── Layout.astro          ← Base HTML layout (head, sidebar, copy button JS)
│   │
│   ├── lib/                      ← Core business logic
│   │   ├── canvas.ts             ← Canvas JSON parser + types
│   │   ├── graph.ts              ← Graph data builder (nodes/edges from vault)
│   │   ├── markdown.ts           ← Markdown → HTML pipeline (remark/rehype)
│   │   ├── search.ts             ← Query parser and search engine
│   │   ├── vault.ts              ← Vault file scanner and index builder
│   │   └── __tests__/            ← Unit tests for all lib modules
│   │
│   ├── pages/
│   │   ├── [...slug].astro       ← Dynamic route — renders every vault note
│   │   ├── 404.astro             ← Custom 404 page
│   │   ├── graph.astro           ← Full-page graph view
│   │   └── index.astro           ← Redirects to home note
│   │
│   └── test/
│       └── setup.ts              ← Vitest + jest-dom global setup
│
├── public/                       ← Static assets (copied as-is to dist/)
│
├── astro.config.mjs              ← Astro + Vite configuration
├── vault.config.ts               ← Site configuration (name, colors, paths)
├── vitest.config.ts              ← Test runner configuration
├── tsconfig.json                 ← TypeScript configuration
└── package.json
```

## Key data flows

### Build time (server)
```
vault/*.md  ──► vault.ts (getVaultIndex)
                    │
                    ├──► markdown.ts (renderMarkdown) ──► HTML string
                    ├──► graph.ts (buildGraph)         ──► nodes/edges
                    └──► canvas.ts (parseCanvas)       ──► CanvasData

[...slug].astro collects all of the above and renders static HTML per note.
```

### Runtime (browser)
```
SearchModal.tsx  ←  search.ts (runSearch, parseQuery)
GraphView.tsx    ←  D3 force simulation
CanvasView.tsx   ←  React Flow (pan/zoom, node rendering)
```

## Module responsibilities

| Module | Responsibility |
|---|---|
| `vault.ts` | Scan vault directory, build slug/title/tag indexes, resolve wikilinks, find backlinks |
| `markdown.ts` | Unified/remark/rehype pipeline: GFM, wikilinks, highlights, callouts, Shiki |
| `graph.ts` | Parse wikilinks from raw content, build bidirectional link graph |
| `canvas.ts` | Parse `.canvas` JSON, validate node/edge shapes |
| `search.ts` | Parse query strings, filter/score/rank search entries, highlight terms |
