---
title: Building
tags: [dev, build, production]
icon: hammer
---

# Building

## Production build

```bash
npm run build
```

Astro compiles the project into the `dist/` directory. The build:

1. Reads the vault index (all `.md` and `.canvas` files)
2. Renders each note to a static HTML page
3. Bundles React islands (Search, Graph, Canvas) with Vite
4. Copies all vault attachments (`_attachments/`) to `dist/_vault/`

**Typical build time:** 3–8 seconds for a 100-note vault.

## Build output

```
dist/
├── index.html                    ← home note
├── 404.html                      ← custom 404 page
├── guide/
│   └── index.html
├── api/
│   ├── overview/
│   │   └── index.html
│   └── reference/
│       └── index.html
├── _vault/
│   └── _attachments/
│       └── image.png             ← vault images
└── _astro/
    ├── *.js                      ← bundled JS (React islands)
    └── *.css                     ← compiled CSS
```

## Preview the build

After building, you can serve and preview the output locally:

```bash
npm run preview
```

This starts a local HTTP server serving `dist/` — useful to verify routing and 404 handling before deploying.

## Build environment variables

No environment variables are needed for the standard build. All configuration is read from `vault.config.ts` at build time.

## Incremental builds

Astro caches build artifacts in `node_modules/.astro/`. Subsequent builds are faster if only a subset of notes changed. To force a clean build:

```bash
rm -rf dist node_modules/.astro && npm run build
```

## TypeScript checks

The build does **not** fail on TypeScript errors by default (Astro's Vite pipeline is transpile-only). Run the type checker separately:

```bash
npx tsc --noEmit
```

This is also enforced by the pre-commit hook via lint-staged. See [[How to Develop/Pre-commit Hooks|Pre-commit Hooks]].
