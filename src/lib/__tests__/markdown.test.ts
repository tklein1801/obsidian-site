import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../markdown';
import type { VaultIndex, VaultFile } from '../vault';

function makeIndex(files: VaultFile[] = []): VaultIndex {
  const notesBySlug = new Map(files.filter(f => f.isMarkdown || f.isCanvas).map(f => [f.slug, f]));
  const notesByTitle = new Map(files.filter(f => f.isMarkdown || f.isCanvas).map(f => [f.title.toLowerCase(), f]));
  const tagIndex = new Map<string, string[]>();
  return { files, notesBySlug, notesByTitle, tagIndex };
}

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

const emptyIndex = makeIndex();

describe('renderMarkdown – basic formatting', () => {
  it('renders headings', async () => {
    const html = await renderMarkdown('# Hello\n## World', emptyIndex);
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('<h2');
    expect(html).toContain('World');
  });

  it('renders bold and italic', async () => {
    const html = await renderMarkdown('**bold** and _italic_', emptyIndex);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders inline code', async () => {
    const html = await renderMarkdown('Use `console.log()`', emptyIndex);
    expect(html).toContain('<code>');
    expect(html).toContain('console.log()');
  });

  it('renders fenced code blocks', async () => {
    const html = await renderMarkdown('```js\nconst x = 1;\n```', emptyIndex);
    expect(html).toContain('<pre');
    // shiki tokenizes the code — check that the pre block is present and contains code content
    expect(html).toMatch(/const|shiki/);
  });

  it('renders unordered lists', async () => {
    const html = await renderMarkdown('- item 1\n- item 2', emptyIndex);
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('item 1');
  });

  it('renders ordered lists', async () => {
    const html = await renderMarkdown('1. first\n2. second', emptyIndex);
    expect(html).toContain('<ol');
    expect(html).toContain('first');
  });

  it('renders blockquotes', async () => {
    const html = await renderMarkdown('> a quote', emptyIndex);
    expect(html).toContain('<blockquote');
  });

  it('renders horizontal rules', async () => {
    const html = await renderMarkdown('---', emptyIndex);
    expect(html).toContain('<hr');
  });

  it('renders GFM tables', async () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = await renderMarkdown(md, emptyIndex);
    expect(html).toContain('<table');
    expect(html).toContain('<th');
  });

  it('renders links', async () => {
    const html = await renderMarkdown('[GitHub](https://github.com)', emptyIndex);
    expect(html).toContain('href="https://github.com"');
    expect(html).toContain('GitHub');
  });

  it('renders paragraphs', async () => {
    const html = await renderMarkdown('Hello world.', emptyIndex);
    expect(html).toContain('<p>');
    expect(html).toContain('Hello world.');
  });
});

describe('renderMarkdown – Obsidian features', () => {
  it('renders ==highlights== as <mark>', async () => {
    const html = await renderMarkdown('This is ==highlighted== text.', emptyIndex);
    expect(html).toContain('<mark>highlighted</mark>');
  });

  it('strips %%comments%%', async () => {
    const html = await renderMarkdown('Visible %%this is hidden%% text.', emptyIndex);
    expect(html).not.toContain('this is hidden');
    expect(html).toContain('Visible');
    expect(html).toContain('text.');
  });

  it('renders wikilinks as anchor tags', async () => {
    const files = [makeFile({ slug: 'target-note', title: 'Target Note' })];
    const index = makeIndex(files);
    const html = await renderMarkdown('See [[target-note]] for details.', index);
    expect(html).toContain('href="/target-note"');
  });

  it('uses alias in wikilink display text', async () => {
    const files = [makeFile({ slug: 'target-note', title: 'Target Note' })];
    const index = makeIndex(files);
    const html = await renderMarkdown('See [[target-note|Click here]].', index);
    expect(html).toContain('Click here');
  });

  it('renders unresolved wikilinks with guessed href', async () => {
    const html = await renderMarkdown('[[unknown note]]', emptyIndex);
    expect(html).toContain('unknown-note');
  });

  it('renders image embeds ![[image.png]]', async () => {
    const imgFile: VaultFile = {
      slug: '_attachments/photo.png',
      title: 'photo.png',
      filePath: '/vault/_attachments/photo.png',
      relativePath: '_attachments/photo.png',
      isMarkdown: false,
      isCanvas: false,
      isImage: true,
      frontmatter: {},
      rawContent: '',
      tags: [],
    };
    const index = makeIndex([imgFile]);
    const html = await renderMarkdown('![[photo.png]]', index);
    expect(html).toContain('<img');
    expect(html).toContain('/_vault/');
  });

  it('renders file embeds ![[note]] as embed-link', async () => {
    const html = await renderMarkdown('![[some-note]]', emptyIndex);
    expect(html).toContain('embed-link');
  });
});

describe('renderMarkdown – callouts', () => {
  it('renders [!NOTE] callout', async () => {
    const html = await renderMarkdown('> [!NOTE]\n> This is a note.', emptyIndex);
    expect(html).toContain('callout');
    expect(html).toContain('callout-note');
    expect(html).toContain('This is a note.');
  });

  it('renders [!WARNING] callout', async () => {
    const html = await renderMarkdown('> [!WARNING]\n> Be careful.', emptyIndex);
    expect(html).toContain('callout-warning');
  });

  it('renders [!TIP] callout', async () => {
    const html = await renderMarkdown('> [!TIP]\n> Pro tip.', emptyIndex);
    expect(html).toContain('callout-tip');
  });

  it('renders [!DANGER] callout', async () => {
    const html = await renderMarkdown('> [!DANGER]\n> Danger.', emptyIndex);
    expect(html).toContain('callout-danger');
  });

  it('ignores plain blockquotes (no callout marker)', async () => {
    const html = await renderMarkdown('> regular quote', emptyIndex);
    expect(html).toContain('<blockquote');
    expect(html).not.toContain('callout-title');
  });
});

describe('renderMarkdown – frontmatter', () => {
  it('does not render frontmatter as content', async () => {
    const md = '---\ntitle: My Note\ntags: [test]\n---\n\nContent here.';
    const html = await renderMarkdown(md, emptyIndex);
    expect(html).not.toContain('title: My Note');
    expect(html).toContain('Content here.');
  });
});

describe('renderMarkdown – Mermaid diagrams', () => {
  it('converts a mermaid fenced block to <pre class="mermaid">', async () => {
    const md = '```mermaid\ngraph LR\n  A --> B\n```';
    const html = await renderMarkdown(md, emptyIndex);
    expect(html).toContain('class="mermaid"');
    expect(html).toContain('<pre');
  });

  it('preserves the raw diagram source as text content', async () => {
    const md = '```mermaid\ngraph LR\n  A --> B\n```';
    const html = await renderMarkdown(md, emptyIndex);
    expect(html).toContain('graph LR');
    expect(html).toContain('A --> B');
  });

  it('does NOT syntax-highlight mermaid blocks with Shiki', async () => {
    const md = '```mermaid\ngraph LR\n  A --> B\n```';
    const html = await renderMarkdown(md, emptyIndex);
    // Shiki wraps output in <span> tokens — none should be present in mermaid output
    expect(html).not.toContain('<span');
  });

  it('renders a sequence diagram block', async () => {
    const md = '```mermaid\nsequenceDiagram\n  A->>B: Hello\n  B-->>A: Hi\n```';
    const html = await renderMarkdown(md, emptyIndex);
    expect(html).toContain('class="mermaid"');
    expect(html).toContain('sequenceDiagram');
  });

  it('leaves regular code blocks unaffected', async () => {
    const md = '```typescript\nconst x = 1;\n```';
    const html = await renderMarkdown(md, emptyIndex);
    // Shiki output is present for normal code blocks
    expect(html).toContain('<pre');
    expect(html).not.toContain('class="mermaid"');
  });

  it('adds heading id attributes for TOC extraction', async () => {
    const html = await renderMarkdown('## Section One\n\nContent.', emptyIndex);
    expect(html).toMatch(/id="[^"]+"/);
    expect(html).toContain('Section One');
  });
});
