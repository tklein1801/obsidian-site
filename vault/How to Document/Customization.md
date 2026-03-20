---
title: Customization
tags: [how-to, configuration, customize]
icon: palette
---

# Customization

All site configuration lives in a single file: `vault.config.ts` at the project root. Modify this file to match your vault and preferences.

## Full configuration reference

```ts
export const siteConfig = {
  /** Site name shown in the browser tab and sidebar header */
  siteName: 'My Docs',

  /** Short description used for SEO meta tags */
  description: 'My project documentation',

  /** Path to your vault, relative to the project root */
  vaultPath: './vault',

  /** Slug of the note to render at / (without .md extension) */
  homeNote: 'index',

  /** HTML lang attribute on the <html> element */
  lang: 'en',

  /** Show the compact graph in the right sidebar */
  showMiniGraph: true,

  /** Show the backlinks panel in the right sidebar */
  showBacklinks: true,

  /** Show frontmatter metadata at the bottom of note pages */
  showMetadata: true,

  /** Color tokens — override to match your brand */
  colors: {
    bgPrimary:   '#1e1e2e',  // page background
    bgSecondary: '#181825',  // card / sidebar background
    bgTertiary:  '#313244',  // hover states, inputs
    accent:      '#89b4fa',  // links, highlights, tags
    link:        '#89dceb',  // wikilink color
  },

  /**
   * Legal pages — set to a vault-relative path.
   * When defined, links appear at the bottom of the sidebar.
   */
  imprint:       'Legal/Imprint.md',
  privacyNotice: 'Legal/Privacy Notice.md',
};
```

## Option details

### `siteName`
Displayed in the top-left of the sidebar and in the browser `<title>` tag (alongside the current note title).

### `vaultPath`
Can be an absolute path or relative to the project root. Useful if you want to keep your vault outside the project directory — e.g. `'../my-vault'` or `'/Users/me/Documents/Obsidian/MyVault'`.

### `homeNote`
The slug of the note rendered at the root path `/`. Should match a file in your vault root (e.g. `index.md` → `homeNote: 'index'`).

### `showMiniGraph`
Enables the mini graph panel on the right side of every note page. The mini graph shows only the direct neighbors (linked notes) of the current note. Disable for very large vaults where the graph causes visual clutter.

### `showBacklinks`
Enables the backlinks panel, listing all notes that link to the current one. Useful for knowledge graph navigation.

### `showMetadata`
Shows frontmatter fields (excluding `title`, `tags`, `icon`) in a structured table at the bottom of each note.

### `colors`
Five CSS variables that control the visual theme:

| Token | Default (Catppuccin Mocha) | Usage |
|---|---|---|
| `bgPrimary` | `#1e1e2e` | Page / canvas background |
| `bgSecondary` | `#181825` | Sidebar, cards, modals |
| `bgTertiary` | `#313244` | Inputs, hover states |
| `accent` | `#89b4fa` | Links, search highlights, tag pills |
| `link` | `#89dceb` | Wikilink color in note content |

> [!tip] Color formats
> Use any valid CSS color: hex (`#89b4fa`), rgb (`rgb(137,180,250)`), or hsl (`hsl(217,92%,76%)`).

### `imprint` / `privacyNotice`
Optional paths to Markdown files in your vault. When set, links to these pages appear at the bottom of the sidebar. Leave as an empty string `''` to hide them.

## Applying changes

All configuration changes take effect after restarting the dev server (`npm run dev`) or rebuilding (`npm run build`). No browser refresh is needed for `colors` — those are baked into the generated CSS at build time.
