---
title: Getting Started
tags: [how-to, setup, guide]
icon: book-open
---

# Getting Started

This guide walks you through setting up a new documentation site using Obsidian Site from scratch.

## Prerequisites

- [Node.js](https://nodejs.org/) **v22.12.0 or newer**
- [npm](https://npmjs.com/) (included with Node.js)
- An [Obsidian](https://obsidian.md/) vault (or a folder of Markdown files)

## 1. Get the project

Clone or download the Obsidian Site repository:

```bash
git clone https://github.com/your-org/obsidian-site.git my-docs
cd my-docs
```

## 2. Install dependencies

```bash
npm install
```

## 3. Connect your vault

By default, Obsidian Site looks for a `vault/` directory in the project root. You have two options:

**Option A — Copy your vault**
Copy your Obsidian vault folder into the project root and rename it `vault/`:
```bash
cp -r /path/to/my-obsidian-vault ./vault
```

**Option B — Change the vault path**
Open `vault.config.ts` and update the `vaultPath` field:
```ts
vaultPath: '../my-obsidian-vault',
```

## 4. Configure your site

Edit `vault.config.ts` to set your site name, description, and preferences. See [[How to Document/Customization|Customization]] for all available options.

```ts
export const siteConfig = {
  siteName: 'My Docs',
  description: 'My project documentation',
  homeNote: 'index',        // which note to show on /
  lang: 'en',
};
```

## 5. Start the dev server

```bash
npm run dev
```

Your site is now available at [http://localhost:4321](http://localhost:4321). Changes to your vault files will hot-reload automatically.

## 6. Set your home note

Create an `index.md` file at the root of your vault. This note will be rendered at `/`. If no `index.md` exists, visitors will see a 404 page.

```markdown
---
title: Welcome
---

# My Documentation

Welcome to my docs! Here you'll find...
```

## Folder structure in the vault

Folders in your vault become path segments in the URL:

| Vault path | URL |
|---|---|
| `index.md` | `/` |
| `Guide.md` | `/guide` |
| `API/Overview.md` | `/api/overview` |
| `API/Reference.md` | `/api/reference` |

> [!tip] Note naming
> File names are converted to URL slugs: spaces become hyphens, letters are lowercased. `My Feature Guide.md` → `/my-feature-guide`.

## Using wikilinks for navigation

Link between notes using Obsidian's `[[wikilink]]` syntax:

```markdown
See [[API/Overview]] for the full reference.
See [[Guide|Getting Started Guide]] to use a custom label.
```

Both forms are resolved at build time and become proper `<a>` tags.
