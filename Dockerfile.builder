# Base builder image — published to GHCR.
# Contains the Obsidian Site project + pre-installed node_modules.
# Users reference this image from their own vault Dockerfile.
#
# Build locally:
#   docker build -f Dockerfile.builder -t obsidian-site-builder .
#
# Published automatically to:
#   ghcr.io/<owner>/obsidian-site:latest

FROM node:22-alpine

WORKDIR /app

# Install dependencies (cached layer — only reruns on package changes)
COPY package*.json ./
RUN npm ci --omit=dev=false

# Copy project source
COPY astro.config.mjs tsconfig.json vault.config.ts ./
COPY src/   ./src/
COPY public/ ./public/
COPY docker/ ./docker/

# Placeholder vault — overridden by COPY in the user's Dockerfile
RUN mkdir -p vault
