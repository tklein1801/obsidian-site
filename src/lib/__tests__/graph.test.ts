import { describe, it, expect } from 'vitest';
import { buildGraph, getOutlinks } from '../graph';
import type { VaultIndex, VaultFile } from '../vault';

// Helper to build a minimal VaultFile
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

describe('buildGraph', () => {
  it('returns empty graph for empty vault', () => {
    const index = makeIndex([]);
    const result = buildGraph(index);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('creates one node per markdown file', () => {
    const files = [
      makeFile({ slug: 'note-a', title: 'Note A' }),
      makeFile({ slug: 'note-b', title: 'Note B' }),
    ];
    const index = makeIndex(files);
    const result = buildGraph(index);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.map(n => n.id)).toContain('note-a');
    expect(result.nodes.map(n => n.id)).toContain('note-b');
  });

  it('does not include image or canvas files as nodes', () => {
    const files = [
      makeFile({ slug: 'note-a', title: 'Note A' }),
      { ...makeFile({ slug: 'image.png', title: 'image.png' }), isMarkdown: false, isImage: true },
    ];
    const index = makeIndex(files);
    const result = buildGraph(index);
    expect(result.nodes).toHaveLength(1);
  });

  it('builds edges from wikilinks', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: 'See [[b]].' }),
      makeFile({ slug: 'b', title: 'B', rawContent: '' }),
    ];
    const index = makeIndex(files);
    const result = buildGraph(index);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({ source: 'a', target: 'b' });
  });

  it('deduplicates edges when same link appears multiple times', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: '[[b]] and [[b]] again' }),
      makeFile({ slug: 'b', title: 'B', rawContent: '' }),
    ];
    const index = makeIndex(files);
    const result = buildGraph(index);
    expect(result.edges).toHaveLength(1);
  });

  it('assigns group based on folder path', () => {
    const files = [
      { ...makeFile({ slug: 'folder/note', title: 'Note' }), relativePath: 'folder/note.md' },
      makeFile({ slug: 'root-note', title: 'Root Note' }),
    ];
    const index = makeIndex(files);
    const result = buildGraph(index);
    const folderNode = result.nodes.find(n => n.id === 'folder/note');
    const rootNode = result.nodes.find(n => n.id === 'root-note');
    expect(folderNode?.group).toBe('folder');
    expect(rootNode?.group).toBe('root');
  });

  it('propagates tags from file to graph node', () => {
    const files = [makeFile({ slug: 'a', title: 'A', tags: ['typescript', 'testing'] })];
    const index = makeIndex(files);
    const result = buildGraph(index);
    expect(result.nodes[0].tags).toEqual(['typescript', 'testing']);
  });

  it('resolves wikilink with spaces as slugified target', () => {
    const files = [
      makeFile({ slug: 'my-note', title: 'My Note', rawContent: '[[other note]]' }),
      makeFile({ slug: 'other-note', title: 'Other Note' }),
    ];
    const index = makeIndex(files);
    const result = buildGraph(index);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].target).toBe('other-note');
  });
});

describe('getOutlinks', () => {
  it('returns empty for file with no wikilinks', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: 'No links here.' }),
      makeFile({ slug: 'b', title: 'B' }),
    ];
    const index = makeIndex(files);
    expect(getOutlinks(files[0], index)).toHaveLength(0);
  });

  it('returns linked files', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: '[[b]]' }),
      makeFile({ slug: 'b', title: 'B' }),
    ];
    const index = makeIndex(files);
    const links = getOutlinks(files[0], index);
    expect(links).toHaveLength(1);
    expect(links[0].slug).toBe('b');
  });

  it('deduplicates multiple references to same note', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: '[[b]] and [[b]]' }),
      makeFile({ slug: 'b', title: 'B' }),
    ];
    const index = makeIndex(files);
    expect(getOutlinks(files[0], index)).toHaveLength(1);
  });

  it('ignores image embeds', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: '![[photo.png]]' }),
      makeFile({ slug: 'b', title: 'B' }),
    ];
    const index = makeIndex(files);
    // photo.png is not in notesBySlug so no link should be found
    expect(getOutlinks(files[0], index)).toHaveLength(0);
  });

  it('respects aliased links [[target|alias]]', () => {
    const files = [
      makeFile({ slug: 'a', title: 'A', rawContent: '[[b|Read more]]' }),
      makeFile({ slug: 'b', title: 'B' }),
    ];
    const index = makeIndex(files);
    expect(getOutlinks(files[0], index)).toHaveLength(1);
  });
});
