---
title: Testing
tags: [dev, testing, vitest]
icon: flask-conical
---

# Testing

Obsidian Site has a comprehensive test suite with **119 tests** across 6 test files, covering all core library modules and the main React component.

## Running tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests and generate a coverage report
npm run test:coverage
```

Coverage reports are written to `coverage/` — open `coverage/index.html` in a browser to explore the interactive report.

## Test files

| File | Module | Tests |
|---|---|---|
| `src/lib/__tests__/vault.test.ts` | `vault.ts` | 20 |
| `src/lib/__tests__/search.test.ts` | `search.ts` | 42 |
| `src/lib/__tests__/markdown.test.ts` | `markdown.ts` | 24 |
| `src/lib/__tests__/graph.test.ts` | `graph.ts` | 13 |
| `src/lib/__tests__/canvas.test.ts` | `canvas.ts` | 7 |
| `src/components/__tests__/SearchModal.test.tsx` | `SearchModal.tsx` | 13 |

## What is tested

### `vault.test.ts`
- `resolveWikilink` — exact match, title match, cross-folder, ambiguous links, non-existent links
- `getBacklinks` — direct links, transitive references, notes with no backlinks
- `buildSearchIndex` — field population, tag inclusion, canvas files excluded
- `formatDate` — ISO date formatting

### `search.test.ts`
- `parseQuery` — plain text, `tag:name`, `#shorthand`, `title:foo`, `path:folder`, multi-token, operator-only queries
- `filterEntry` — each operator type, AND combination, case-insensitivity
- `scoreEntry` — title matches score higher than content matches
- `highlight` — wraps matching terms in `<mark>` tags, case-insensitive
- `getExcerpt` — context window around the first match
- `runSearch` — full integration: parse + filter + sort + highlight

### `markdown.test.ts`
- Headings, bold, italic, strikethrough
- `==highlights==` → `<mark>`
- `[[wikilinks]]` → `<a>` tags with correct hrefs
- `![[image]]` embeds → `<img>` tags
- Callouts (`> [!note]`, `> [!warning]`, etc.)
- Fenced code blocks → Shiki `<pre>` output
- Frontmatter stripping

### `graph.test.ts`
- `buildGraphData` — node list from vault, edge list from wikilinks
- Isolated nodes (no links), bidirectional edges
- Self-referencing notes handled gracefully

### `canvas.test.ts`
- `parseCanvas` — valid JSON, all node types, all edge fields
- Invalid JSON returns empty canvas gracefully
- Missing `nodes`/`edges` arrays default to `[]`

### `SearchModal.test.tsx`
- Opens on Cmd+K / Ctrl+K
- Closes on Escape
- Opens on `open-search` custom event with optional pre-filled query
- Typing a query shows matching results
- `tag:query` shows tag filter chips
- "No results" state
- Clear (✕) button resets query
- Footer shows total indexed note count

## Configuration

Tests use `jsdom` as the browser environment. Global APIs (`describe`, `it`, `expect`, `vi`) are available without explicit imports.

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

The setup file (`src/test/setup.ts`) imports `@testing-library/jest-dom` to extend `expect` with DOM matchers like `toBeInTheDocument()`, `toHaveTextContent()`, etc.

## Writing new tests

Place unit tests alongside the source files they test:
- Library tests: `src/lib/__tests__/<module>.test.ts`
- Component tests: `src/components/__tests__/<Component>.test.tsx`

Tests run automatically on commit via the pre-commit hook (if TypeScript files are staged). See [[How to Develop/Pre-commit Hooks|Pre-commit Hooks]].
