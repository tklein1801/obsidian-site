import { describe, it, expect } from 'vitest';
import {
  parseQuery,
  filterEntry,
  scoreEntry,
  highlight,
  getExcerpt,
  isOnlyOperators,
  runSearch,
} from '../search';
import type { SearchEntry } from '../vault';

function makeEntry(overrides: Partial<SearchEntry> & { slug: string; title: string }): SearchEntry {
  return {
    tags: [],
    content: '',
    excerpt: '',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseQuery
// ---------------------------------------------------------------------------
describe('parseQuery', () => {
  it('parses plain text', () => {
    const result = parseQuery('hello world');
    expect(result.text).toBe('hello world');
    expect(result.tags).toEqual([]);
    expect(result.title).toBe('');
    expect(result.path).toBe('');
  });

  it('parses tag: operator', () => {
    const result = parseQuery('tag:typescript');
    expect(result.tags).toEqual(['typescript']);
    expect(result.text).toBe('');
  });

  it('parses #shorthand tag', () => {
    const result = parseQuery('#react');
    expect(result.tags).toEqual(['react']);
    expect(result.text).toBe('');
  });

  it('parses multiple tags with comma', () => {
    const result = parseQuery('tag:a,b,c');
    expect(result.tags).toEqual(['a', 'b', 'c']);
  });

  it('parses title: operator', () => {
    const result = parseQuery('title:hooks');
    expect(result.title).toBe('hooks');
    expect(result.text).toBe('');
  });

  it('parses title: with quoted value', () => {
    const result = parseQuery('title:"my note"');
    expect(result.title).toBe('my note');
  });

  it('parses path: operator', () => {
    const result = parseQuery('path:programming');
    expect(result.path).toBe('programming');
    expect(result.text).toBe('');
  });

  it('parses combined operators with free text', () => {
    const result = parseQuery('tag:js react hooks');
    expect(result.tags).toEqual(['js']);
    expect(result.text).toBe('react hooks');
  });

  it('combines multiple operators', () => {
    const result = parseQuery('tag:typescript path:src title:test');
    expect(result.tags).toContain('typescript');
    expect(result.path).toBe('src');
    expect(result.title).toBe('test');
  });

  it('handles empty query', () => {
    const result = parseQuery('');
    expect(result.text).toBe('');
    expect(result.tags).toEqual([]);
  });

  it('normalizes tag to lowercase', () => {
    expect(parseQuery('tag:TypeScript').tags).toEqual(['typescript']);
    expect(parseQuery('#React').tags).toEqual(['react']);
  });
});

// ---------------------------------------------------------------------------
// isOnlyOperators
// ---------------------------------------------------------------------------
describe('isOnlyOperators', () => {
  it('returns true when only tags present', () => {
    expect(isOnlyOperators({ tags: ['js'], title: '', path: '', text: '' })).toBe(true);
  });

  it('returns false when text is also present', () => {
    expect(isOnlyOperators({ tags: ['js'], title: '', path: '', text: 'hooks' })).toBe(false);
  });

  it('returns false when no operators and no text', () => {
    expect(isOnlyOperators({ tags: [], title: '', path: '', text: '' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// filterEntry
// ---------------------------------------------------------------------------
describe('filterEntry', () => {
  const entry = makeEntry({
    slug: 'programming/react-hooks',
    title: 'React Hooks',
    tags: ['react', 'javascript'],
    content: 'useState useEffect',
  });

  it('passes with empty query', () => {
    expect(filterEntry(entry, { tags: [], title: '', path: '', text: '' })).toBe(true);
  });

  it('filters by tag (must have all tags)', () => {
    expect(filterEntry(entry, { tags: ['react'], title: '', path: '', text: '' })).toBe(true);
    expect(filterEntry(entry, { tags: ['python'], title: '', path: '', text: '' })).toBe(false);
    expect(filterEntry(entry, { tags: ['react', 'javascript'], title: '', path: '', text: '' })).toBe(true);
    expect(filterEntry(entry, { tags: ['react', 'python'], title: '', path: '', text: '' })).toBe(false);
  });

  it('filters by title', () => {
    expect(filterEntry(entry, { tags: [], title: 'react', path: '', text: '' })).toBe(true);
    expect(filterEntry(entry, { tags: [], title: 'hooks', path: '', text: '' })).toBe(true);
    expect(filterEntry(entry, { tags: [], title: 'python', path: '', text: '' })).toBe(false);
  });

  it('filters by path (matches slug)', () => {
    expect(filterEntry(entry, { tags: [], title: '', path: 'programming', text: '' })).toBe(true);
    expect(filterEntry(entry, { tags: [], title: '', path: 'design', text: '' })).toBe(false);
  });

  it('tag filter is case-insensitive', () => {
    expect(filterEntry(entry, { tags: ['REACT'], title: '', path: '', text: '' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// scoreEntry
// ---------------------------------------------------------------------------
describe('scoreEntry', () => {
  const entry = makeEntry({
    slug: 'python-basics',
    title: 'Python Basics',
    tags: ['python'],
    content: 'Learn Python programming basics including variables and functions.',
  });

  it('returns 1 for empty text (operator-only query)', () => {
    expect(scoreEntry(entry, '')).toBe(1);
  });

  it('scores title match higher than content match', () => {
    const titleScore = scoreEntry(entry, 'python');
    const entry2 = makeEntry({ slug: 'other', title: 'Other', content: 'python' });
    const contentScore = scoreEntry(entry2, 'python');
    expect(titleScore).toBeGreaterThan(contentScore);
  });

  it('scores title-start match extra', () => {
    const startScore = scoreEntry(entry, 'python');
    const entry2 = makeEntry({ slug: 'b', title: 'Learn Python', content: '' });
    const midScore = scoreEntry(entry2, 'python');
    expect(startScore).toBeGreaterThan(midScore);
  });

  it('scores tag match highly', () => {
    const tagScore = scoreEntry(entry, 'python');
    const noTagEntry = makeEntry({ slug: 'b', title: 'B', tags: [], content: 'python' });
    const noTagScore = scoreEntry(noTagEntry, 'python');
    expect(tagScore).toBeGreaterThan(noTagScore);
  });

  it('returns 0 for no match', () => {
    expect(scoreEntry(entry, 'javascript')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// highlight
// ---------------------------------------------------------------------------
describe('highlight', () => {
  it('wraps matches in mark tag', () => {
    const result = highlight('Hello World', ['world']);
    expect(result).toContain('<mark class="search-highlight">World</mark>');
  });

  it('returns unchanged text when no terms', () => {
    expect(highlight('Hello World', [])).toBe('Hello World');
  });

  it('is case-insensitive', () => {
    expect(highlight('Hello WORLD', ['world'])).toContain('<mark');
  });

  it('highlights multiple terms', () => {
    const result = highlight('React and TypeScript', ['react', 'typescript']);
    expect(result).toContain('<mark class="search-highlight">React</mark>');
    expect(result).toContain('<mark class="search-highlight">TypeScript</mark>');
  });

  it('escapes regex special characters in terms', () => {
    expect(() => highlight('test (value)', ['(value)'])).not.toThrow();
  });

  it('filters out empty terms', () => {
    expect(highlight('Hello', ['', '  '])).toBe('Hello');
  });
});

// ---------------------------------------------------------------------------
// getExcerpt
// ---------------------------------------------------------------------------
describe('getExcerpt', () => {
  it('returns first 140 chars when no text', () => {
    const content = 'A'.repeat(200);
    const result = getExcerpt(content, '');
    expect(result).toContain('…');
    expect(result.replace('…', '')).toHaveLength(140);
  });

  it('returns centered excerpt around match', () => {
    const content = 'prefix '.repeat(20) + 'TARGET' + ' suffix'.repeat(20);
    const result = getExcerpt(content, 'TARGET');
    expect(result).toContain('TARGET');
  });

  it('returns content with ellipsis when match not found', () => {
    const result = getExcerpt('short content', 'notfound');
    expect(result).toContain('…');
  });

  it('returns full content without ellipsis when short and no match', () => {
    const result = getExcerpt('short', '');
    expect(result).toBe('short');
  });
});

// ---------------------------------------------------------------------------
// runSearch (integration)
// ---------------------------------------------------------------------------
describe('runSearch', () => {
  const data: SearchEntry[] = [
    makeEntry({ slug: 'react-hooks', title: 'React Hooks', tags: ['react', 'javascript'], content: 'useState useEffect' }),
    makeEntry({ slug: 'python-basics', title: 'Python Basics', tags: ['python'], content: 'variables functions' }),
    makeEntry({ slug: 'advanced/typescript', title: 'Advanced TypeScript', tags: ['typescript', 'javascript'], content: 'generics types' }),
    makeEntry({ slug: 'react-patterns', title: 'React Patterns', tags: ['react'], content: 'compound components' }),
  ];

  it('returns empty for blank query', () => {
    expect(runSearch(data, '')).toEqual([]);
    expect(runSearch(data, '   ')).toEqual([]);
  });

  it('returns matching entries for free text', () => {
    const results = runSearch(data, 'react');
    expect(results.some(r => r.slug === 'react-hooks')).toBe(true);
  });

  it('filters by tag', () => {
    const results = runSearch(data, 'tag:python');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('python-basics');
  });

  it('filters by multiple tags (AND)', () => {
    const results = runSearch(data, 'tag:react,javascript');
    expect(results.every(r => r.tags.includes('react') && r.tags.includes('javascript'))).toBe(true);
  });

  it('filters by #shorthand', () => {
    const results = runSearch(data, '#typescript');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('advanced/typescript');
  });

  it('filters by path', () => {
    const results = runSearch(data, 'path:advanced');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('advanced/typescript');
  });

  it('combines tag and text filters', () => {
    const results = runSearch(data, 'tag:react patterns');
    expect(results.some(r => r.slug === 'react-patterns')).toBe(true);
    expect(results.every(r => r.tags.includes('react'))).toBe(true);
  });

  it('limits results to 15', () => {
    const large = Array.from({ length: 30 }, (_, i) =>
      makeEntry({ slug: `note-${i}`, title: `Note ${i}`, content: 'common content' })
    );
    expect(runSearch(large, 'common').length).toBeLessThanOrEqual(15);
  });
});
