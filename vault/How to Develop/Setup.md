---
title: Setup
tags: [dev, setup, development]
icon: settings
---

# Setup

This guide covers everything needed to get Obsidian Site running locally for development.

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 22.12.0 |
| npm | 10.x |
| Git | Any recent version |

> [!tip] Node version management
> Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage multiple Node versions. Run `nvm use` in the project root to automatically switch to the correct version (if a `.nvmrc` is present).

## Clone the repository

```bash
git clone https://github.com/your-org/obsidian-site.git
cd obsidian-site
```

## Install dependencies

```bash
npm install
```

This installs all runtime and dev dependencies, and also runs `husky install` via the `prepare` lifecycle hook to set up the pre-commit hook.

## Start the development server

```bash
npm run dev
```

The site is available at [http://localhost:4321](http://localhost:4321).

**Hot reload** is enabled for:
- Vault Markdown files (`.md`)
- Canvas files (`.canvas`)
- Astro components (`.astro`)
- React components (`.tsx`)
- CSS / Tailwind changes

Changes to `vault.config.ts` require a manual server restart.

## Available npm scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests and generate coverage report |

## IDE setup

**Visual Studio Code** is recommended. Install these extensions for the best experience:

- **Astro** (`astro-build.astro-vscode`) — syntax highlighting and IntelliSense for `.astro` files
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — autocomplete for Tailwind classes
- **ESLint** — if you add linting
- **Vitest** (`vitest.explorer`) — run individual tests from the editor

The TypeScript project is pre-configured via `tsconfig.json`. No additional setup needed.
