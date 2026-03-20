---
title: Credits
tags: [credits, acknowledgements]
icon: heart
---

# Credits

Obsidian Site is built on the shoulders of many excellent open-source projects and draws inspiration from the Obsidian ecosystem. Thank you to everyone who built and maintains these tools.

## 💙 Obsidian

First and foremost — [Obsidian](https://obsidian.md) by Dynalist Inc. The entire concept of this project exists because of what Obsidian has built: a genuinely excellent note-taking and knowledge management tool. The vault format, canvas format, wikilink syntax, and the overall philosophy of connected notes are all Obsidian's work.

If you find this project useful, please support Obsidian by getting a [Catalyst license](https://obsidian.md/pricing) or [Obsidian Sync](https://obsidian.md/sync).

## 🚀 Core Framework

### [Astro](https://astro.build/)
The web framework that makes static site generation fast and developer-friendly. The island architecture and zero-JS-by-default philosophy were the perfect fit for a documentation site.

### [Vite](https://vitejs.dev/)
The blazing-fast build tool powering Astro under the hood.

## 🎨 Rendering & Styling

### [Unified / remark / rehype](https://unifiedjs.com/)
The excellent unified ecosystem for parsing and transforming Markdown to HTML. Without these composable parsers and plugins, building a custom Obsidian syntax renderer would have been exponentially harder.

### [Shiki](https://shiki.style/)
Beautiful, accurate syntax highlighting powered by TextMate grammars. Zero-JS at runtime — all highlighting happens at build time.

### [Tailwind CSS](https://tailwindcss.com/)
Utility-first CSS framework. The v4 Vite plugin made styling straightforward without needing configuration files.

### [Catppuccin](https://catppuccin.com/)
The default color scheme (Mocha variant) used for both the UI and code block syntax highlighting. A gorgeous, well-designed pastel dark theme.

## ⚛️ Interactive Islands

### [React](https://react.dev/)
Powering the three interactive islands: Search, Graph View, and Canvas View.

### [React Flow / xyflow](https://reactflow.dev/)
The canvas renderer. Incredibly powerful pan/zoom, node/edge management and minimap out of the box.

### [D3.js](https://d3js.org/)
Force-directed graph simulation for the relation graph. A classic tool that remains unmatched for data visualization.

### [Lucide](https://lucide.dev/)
Clean, consistent icon library used throughout the interface.

## 🧪 Testing & Quality

### [Vitest](https://vitest.dev/)
A fast, Vite-native test runner. The watch mode and coverage integration made test-driven development a pleasure.

### [Testing Library](https://testing-library.com/)
`@testing-library/react` and `@testing-library/user-event` for writing component tests that interact the way users do.

### [Husky](https://typicode.github.io/husky/) & [lint-staged](https://github.com/lint-staged/lint-staged)
Pre-commit hook management and incremental quality checks.

## 📦 Utilities

### [gray-matter](https://github.com/jonschlinkert/gray-matter)
YAML frontmatter parsing — simple, reliable, battle-tested.

### [glob](https://github.com/isaacs/node-glob)
File system globbing for scanning vault directories.

---

> [!quote] On knowledge tools
> *"The mind is not a vessel to be filled, but a fire to be kindled."*
> — Plutarch

Thank you for using Obsidian Site. If it helps you share your knowledge with the world, that's exactly what it was built for.
