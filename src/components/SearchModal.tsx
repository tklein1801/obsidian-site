import { useState, useEffect, useRef } from 'react';
import type { SearchEntry } from '../lib/vault';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  parseQuery,
  filterEntry,
  scoreEntry,
  highlight,
  getExcerpt,
  isOnlyOperators,
  runSearch,
} from '../lib/search';

interface Props {
  searchData: SearchEntry[];
}

function toPascal(s: string): string {
  return s
    .split('-')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function getIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return LucideIcons.FileText;
  return (LucideIcons as unknown as Record<string, LucideIcon>)[toPascal(iconName)] ?? LucideIcons.FileText;
}

// ---------------------------------------------------------------------------
// Token chips rendered inside the input area
// ---------------------------------------------------------------------------
interface TokenChipProps {
  label: string;
  onRemove: () => void;
}
function TokenChip({ label, onRemove }: TokenChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
      style={{ background: 'var(--accent-dim, rgba(122,173,255,0.15))', color: 'var(--accent)', border: '1px solid rgba(122,173,255,0.3)' }}
    >
      {label}
      <button
        onClick={onRemove}
        className="leading-none opacity-60 hover:opacity-100"
        style={{ lineHeight: 1 }}
        tabIndex={-1}
      >×</button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SearchModal({ searchData }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = parseQuery(query);
  const highlightTerms = [parsed.text, parsed.title].filter(Boolean);

  useEffect(() => {
    const scored = query.trim() ? runSearch(searchData, query) : [];
    setResults(scored);
    setSelectedIdx(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setQuery(''); setResults([]); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);

    const btn = document.getElementById('search-btn');
    if (btn) btn.addEventListener('click', () => { setQuery(''); setResults([]); setOpen(true); });

    const openHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      if (detail?.query) setQuery(detail.query);
      setOpen(true);
    };
    document.addEventListener('open-search', openHandler);

    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('open-search', openHandler);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const navigate = (slug: string) => {
    window.location.href = slug === 'index' ? '/' : `/${slug}`;
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) navigate(results[selectedIdx].slug);
  };

  const removeTag = (tag: string) => {
    // Remove from query string
    setQuery(q => q.replace(new RegExp(`(tag:${tag}(,\\w+)*|#${tag})\\s*`, 'g'), '').trim());
  };

  if (!open) return null;

  const hasFilters = parsed.tags.length > 0 || parsed.title || parsed.path;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
      >
        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-faint)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>

          {/* Active filter chips */}
          {parsed.tags.map(t => (
            <TokenChip key={t} label={`#${t}`} onRemove={() => removeTag(t)} />
          ))}
          {parsed.title && (
            <TokenChip label={`title:${parsed.title}`} onRemove={() => setQuery(q => q.replace(/title:\S+/gi, '').trim())} />
          )}
          {parsed.path && (
            <TokenChip label={`path:${parsed.path}`} onRemove={() => setQuery(q => q.replace(/path:\S+/gi, '').trim())} />
          )}

          <input
            ref={inputRef}
            type="text"
            placeholder={hasFilters ? 'Refine…' : 'Search  ·  tag:name  ·  title:foo  ·  path:folder'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 min-w-0 bg-transparent outline-none text-base"
            style={{ color: 'var(--text-primary)' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} style={{ color: 'var(--text-faint)' }} className="text-xs hover:text-white transition-colors flex-shrink-0">✕</button>
          )}
          <kbd className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-faint)' }}>Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[26rem] overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
              No results for "{query}"
            </div>
          )}
          {!query && (
            <div className="px-5 py-5 text-sm space-y-3" style={{ color: 'var(--text-faint)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <kbd className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>↑↓</kbd>
                <span>navigate</span>
                <kbd className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>↵</kbd>
                <span>open</span>
                <kbd className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>Esc</kbd>
                <span>close</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                <div><code className="text-xs" style={{ color: 'var(--accent)' }}>tag:name</code> <span>— filter by tag</span></div>
                <div><code className="text-xs" style={{ color: 'var(--accent)' }}>#name</code> <span>— shorthand for tag</span></div>
                <div><code className="text-xs" style={{ color: 'var(--accent)' }}>tag:a,b</code> <span>— multiple tags (AND)</span></div>
                <div><code className="text-xs" style={{ color: 'var(--accent)' }}>title:foo</code> <span>— match title</span></div>
                <div><code className="text-xs" style={{ color: 'var(--accent)' }}>path:folder</code> <span>— match path</span></div>
                <div><code className="text-xs" style={{ color: 'var(--accent)' }}>tag:js react</code> <span>— combine operators</span></div>
              </div>
            </div>
          )}
          {results.length > 0 && (
            <ul className="p-2 space-y-1">
              {results.map((r, i) => (
                <li key={r.slug}>
                  <button
                    className="search-result w-full text-left"
                    style={i === selectedIdx ? { background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' } : {}}
                    onClick={() => navigate(r.slug)}
                    onMouseEnter={() => setSelectedIdx(i)}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {(() => {
                        const Icon = getIconComponent(r.icon);
                        return (
                          <span
                            className="flex-shrink-0"
                            data-testid={`search-icon-${r.slug}`}
                            data-icon-name={r.icon ?? 'file-text'}
                            aria-hidden="true"
                            style={{ color: 'var(--accent)' }}
                          >
                            <Icon size={16} strokeWidth={1.7} />
                          </span>
                        );
                      })()}
                      <span
                        className="font-medium text-sm truncate"
                        style={{ color: 'var(--text-primary)' }}
                        dangerouslySetInnerHTML={{ __html: highlight(r.title, highlightTerms) }}
                      />
                      {r.tags.length > 0 && (
                        <span className="flex gap-1 ml-auto flex-shrink-0">
                          {r.tags.slice(0, 3).map(t => (
                            <span
                              key={t}
                              className="tag-pill"
                              style={{
                                fontSize: '0.65rem',
                                background: parsed.tags.includes(t.toLowerCase()) ? 'rgba(122,173,255,0.2)' : undefined,
                                color: parsed.tags.includes(t.toLowerCase()) ? 'var(--accent)' : undefined,
                              }}
                            >#{t}</span>
                          ))}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs line-clamp-2"
                      style={{ color: 'var(--text-faint)' }}
                      dangerouslySetInnerHTML={{ __html: highlight(getExcerpt(r.content, parsed.text), highlightTerms) }}
                    />
                    {parsed.path && (
                      <p className="text-xs mt-0.5 opacity-50 truncate">{r.slug}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t flex items-center gap-3 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>
          <span>{searchData.length} notes indexed</span>
          {results.length > 0 && <span>· {results.length} result{results.length !== 1 ? 's' : ''}</span>}
          {hasFilters && (
            <span className="ml-auto flex items-center gap-1">
              {parsed.tags.map(t => <span key={t} style={{ color: 'var(--accent)' }}>#{t}</span>)}
              {parsed.title && <span style={{ color: 'var(--accent)' }}>title:{parsed.title}</span>}
              {parsed.path && <span style={{ color: 'var(--accent)' }}>path:{parsed.path}</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
