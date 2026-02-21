import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import { MarkdownRenderer } from '../../../components/guides/MarkdownRenderer';
import worldLoreService from '../../../services/worldLoreService';
import type { LoreEntry, LoreCategory } from '../../../services/worldLoreService';

const DEFAULT_IMAGE = '/images/default_lore.png';

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = DEFAULT_IMAGE;
};

const getRelatedEntries = (current: LoreEntry, all: LoreEntry[]): LoreEntry[] =>
  all.filter((e) => e.id !== current.id && e.category === current.category).slice(0, 3);

const LorePage = () => {
  useDocumentTitle('Lore');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [categories, setCategories] = useState<LoreCategory[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [entriesData, categoriesData] = await Promise.all([
        worldLoreService.getLoreEntries(),
        worldLoreService.getLoreCategories(),
      ]);
      setEntries(entriesData);
      setCategories(categoriesData);
    } catch {
      setError('Failed to load lore data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      const categoryMatch = selectedCategory === 'all' || entry.category === selectedCategory;
      const searchMatch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }, [entries, searchQuery, selectedCategory]);

  const getCategoryName = (id: string): string =>
    categories.find((c) => c.id === id)?.name || id;

  const scrollToEntry = (id: string) => {
    setExpandedId(id);
    document.getElementById(`lore-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={entries.length === 0}
        onRetry={fetchData}
        loadingMessage="Loading lore..."
        emptyMessage="No lore entries available yet."
        emptyIcon="fas fa-scroll"
      >
        <div className="guide-page__header">
          <h1>World Lore &amp; History</h1>
          <p>Explore the rich history, legends, and stories of the world</p>
        </div>

        <div className="guide-page__toolbar">
          <div className="guide-page__search">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search lore entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="guide-page__filter">
            <label htmlFor="lore-category-filter">Filter by:</label>
            <select
              id="lore-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-book" />
            <h3>No lore entries found</h3>
            <p>No entries match your search criteria.</p>
            <button
              className="button secondary"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="guide-page__list">
            {filtered.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <div
                  key={entry.id}
                  id={`lore-${entry.id}`}
                  className={`lore-entry${isExpanded ? ' lore-entry--expanded' : ''}`}
                >
                  <button
                    className="lore-entry__header"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="lore-entry__title-row">
                      <h3>{entry.title}</h3>
                      <span className="lore-entry__category">
                        {getCategoryName(entry.category)}
                      </span>
                    </div>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} />
                  </button>

                  <div className="lore-entry__summary">
                    <p>{entry.summary}</p>
                  </div>

                  {isExpanded && (
                    <div className="expandable-detail">
                      {entry.image_url && (
                        <div className="lore-entry__image">
                          <img
                            src={entry.image_url}
                            alt={entry.title}
                            onError={handleImageError}
                          />
                        </div>
                      )}

                      <MarkdownRenderer content={entry.content} />

                      {getRelatedEntries(entry, entries).length > 0 && (
                        <div className="expandable-detail__section">
                          <h4 className="section-title">Related Entries</h4>
                          <div className="lore-entry__related">
                            {getRelatedEntries(entry, entries).map((related) => (
                              <button
                                key={related.id}
                                className="button secondary"
                                onClick={() => scrollToEntry(related.id)}
                              >
                                {related.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AutoStateContainer>
    </div>
  );
};

export default LorePage;
