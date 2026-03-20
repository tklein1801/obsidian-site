import type { SearchEntry } from './vault';

export interface ParsedQuery {
  tags: string[];
  title: string;
  path: string;
  text: string;
}

export function parseQuery(raw: string): ParsedQuery {
  let rest = raw;
  const tags: string[] = [];
  let title = '';
  let path = '';

  rest = rest.replace(/\btag:([\w,/-]+)/gi, (_, v) => {
    tags.push(...v.split(',').map((t: string) => t.toLowerCase().trim()).filter(Boolean));
    return '';
  });

  rest = rest.replace(/#([\w/-]+)/g, (_, v) => {
    tags.push(v.toLowerCase());
    return '';
  });

  rest = rest.replace(/\btitle:"([^"]+)"/gi, (_, v) => { title = v.toLowerCase(); return ''; });
  rest = rest.replace(/\btitle:(\S+)/gi, (_, v) => { title = v.toLowerCase(); return ''; });

  rest = rest.replace(/\bpath:"([^"]+)"/gi, (_, v) => { path = v.toLowerCase(); return ''; });
  rest = rest.replace(/\bpath:(\S+)/gi, (_, v) => { path = v.toLowerCase(); return ''; });

  return { tags, title, path, text: rest.trim() };
}

export function isOnlyOperators(pq: ParsedQuery): boolean {
  return (pq.tags.length > 0 || pq.title !== '' || pq.path !== '') && pq.text === '';
}

export function filterEntry(entry: SearchEntry, pq: ParsedQuery): boolean {
  if (pq.tags.length > 0 && !pq.tags.every(t => entry.tags.some(et => et.toLowerCase().includes(t.toLowerCase())))) return false;
  if (pq.title && !entry.title.toLowerCase().includes(pq.title.toLowerCase())) return false;
  if (pq.path && !entry.slug.toLowerCase().includes(pq.path.toLowerCase())) return false;
  return true;
}

export function scoreEntry(entry: SearchEntry, text: string): number {
  if (!text) return 1;
  const q = text.toLowerCase();
  let score = 0;
  if (entry.title.toLowerCase().includes(q)) score += 10;
  if (entry.title.toLowerCase().startsWith(q)) score += 5;
  if (entry.tags.some(t => t.toLowerCase().includes(q))) score += 8;
  const idx = entry.content.toLowerCase().indexOf(q);
  if (idx !== -1) score += 3;
  return score;
}

export function highlight(text: string, terms: string[]): string {
  if (!terms.length) return text;
  const escaped = terms
    .filter(Boolean)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  if (!escaped) return text;
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>');
}

export function getExcerpt(content: string, text: string): string {
  if (!text) return content.slice(0, 140) + (content.length > 140 ? '…' : '');
  const q = text.toLowerCase();
  const idx = content.toLowerCase().indexOf(q);
  if (idx === -1) return content.slice(0, 140) + '…';
  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + text.length + 80);
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
}

export function runSearch(searchData: SearchEntry[], query: string): SearchEntry[] {
  if (!query.trim()) return [];
  const pq = parseQuery(query);
  if (!pq.text && !pq.tags.length && !pq.title && !pq.path) return [];

  return searchData
    .filter(e => filterEntry(e, pq))
    .map(e => ({ entry: e, score: scoreEntry(e, pq.text) }))
    .filter(x => x.score > 0 || isOnlyOperators(pq))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(x => x.entry);
}
