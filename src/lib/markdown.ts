import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import rehypeShiki from '@shikijs/rehype';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { Root as HastRoot } from 'hast';
import type { VaultIndex } from './vault';
import { resolveWikilink } from './vault';
import path from 'path';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.bmp']);

function isImagePath(target: string): boolean {
  return IMAGE_EXTS.has(path.extname(target).toLowerCase());
}

// Find an image in the vault by filename or relative path, returns the public URL
function findImageUrl(target: string, index: VaultIndex): string | null {
  const normalTarget = target.replace(/\\/g, '/');
  // Try exact relative path match first
  for (const f of index.files) {
    if (!f.isImage) continue;
    if (f.relativePath === normalTarget) return encodeURI(`/_vault/${f.relativePath}`);
  }
  // Fall back to filename match (Obsidian style: just the filename without path)
  const targetName = path.basename(normalTarget).toLowerCase();
  for (const f of index.files) {
    if (!f.isImage) continue;
    if (path.basename(f.relativePath).toLowerCase() === targetName) {
      return encodeURI(`/_vault/${f.relativePath}`);
    }
  }
  return null;
}

// Remark plugin: transform Obsidian wikilinks [[note]] and ![[embed]]
function remarkObsidianLinks(index: VaultIndex) {
  return (tree: Root) => {
    // Replace wikilinks in text nodes
    visit(tree, 'text', (node, idx, parent) => {
      if (!parent || idx === undefined) return;
      const text = node.value;
      if (!text.includes('[[')) return;

      const parts: unknown[] = [];
      let last = 0;
      const re = /!?\[\[([^\]]+)\]\]/g;
      let m: RegExpExecArray | null;

      while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });

        const isEmbed = m[0].startsWith('!');
        const raw = m[1];
        const [target, alias] = raw.split('|');
        const trimmedTarget = target.trim();

        if (isEmbed && isImagePath(trimmedTarget)) {
          // Image embed: ![[image.png]]
          const imgUrl = findImageUrl(trimmedTarget, index) ?? encodeURI(`/_vault/${trimmedTarget}`);
          const altText = alias?.trim() ?? path.basename(trimmedTarget, path.extname(trimmedTarget));
          parts.push({
            type: 'html',
            value: `<img src="${imgUrl}" alt="${altText}" class="note-image" loading="lazy" />`,
          });
        } else if (isEmbed) {
          const href = resolveWikilink(raw, index) ?? `/${trimmedTarget.toLowerCase().replace(/\s+/g, '-')}`;
          const display = alias?.trim() ?? trimmedTarget.split('#')[0];
          parts.push({
            type: 'html',
            value: `<span class="obsidian-embed" data-target="${trimmedTarget}"><a href="${href}" class="embed-link">📎 ${display}</a></span>`,
          });
        } else {
          const href = resolveWikilink(raw, index) ?? `/${trimmedTarget.toLowerCase().replace(/\s+/g, '-')}`;
          const display = alias?.trim() ?? trimmedTarget.split('#')[0];
          parts.push({
            type: 'link',
            url: href,
            children: [{ type: 'text', value: display }],
            data: { hProperties: { class: 'wikilink' } },
          });
        }
        last = m.index + m[0].length;
      }

      if (parts.length === 0) return;
      if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });

      parent.children.splice(idx, 1, ...(parts as typeof parent.children));
    });
  };
}

// Rehype plugin: fix relative/plain image src → /_vault/... and add lazy loading
function rehypeFixImages(index: VaultIndex, noteRelativePath?: string) {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: { tagName: string; properties?: Record<string, unknown> }) => {
      if (node.tagName !== 'img' || !node.properties) return;
      const src = node.properties.src as string | undefined;
      if (!src || src.startsWith('http') || src.startsWith('/_vault/') || src.startsWith('data:')) return;

      // Add lazy loading to all images
      node.properties.loading = 'lazy';
      node.properties.class = ((node.properties.class as string) ?? '') + ' note-image';

      // Try to resolve relative paths based on the note's directory
      let resolved: string | null = null;
      if ((src.startsWith('./') || src.startsWith('../') || !src.startsWith('/')) && noteRelativePath) {
        const noteDir = path.dirname(noteRelativePath);
        const candidate = path.normalize(path.join(noteDir, src)).replace(/\\/g, '/');
        resolved = findImageUrl(candidate, index);
      }
      if (!resolved) {
        resolved = findImageUrl(src, index);
      }
      if (resolved) {
        node.properties.src = resolved;
      }
    });
  };
}

// Remark plugin: transform Obsidian callouts
function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node, idx, parent) => {
      if (!parent || idx === undefined) return;
      const first = node.children[0];
      if (!first || first.type !== 'paragraph') return;
      const firstChild = first.children[0];
      if (!firstChild || firstChild.type !== 'text') return;
      const match = firstChild.value.match(/^\[!([A-Z]+)\][-+]?\s*/i);
      if (!match) return;

      const type = match[1].toLowerCase();
      const ICONS: Record<string, string> = {
        note: '📝', info: 'ℹ️', tip: '💡', warning: '⚠️', danger: '🔥',
        error: '❌', success: '✅', question: '❓', quote: '💬', abstract: '📋',
        example: '🔖', bug: '🐛', todo: '☑️',
      };
      const icon = ICONS[type] ?? '📌';
      const title = type.charAt(0).toUpperCase() + type.slice(1);

      // Remove callout marker from first text
      firstChild.value = firstChild.value.replace(/^\[![A-Z]+\][-+]?\s*/i, '');

      const html = `<div class="callout callout-${type}">
<div class="callout-title"><span class="callout-icon">${icon}</span><span>${title}</span></div>
<div class="callout-content">`;

      parent.children.splice(idx, 1, {
        type: 'html' as const,
        value: html,
      } as unknown as typeof parent.children[0], ...node.children as typeof parent.children, {
        type: 'html' as const,
        value: '</div></div>',
      } as unknown as typeof parent.children[0]);
    });
  };
}

// Remark plugin: ==highlights== -> <mark>
function remarkHighlights() {
  return (tree: Root) => {
    visit(tree, 'text', (node, idx, parent) => {
      if (!parent || idx === undefined) return;
      if (!node.value.includes('==')) return;

      const parts: unknown[] = [];
      let last = 0;
      const re = /==([^=]+)==/g;
      let m: RegExpExecArray | null;

      while ((m = re.exec(node.value)) !== null) {
        if (m.index > last) parts.push({ type: 'text', value: node.value.slice(last, m.index) });
        parts.push({ type: 'html', value: `<mark>${m[1]}</mark>` });
        last = m.index + m[0].length;
      }

      if (parts.length === 0) return;
      if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });

      parent.children.splice(idx, 1, ...(parts as typeof parent.children));
    });
  };
}

// Remark plugin: strip %%comments%%
function remarkObsidianComments() {
  return (tree: Root) => {
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(/%%[\s\S]*?%%/g, '');
    });
  };
}

// Rehype plugin: convert ```mermaid code blocks → <pre class="mermaid">
// Must run BEFORE rehypeShiki so Shiki never sees mermaid as a code block
function rehypeMermaid() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (node.tagName !== 'pre' || index == null) return;
      const code = node.children?.[0];
      if (
        !code ||
        code.type !== 'element' ||
        code.tagName !== 'code' ||
        !((code.properties?.className as string[] | undefined) ?? []).includes('language-mermaid')
      ) return;

      // Extract raw text content
      const text: string[] = [];
      visit(code, 'text', (t: any) => text.push(t.value));

      parent.children[index] = {
        type: 'element',
        tagName: 'pre',
        properties: { className: ['mermaid'] },
        children: [{ type: 'text', value: text.join('') }],
      };
    });
  };
}

// Rehype plugin: add id attributes to headings for TOC anchor links
function rehypeHeadingIds() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: any) => {
      if (!/^h[1-6]$/.test(node.tagName) || node.properties?.id) return;
      const parts: string[] = [];
      visit(node, 'text', (t: any) => parts.push(t.value));
      const id = parts.join('')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if (id) {
        node.properties = node.properties ?? {};
        node.properties.id = id;
      }
    });
  };
}

export async function renderMarkdown(raw: string, index: VaultIndex, noteRelativePath?: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkObsidianComments)
    .use(remarkHighlights)
    .use(remarkCallouts)
    .use(remarkObsidianLinks, index)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeFixImages, index, noteRelativePath)
    .use(rehypeMermaid)
    .use(rehypeHeadingIds)
    .use(rehypeShiki, { theme: 'github-dark' })
    .use(rehypeStringify);

  const result = await processor.process(raw);
  return String(result);
}
