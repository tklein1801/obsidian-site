---
title: Roadmap
tags: [general, roadmap, future]
icon: map
---

# Roadmap

This page tracks ideas and planned features for future versions of Obsidian Site. All items are speculative — contributions and discussion are welcome.

## In Progress / Near-term

### 🎨 Improved Theme Support
Allow authors to define full light/dark color palettes, choose from built-in themes, or provide a custom CSS file. Currently only a limited set of color tokens can be overridden via `vault.config.ts`.

### 🖼 Canvas Improvements
The canvas renderer is currently in beta. Planned improvements:
- Embedded images inside canvas nodes
- Web bookmark nodes with rich link previews (fetched at build time)
- Correct rendering of Obsidian's native background image setting on group nodes
- Edge labels positioned along the curve more accurately
- Zoom-to-fit animation on first load

## Planned


### 🤖 MCP Support
Integrate with the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) to allow AI assistants to read and stream your documentation in real time. This would enable scenarios like:
- Chat with your docs using Claude, GPT, or other LLMs
- AI-powered search and summarization over your vault
- Auto-generate missing documentation pages

### 🌐 i18n / Multi-language Support
Allow configuring a locale and translating UI strings (search placeholder, sidebar labels, etc.) so the interface matches the language of the documentation.

### �� PDF Export
Generate a downloadable PDF version of individual notes or the entire vault, useful for offline documentation or sharing snapshots.

### 🔌 Plugin Architecture
A lightweight plugin system to allow community-built extensions: custom node types for canvas, additional markdown transformations, or custom sidebar widgets.

---

> [!note] Contribute
> Have an idea? Open an issue or pull request on the project repository. The roadmap is driven by community needs.
