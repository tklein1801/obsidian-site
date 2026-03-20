# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy project source
COPY astro.config.mjs tsconfig.json vault.config.ts ./
COPY src/ ./src/
COPY public/ ./public/

# Copy vault — replace this folder with your own vault before building
COPY vault/ ./vault/

# Build static site → /app/dist
RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS runtime

# Custom nginx config: SPA-style routing + gzip + cache headers
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
