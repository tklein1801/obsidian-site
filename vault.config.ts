/**
 * Obsidian Static Site – Configuration
 *
 * Adjust this file to match your vault and preferences.
 */
export const siteConfig = {
  /** Site name (shown in browser title and sidebar) */
  siteName: 'Obsidian Site',

  /** Site description for SEO */
  description: 'My personal knowledge repository',

  /** Path to the Obsidian vault (relative to project root) */
  vaultPath: './vault',

  /** Default note used as the home page */
  homeNote: 'index',

  /** Language of the site */
  lang: 'en',

  /** Show the mini graph in the right panel */
  showMiniGraph: true,

  /** Show backlinks in the right panel */
  showBacklinks: true,

  /** Show frontmatter metadata at the bottom of a note */
  showMetadata: true,

  /** Dark-mode colour tokens – adjust as you like */
  colors: {
    bgPrimary: '#1e1e2e',
    bgSecondary: '#181825',
    bgTertiary: '#313244',
    accent: '#89b4fa',
    link: '#89dceb',
  },

  /**
   * Legal pages – set to a vault-relative path (e.g. "legal/imprint.md").
   * When defined, links appear at the bottom of the sidebar.
   * Leave as empty string or omit to hide.
   */
  imprint: 'Legal/Imprint.md',
  privacyNotice: '',
};
