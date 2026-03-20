---
title: Tech Stack
tags: [dev, tech-stack, dependencies]
icon: layers
---

# Tech Stack

## Core framework

### [Astro](https://astro.build/) `v6`
The build framework. Astro renders pages server-side at build time (SSG), then hydrates only the interactive islands (Search, Graph, Canvas) in the browser. This means the vast majority of the page is zero-JS static HTML — extremely fast for documentation sites.

Key Astro features used:
- **`getStaticPaths()`** — generates one route per vault note
- **`client:only="react"`** — fully browser-side React islands (used for Canvas/Graph which depend on browser APIs)
- **Vite** — asset bundling, TypeScript compilation, HMR

## Rendering

### [Unified / remark / rehype](https://unifiedjs.com/)
The Markdown processing pipeline:
- **remark** — parse Markdown AST, apply Obsidian-specific transforms
- **rehype** — convert to HTML AST, apply sanitization
- Custom remark plugins:
  - `remarkObsidianLinks` — `[[wikilink]]` → `<a>` tags; `![[image]]` → `<img>`
  - `remarkHighlights` — `==text==` → `<mark>` tags
  - `remarkCallouts` — `> [!type]` → styled callout divs

### [Shiki](https://shiki.style/) via `@shikijs/rehype`
Syntax highlighting applied at build time. Produces zero client-side JS — all highlighting is rendered as HTML spans. Theme: Catppuccin Mocha.

## Styling

### [Tailwind CSS](https://tailwindcss.com/) `v4`
Utility classes for layout and spacing. Tailwind v4 uses the new Vite plugin approach (no `tailwind.config.js` needed). All design tokens (colors, radii, etc.) are declared as CSS variables for runtime theming.

## React islands

### [React](https://react.dev/) `v19`
Used for the three interactive islands that require browser APIs:
- `SearchModal.tsx` — full-text search with query language
- `GraphView.tsx` — D3-powered force graph
- `CanvasView.tsx` — pannable/zoomable canvas board

### [React Flow (`@xyflow/react`)](https://reactflow.dev/) `v12`
Pannable, zoomable canvas renderer used in `CanvasView.tsx`. Provides node/edge management, minimap, and gesture handling out of the box.

### [D3](https://d3js.org/) `v7`
Force-directed graph simulation used in `GraphView.tsx`. D3 computes the layout; React renders the SVG nodes and edges.

### [Lucide React](https://lucide.dev/)
Icon library used throughout the UI.

## Testing

### [Vitest](https://vitest.dev/) `v3`
Fast unit test runner (powered by Vite). Uses `jsdom` environment for component tests.

### [Testing Library](https://testing-library.com/)
`@testing-library/react` and `@testing-library/user-event` for component interaction tests.

### [Coverage](https://vitest.dev/guide/coverage)
`@vitest/coverage-v8` — V8 native coverage, reports to `coverage/` as HTML + LCOV.

## Quality tooling

### [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged)
Pre-commit hooks run `tsc --noEmit` and the full test suite on staged TypeScript files. Automatically skipped in CI environments.

### TypeScript `strict` mode
All source files are type-checked in strict mode via `tsconfig.json` extending `astro/tsconfigs/strict`.

## Content parsing

### [gray-matter](https://github.com/jonschlinkert/gray-matter)
YAML frontmatter parsing — extracts `title`, `tags`, `icon`, and custom metadata fields from note files.

### [glob](https://github.com/isaacs/node-glob)
Recursively scans the vault directory for `.md` and `.canvas` files at build time.
