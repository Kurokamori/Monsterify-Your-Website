import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import guidesService from '../../services/guidesService';
import type { GuideSearchResult } from '../../services/guidesService';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Sections' },
  { value: 'guides', label: 'Game Guides' },
  { value: 'lore', label: 'Lore' },
  { value: 'factions', label: 'Factions' },
  { value: 'npcs', label: 'NPCs' },
];

interface GuideSearchProps {
  activeCategory?: string;
}

export const GuideSearch = ({ activeCategory }: GuideSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(activeCategory ?? '');
  const [results, setResults] = useState<GuideSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync category dropdown when the active tab changes
  useEffect(() => {
    setCategory(activeCategory ?? '');
  }, [activeCategory]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (q: string, cat: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const data = await guidesService.searchGuides(q, cat || undefined);
      setResults(data);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query, category);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, performSearch]);

  const handleNavigate = (result: GuideSearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/guides/${result.category}/${result.filePath}?highlight=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const highlightMatch = useCallback((text: string, q: string): React.ReactNode[] => {
    if (!q) return [text];
    const parts: React.ReactNode[] = [];
    const lower = text.toLowerCase();
    const qLower = q.toLowerCase();
    let lastIdx = 0;

    let pos = lower.indexOf(qLower);
    while (pos !== -1) {
      if (pos > lastIdx) parts.push(text.slice(lastIdx, pos));
      parts.push(
        <mark key={pos} className="guide-search__highlight">
          {text.slice(pos, pos + q.length)}
        </mark>
      );
      lastIdx = pos + q.length;
      pos = lower.indexOf(qLower, lastIdx);
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx));
    return parts;
  }, []);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, { categoryName: string; items: GuideSearchResult[] }> = {};
    for (const r of results) {
      if (!groups[r.category]) {
        groups[r.category] = { categoryName: r.categoryName, items: [] };
      }
      groups[r.category].items.push(r);
    }
    return groups;
  }, [results]);

  const totalResults = results.length;

  return (
    <div className="guide-search" ref={containerRef}>
      <div className="guide-search__bar">
        <div className="guide-search__input-wrapper">
          <i className="fas fa-search guide-search__icon" />
          <input
            ref={inputRef}
            type="text"
            className="guide-search__input"
            placeholder="Search guides..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0 && query.length >= 2) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              className="guide-search__clear"
              onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
              aria-label="Clear search"
            >
              <i className="fas fa-times" />
            </button>
          )}
          {loading && <i className="fas fa-spinner fa-spin guide-search__spinner" />}
        </div>

        <select
          className="guide-search__category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="guide-search__dropdown">
          {totalResults === 0 && !loading && (
            <div className="guide-search__empty">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {totalResults > 0 && (
            <>
              <div className="guide-search__count">
                {totalResults} result{totalResults !== 1 ? 's' : ''} found
              </div>

              <div className="guide-search__results">
                {Object.entries(groupedResults).map(([cat, group]) => (
                  <div key={cat} className="guide-search__group">
                    <div className="guide-search__group-header">
                      {group.categoryName}
                    </div>
                    {group.items.map((result) => (
                      <button
                        key={`${result.category}-${result.filePath}`}
                        className="guide-search__result"
                        onClick={() => handleNavigate(result)}
                        type="button"
                      >
                        <div className="guide-search__result-title">
                          {highlightMatch(result.title, query)}
                        </div>
                        <div className="guide-search__result-path">
                          {result.category}/{result.filePath}
                        </div>
                        {result.matches.slice(0, 2).map((match, idx) => (
                          <div key={idx} className="guide-search__result-context">
                            {match.context.split('\n').map((line, lineIdx) => (
                              <span key={lineIdx} className="guide-search__context-line">
                                {highlightMatch(line, query)}
                              </span>
                            ))}
                          </div>
                        ))}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
