// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import path from 'path';
import fs from 'fs';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.bmp']);

function walkAndCopyImages(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      walkAndCopyImages(src, dest);
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      fs.copyFileSync(src, dest);
    }
  }
}

/** @type {import('vite').Plugin} */
const vaultImagesCopyPlugin = {
  name: 'vault-images-copy',
  buildStart() {
    walkAndCopyImages('./vault', './public/_vault');
  },
};

// https://astro.build/config
export default defineConfig({
  output: 'static',
  vite: {
    plugins: [tailwindcss(), vaultImagesCopyPlugin],
    resolve: {
      alias: {
        '@': path.resolve('./src'),
        '@vault': path.resolve('./vault'),
      },
    },
    optimizeDeps: {
      include: ['@xyflow/react'],
    },
  },
  integrations: [react()],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});