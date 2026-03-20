import { describe, it, expect } from 'vitest';
import { resolveWikilink, getBacklinks, buildSearchIndex, formatDate } from '../vault';
import type { VaultIndex, VaultFile } from '../vault';

function makeFile(overrides: Partial<VaultFile> & { slug: string; title: string }): VaultFile {
  return {
    filePath: `/vault/${overrides.slug}.md`,
    relativePath: `${overrides.slug}.md`,
    isMarkdown: true,
    isCanvas: false,
    isImage: false,
    frontmatter: {},
    rawContent: '',
    tags: [],
    ...overrides,
  } as VaultFile;
}

function makeIndex(files: VaultFile[]): VaultIndex {
  const notesBySlug = new Map(files.filter(f => f.isMarkdown || f.isCanvas).map(f => [f.slug, f]));
  const notesByTitle = new Map(files.filter(f => f.isMarkdown || f.isCanvas).map(f => [f.title.toLowerCase(), f]));
  const tagIndex = new Map<string, string[]>();
  for (const f of files) {
    for (const tag of f.tags) {
      if (!tagIndex.has(tag)) tagIndex.set(tag, []);
      tagIndex.get(tag)!.push(f.slug);
    }
  }
  return { files, notesBySlug, notesByTitle, tagIndex };
}

// ---------------------------------------------------------------------------
// resolveWikilink
// ---------------------------------------------------------------------------
describe('resolveWikilink', () => {
  const files = [
    makeFile({ slug: 'concepts/zettelkasten', title: 'Zettelkasten Method' }),
    makeFile({ slug: 'index', title: 'Home' }),
    makeFile({ slug: 'python-basics', title: 'Python Basics' }),
  ];
  const index = makeIndex(files);

  it('resolves by exact slug', () => {
    expect(resolveWikilink('index', index)).toBe('/index');
  });

  it('resolves by partial slug (last segment)', () => {
    expect(resolveWikilink('zettelkasten', index)).toBe('/concepts/zettelkasten');
  });

  it('resolves by title (case insensitive)', () => {
    expect(resolveWikilink('zettelkasten method', index)).toBe('/concepts/zettelkasten');
  });

  it('returns null for unknown link', () => {
    expect(resolveWikilink('nonexistent-page', index)).toBeNull();
  });

  it('handles alias syntax [[target|alias]] by resolving target only', () => {
    expect(resolveWikilink('index|Home Page', index)).toBe('/index');
  });

  it('handles heading anchors [[target#heading]]', () => {
    expect(resolveWikilink('python-basics#installation', index)).toBe('/python-basics');
  });
});

// ---------------------------------------------------------------------------
// getBacklinks
// ---------------------------------------------------------------------------
describe('getBacklinks', () => {
  it('returns empty array when slug not found', () => {
    const index = makeIndex([]);
    expect(getBacklinks('missing', index)).toEqual([]);
  });

  it('finds files that link to the target', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: 'See [[b]] for details.' }),
      makeFile({ slug: 'b', title: 'B', rawContent: '' }),
    ];
    const index = makeIndex(files);
    const links = getBacklinks('b', index);
    expect(links).toHaveLength(1);
    expect(links[0].slug).toBe('a');
  });

  it('does not include the note itself as a backlink', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: '[[a]] self-reference' }),
    ];
    const index = makeIndex(files);
    expect(getBacklinks('a', index)).toHaveLength(0);
  });

  it('matches by title variant (spaces instead of hyphens)', () => {
    const files = [
      makeFile({ slug: 'source', title: 'Source', rawContent: 'Check [[my note]]' }),
      makeFile({ slug: 'my-note', title: 'My Note' }),
    ];
    const index = makeIndex(files);
    expect(getBacklinks('my-note', index)).toHaveLength(1);
  });

  it('returns multiple backlinks', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: '[[c]]' }),
      makeFile({ slug: 'b', title: 'B', rawContent: '[[c]]' }),
      makeFile({ slug: 'c', title: 'C' }),
    ];
    const index = makeIndex(files);
    const links = getBacklinks('c', index);
    expect(links).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// buildSearchIndex
// ---------------------------------------------------------------------------
describe('buildSearchIndex', () => {
  it('only indexes markdown files', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A' }),
      { ...makeFile({ slug: 'canvas', title: 'Canvas' }), isMarkdown: false, isCanvas: true },
      { ...makeFile({ slug: 'img.png', title: 'img.png' }), isMarkdown: false, isImage: true },
    ];
    const index = makeIndex(files);
    const entries = buildSearchIndex(index);
    expect(entries).toHaveLength(1);
    expect(entries[0].slug).toBe('a');
  });

  it('strips markdown syntax from content', () => {
    const files = [
      makeFile({
        slug: 'a',
        title: 'A',
        rawContent: '# Heading\n**bold** and _italic_ with `code`',
      }),
    ];
    const index = makeIndex(files);
    const entries = buildSearchIndex(index);
    expect(entries[0].content).not.toContain('#');
    expect(entries[0].content).not.toContain('**');
    expect(entries[0].content).not.toContain('`');
  });

  it('strips code blocks from content', () => {
    const files = [
      makeFile({
        slug: 'a',
        title: 'A',
        rawContent: 'Before\n```js\nconst x = 1;\n```\nAfter',
      }),
    ];
    const index = makeIndex(files);
    expect(buildSearchIndex(index)[0].content).not.toContain('const x');
  });

  it('includes tags in search entry', () => {
    const files = [makeFile({ slug: 'a', title: 'A', tags: ['typescript', 'react'] })];
    const index = makeIndex(files);
    const entries = buildSearchIndex(index);
    expect(entries[0].tags).toEqual(['typescript', 'react']);
  });

  it('provides excerpt from raw content', () => {
    const longContent = 'A'.repeat(400);
    const files = [makeFile({ slug: 'a', title: 'A', rawContent: longContent })];
    const index = makeIndex(files);
    const entries = buildSearchIndex(index);
    expect(entries[0].excerpt.length).toBeLessThanOrEqual(300);
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('returns — for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats ISO date string', () => {
    const result = formatDate('2024-03-15T10:00:00Z');
    expect(result).toContain('2024');
    expect(result).toContain('Mar');
  });

  it('formats plain date string (YYYY-MM-DD)', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('2024');
    expect(result).toContain('Jan');
  });

  it('returns original string for unrecognized formats', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

// ---------------------------------------------------------------------------
// getBacklinks – icon propagation
// ---------------------------------------------------------------------------
describe('getBacklinks – icon on linked notes', () => {
  it('preserves the icon of a backlinking file', () => {
    const files = [
      makeFile({ slug: 'source', title: 'Source', icon: 'rocket', rawContent: 'See [[target]]' }),
      makeFile({ slug: 'target', title: 'Target' }),
    ];
    const index = makeIndex(files);
    const links = getBacklinks('target', index);
    expect(links[0].icon).toBe('rocket');
  });

  it('returns undefined icon when the backlinking file has no icon set', () => {
    const files = [
      makeFile({ slug: 'source', title: 'Source', rawContent: '[[target]]' }),
      makeFile({ slug: 'target', title: 'Target' }),
    ];
    const index = makeIndex(files);
    const links = getBacklinks('target', index);
    expect(links[0].icon).toBeUndefined();
  });

  it('preserves the title of a backlinking file alongside its icon', () => {
    const files = [
      makeFile({ slug: 'guide', title: 'Getting Started', icon: 'book-open', rawContent: '[[target]]' }),
      makeFile({ slug: 'target', title: 'Target' }),
    ];
    const index = makeIndex(files);
    const links = getBacklinks('target', index);
    expect(links[0].title).toBe('Getting Started');
    expect(links[0].icon).toBe('book-open');
  });

  it('handles multiple backlinks each with their own icon', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', icon: 'hammer', rawContent: '[[c]]' }),
      makeFile({ slug: 'b', title: 'B', icon: 'flask-conical', rawContent: '[[c]]' }),
      makeFile({ slug: 'c', title: 'C' }),
    ];
    const index = makeIndex(files);
    const links = getBacklinks('c', index);
    const icons = links.map(l => l.icon);
    expect(icons).toContain('hammer');
    expect(icons).toContain('flask-conical');
  });

  it('falls back gracefully when icon is undefined (markdown file without icon)', () => {
    const files = [
      makeFile({ slug: 'no-icon-source', title: 'No Icon', rawContent: '[[target]]' }),
      makeFile({ slug: 'target', title: 'Target' }),
    ];
    const index = makeIndex(files);
    const links = getBacklinks('target', index);
    expect(links[0].icon).toBeUndefined();
  });
});
