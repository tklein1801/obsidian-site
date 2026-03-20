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

The easiest way to host your vault is the **standalone Dockerfile**. You don't need to clone this repository at all — just drop a single `Dockerfile` into your vault folder and you're done.

### How it works

A pre-built **builder image** (`ghcr.io/OWNER/obsidian-site:latest`) is published automatically on every release. It contains the Obsidian Site project with all dependencies pre-installed. Your Dockerfile only needs to copy your notes into that image and run the build.

### 1. Get the example Dockerfile

Copy `vault/Dockerfile` from this repository into the root of your vault:

```
my-vault/
├── Dockerfile          ← copied from this repo
├── vault.config.ts     ← optional: your site configuration
├── index.md
├── Getting Started.md
└── Topics/
    └── ...
```

### 2. Configure the image name

Open the `Dockerfile` and replace `OWNER` with the GitHub username that hosts this project:

```dockerfile
FROM ghcr.io/OWNER/obsidian-site:latest AS builder
```

### 3. (Optional) Customise your site

Create a `vault.config.ts` in your vault folder and uncomment the line in the Dockerfile:

```dockerfile
# COPY vault.config.ts /app/vault.config.ts
```

See [[Customization]] for all available options.

### 4. Build the image

```bash
cd my-vault
docker build -t my-docs .
```

The build pulls the pre-built base image, copies your notes, generates the static site, and packages everything into a minimal `nginx:stable-alpine` image — typically in under 30 seconds.

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
git clone https://github.com/OWNER/obsidian-site
cd obsidian-site
# copy your notes into vault/
docker build -t my-docs .
docker run -p 8080:80 my-docs
```
