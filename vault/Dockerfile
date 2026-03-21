# ─────────────────────────────────────────────────────────────────────────────
# Obsidian Site — standalone vault Dockerfile
#
# Place this file in the root of your vault folder alongside your notes
# and a vault.config.ts. Then run:
#   docker build -t my-docs .
#   docker run -p 8080:80 my-docs
#
# Your site will be available at http://localhost:8080
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM ghcr.io/tklein1801/obsidian-site:latest AS builder

# Copy your vault notes into the builder
COPY . /app/vault/

# Copy your site configuration (full vault.config.ts required)
COPY vault.config.ts /app/vault.config.ts

# Build the static site → /app/dist
RUN cd /app && npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS runtime

# nginx config (SPA routing + gzip + cache headers)
COPY --from=builder /app/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
