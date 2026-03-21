---
title: Deployment
tags: [how-to, deployment, hosting]
icon: rocket
---

# Deployment

Obsidian Site produces a fully static output in the `dist/` folder. You can host it on any static hosting provider or your own server.

## Build for production

```bash
npm run build
```

Output is written to `dist/`. The build typically completes in under 10 seconds for vaults with hundreds of notes.

## Netlify

1. Push your project to a Git repository (GitHub, GitLab, etc.)
2. Connect the repo on [netlify.com](https://netlify.com)
3. Set the build command and publish directory:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | `22` |

Netlify will redeploy automatically on every push.

## Vercel

1. Import your repository at [vercel.com/new](https://vercel.com/new)
2. Vercel auto-detects Astro — just confirm the settings:

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |

## Cloudflare Pages

1. Go to **Workers & Pages** → **Create application** → **Pages**
2. Connect your Git provider and select the repository
3. Configure the build:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `22` |

## GitHub Pages

Add a workflow file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

## Self-hosted (nginx)

After building, copy the `dist/` folder to your server and configure nginx:

```nginx
server {
    listen 80;
    server_name docs.example.com;
    root /var/www/my-docs/dist;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html /404.html;
    }
}
```

> [!important] 404 handling
> The `try_files` directive with `$uri.html` is important — Astro generates `about/index.html` style files. Without it, direct URL access to nested pages will return a 404 from nginx.

## Docker — standalone vault hosting

The easiest way to host your vault is the **standalone Dockerfile**. You don't need to clone this repository at all — just drop a `Dockerfile` and a `vault.config.ts` into your vault folder and you're done.

### How it works

A pre-built **builder image** (`ghcr.io/tklein1801/obsidian-site:latest`) is published automatically on every release. It contains the Obsidian Site project with all dependencies pre-installed. Your Dockerfile only needs to copy your notes and configuration into that image and run the build.

### 1. Project structure

```
my-vault/
├── Dockerfile
├── vault.config.ts     ← required: your site configuration
├── index.md
├── Getting Started.md
└── Topics/
    └── ...
```

### 2. Dockerfile

Use the following `Dockerfile` exactly as shown — this is the confirmed working version:

```dockerfile
FROM ghcr.io/tklein1801/obsidian-site:latest AS builder

COPY . /app/vault/
COPY vault.config.ts /app/vault.config.ts

RUN cd /app && npm run build

FROM nginx:stable-alpine AS runtime

COPY --from=builder /app/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. vault.config.ts

You must provide a **complete** `vault.config.ts` — it replaces the default configuration inside the builder image. Use the following as your starting point and adjust to your needs:

```typescript
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
  imprint: '',
  privacyNotice: '',
};
```

> [!warning] Provide the full config
> The `vault.config.ts` you supply **replaces** the default inside the image. Always include all fields — do not provide a partial config.

See [[Customization]] for a description of every available option.

### 4. Build the image

```bash
cd my-vault
docker build -t my-docs .
```

The build pulls the pre-built base image, copies your notes and config, generates the static site, and packages everything into a minimal `nginx:stable-alpine` image — typically in under 30 seconds.

### 5. Run the container

```bash
docker run -p 8080:80 my-docs
```

Your site is available at `http://localhost:8080`.

### 6. Docker Compose

```yaml
services:
  docs:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

```bash
docker compose up -d
```

### Updating content

Because the vault is baked into the image at build time, rebuild whenever you update notes:

```bash
docker build -t my-docs . && docker compose up -d --no-deps docs
```

> [!tip] CI/CD
> Trigger a `docker build` automatically whenever your vault folder changes — push to Git and let a workflow rebuild and redeploy.

## Docker — clone the repository

Alternatively, clone this repository, place your notes in the `vault/` directory, then build with the included `Dockerfile`:

```bash
git clone https://github.com/tklein1801/obsidian-site
cd obsidian-site
# copy your notes into vault/
docker build -t my-docs .
docker run -p 8080:80 my-docs
```
