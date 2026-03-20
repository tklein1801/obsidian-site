import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const VAULT_PATH = path.resolve('./vault');

export interface VaultFile {
  slug: string;
  title: string;
  filePath: string;
  relativePath: string;
  isCanvas: boolean;
  isMarkdown: boolean;
  isImage: boolean;
  frontmatter: Record<string, unknown>;
  rawContent: string;
  tags: string[];
  icon?: string;
}

export interface VaultIndex {
  files: VaultFile[];
  notesBySlug: Map<string, VaultFile>;
  notesByTitle: Map<string, VaultFile>;
  tagIndex: Map<string, string[]>; // tag -> slugs
}

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif']);

function slugify(relativePath: string): string {
  return relativePath
    .replace(/\.(md|canvas)$/, '')
    .replace(/\\/g, '/')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function getTitle(filePath: string, frontmatter: Record<string, unknown>): string {
  if (frontmatter.title && typeof frontmatter.title === 'string') return frontmatter.title;
  return path.basename(filePath, path.extname(filePath));
}

function scanDir(dir: string, base: string, files: VaultFile[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === '_attachments') {
      if (entry.name !== '_attachments') continue;
    }
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);
    if (entry.isDirectory()) {
      scanDir(full, base, files);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.md') {
        const raw = fs.readFileSync(full, 'utf-8');
        const { data: frontmatter, content } = matter(raw);
        const slug = slugify(rel);
        const inlineTags = [...content.matchAll(/#([\w\u00C0-\u024F/-]+)/g)].map((m) => m[1]);
        const fmTags: string[] = Array.isArray(frontmatter.tags)
          ? frontmatter.tags.map(String)
          : typeof frontmatter.tags === 'string'
            ? [frontmatter.tags]
            : [];
        const tags = [...new Set([...fmTags, ...inlineTags])];
        const icon = typeof frontmatter.icon === 'string' ? frontmatter.icon : undefined;
        files.push({
          slug,
          title: getTitle(entry.name, frontmatter),
          filePath: full,
          relativePath: rel.replace(/\\/g, '/'),
          isCanvas: false,
          isMarkdown: true,
          isImage: false,
          frontmatter,
          rawContent: content,
          tags,
          icon,
        });
      } else if (ext === '.canvas') {
        const raw = fs.readFileSync(full, 'utf-8');
        const slug = slugify(rel);
        files.push({
          slug,
          title: path.basename(entry.name, '.canvas'),
          filePath: full,
          relativePath: rel.replace(/\\/g, '/'),
          isCanvas: true,
          isMarkdown: false,
          isImage: false,
          frontmatter: {},
          rawContent: raw,
          tags: [],
        });
      } else if (IMAGE_EXTENSIONS.has(ext)) {
        files.push({
          slug: rel.replace(/\\/g, '/'),
          title: entry.name,
          filePath: full,
          relativePath: rel.replace(/\\/g, '/'),
          isCanvas: false,
          isMarkdown: false,
          isImage: true,
          frontmatter: {},
          rawContent: '',
          tags: [],
        });
      }
    }
  }
}

let _cache: VaultIndex | null = null;

export function getVaultIndex(): VaultIndex {
  if (_cache) return _cache;

  const files: VaultFile[] = [];
  scanDir(VAULT_PATH, VAULT_PATH, files);

  const notesBySlug = new Map<string, VaultFile>();
  const notesByTitle = new Map<string, VaultFile>();
  const tagIndex = new Map<string, string[]>();

  for (const f of files) {
    if (f.isMarkdown || f.isCanvas) {
      notesBySlug.set(f.slug, f);
      notesByTitle.set(f.title.toLowerCase(), f);
    }
    for (const tag of f.tags) {
      if (!tagIndex.has(tag)) tagIndex.set(tag, []);
      tagIndex.get(tag)!.push(f.slug);
    }
  }

  _cache = { files, notesBySlug, notesByTitle, tagIndex };
  return _cache;
}

export function resolveWikilink(link: string, index: VaultIndex): string | null {
  const [target] = link.split('|');
  const clean = target.trim().replace(/#.*$/, '');

  // try slug match
  for (const [slug, f] of index.notesBySlug) {
    if (slug.endsWith(clean.toLowerCase().replace(/\s+/g, '-'))) return '/' + slug;
    if (f.title.toLowerCase() === clean.toLowerCase()) return '/' + slug;
  }
  return null;
}

export function getBacklinks(slug: string, index: VaultIndex): VaultFile[] {
  const result: VaultFile[] = [];
  const target = index.notesBySlug.get(slug);
  if (!target) return result;

  const titleVariants = new Set([
    target.title.toLowerCase(),
    target.slug.split('/').pop() ?? '',
    slug,
  ]);

  for (const f of index.files) {
    if (!f.isMarkdown || f.slug === slug) continue;
    const raw = f.rawContent.toLowerCase();
    for (const v of titleVariants) {
      if (raw.includes(`[[${v}`) || raw.includes(`[[${v.replace(/-/g, ' ')}`)) {
        result.push(f);
        break;
      }
    }
  }
  return result;
}

export function buildSearchIndex(index: VaultIndex): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const f of index.files) {
    if (!f.isMarkdown) continue;
    entries.push({
      slug: f.slug,
      title: f.title,
      tags: f.tags,
      content: f.rawContent.replace(/```[\s\S]*?```/g, '').replace(/[#*_~`>]/g, ''),
      excerpt: f.rawContent.slice(0, 300).replace(/[#*_~`>\[\]]/g, '').trim(),
    });
  }
  return entries;
}

export interface SearchEntry {
  slug: string;
  title: string;
  tags: string[];
  content: string;
  excerpt: string;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // Might be a plain date like "2024-01-15" – parse directly
    const plain = new Date(iso + 'T00:00:00');
    if (!isNaN(plain.getTime())) {
      return plain.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return iso;
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
