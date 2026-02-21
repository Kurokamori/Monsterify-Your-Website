import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import { MarkdownRenderer } from '../../../components/guides/MarkdownRenderer';
import worldLoreService from '../../../services/worldLoreService';
import type { NPC, NPCCategory } from '../../../services/worldLoreService';
import { getRewardIcon } from './types';

const DEFAULT_AVATAR = '/images/default_avatar.png';

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = DEFAULT_AVATAR;
};

const NPCsPage = () => {
  useDocumentTitle('NPCs');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [categories, setCategories] = useState<NPCCategory[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [npcsData, categoriesData] = await Promise.all([
        worldLoreService.getNPCs(),
        worldLoreService.getNPCCategories(),
      ]);
      setNpcs(npcsData);
      setCategories(categoriesData);
    } catch {
      setError('Failed to load NPCs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return npcs.filter((npc) => {
      const categoryMatch = selectedCategory === 'all' || npc.category === selectedCategory;
      const searchMatch =
        !q ||
        npc.name.toLowerCase().includes(q) ||
        npc.description.toLowerCase().includes(q) ||
        npc.location.toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }, [npcs, searchQuery, selectedCategory]);

  const getCategoryName = (id: string): string =>
    categories.find((c) => c.id === id)?.name || id;

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={npcs.length === 0}
        onRetry={fetchData}
        loadingMessage="Loading NPCs..."
        emptyMessage="No NPCs available yet."
        emptyIcon="fas fa-user"
      >
        <div className="guide-page__header">
          <h1>Important Characters</h1>
          <p>Meet the key figures in the world</p>
        </div>

        <div className="guide-page__toolbar">
          <div className="guide-page__search">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="guide-page__filter">
            <label htmlFor="npc-category-filter">Filter by:</label>
            <select
              id="npc-category-filter"
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
            <i className="fas fa-user-slash" />
            <h3>No characters found</h3>
            <p>No characters match your search criteria.</p>
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
            {filtered.map((npc) => {
              const isExpanded = expandedId === npc.id;
              return (
                <div
                  key={npc.id}
                  className={`npc-card${isExpanded ? ' npc-card--expanded' : ''}`}
                >
                  <button
                    className="npc-card__header"
                    onClick={() => setExpandedId(isExpanded ? null : npc.id)}
                  >
                    <img
                      src={npc.image_url || DEFAULT_AVATAR}
                      alt={npc.name}
                      className="npc-card__avatar"
                      onError={handleImageError}
                    />
                    <div className="npc-card__summary">
                      <h3>{npc.name}</h3>
                      <span className="npc-card__category">
                        {getCategoryName(npc.category)}
                      </span>
                      <p>{npc.description}</p>
                      <span className="npc-card__location">
                        <i className="fas fa-map-marker-alt" /> {npc.location}
                      </span>
                    </div>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} npc-card__toggle`} />
                  </button>

                  {isExpanded && (
                    <div className="expandable-detail">
                      <div className="expandable-detail__section">
                        <h4 className="section-title">Biography</h4>
                        <MarkdownRenderer content={npc.bio} />
                      </div>

                      <div className="expandable-detail__columns">
                        <div className="expandable-detail__section">
                          <h4 className="section-title">Information</h4>
                          <div className="info-pair">
                            <span className="info-pair__label">Faction:</span>
                            <span className="info-pair__value">{npc.faction}</span>
                          </div>
                          <div className="info-pair">
                            <span className="info-pair__label">Specialization:</span>
                            <span className="info-pair__value">{npc.specialization}</span>
                          </div>
                        </div>

                        <div className="expandable-detail__section">
                          <h4 className="section-title">Quests</h4>
                          <ul className="expandable-detail__list">
                            {npc.quests.map((quest, i) => (
                              <li key={i}>{quest}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="expandable-detail__section">
                        <h4 className="section-title">Dialogue</h4>
                        <div className="npc-card__dialogue">
                          {npc.dialogue.map((line, i) => (
                            <div className="npc-card__dialogue-line" key={i}>
                              <i className="fas fa-quote-left" />
                              <p>{line}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="expandable-detail__section">
                        <h4 className="section-title">Rewards</h4>
                        <div className="npc-card__rewards">
                          {npc.rewards.map((reward, i) => (
                            <div className="npc-card__reward" key={i}>
                              <div className="npc-card__reward-icon">
                                <i className={getRewardIcon(reward.type)} />
                              </div>
                              <div className="npc-card__reward-info">
                                <span className="npc-card__reward-name">{reward.name}</span>
                                <span className="npc-card__reward-desc">{reward.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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

export default NPCsPage;
