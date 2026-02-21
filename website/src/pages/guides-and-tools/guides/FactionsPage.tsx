import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import { MarkdownRenderer } from '../../../components/guides/MarkdownRenderer';
import worldLoreService from '../../../services/worldLoreService';
import type { Faction } from '../../../services/worldLoreService';
import { capitalize } from './types';

const DEFAULT_IMAGE = '/images/default_faction.png';
const DEFAULT_AVATAR = '/images/default_avatar.png';

const handleImageError = (fallback: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = fallback;
};

const FactionsPage = () => {
  useDocumentTitle('Factions');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await worldLoreService.getFactions();
      setFactions(data);
    } catch {
      setError('Failed to load factions. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactions();
  }, [fetchFactions]);

  const filtered = useMemo(() => {
    if (!searchQuery) return factions;
    const q = searchQuery.toLowerCase();
    return factions.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q),
    );
  }, [factions, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={factions.length === 0}
        onRetry={fetchFactions}
        loadingMessage="Loading factions..."
        emptyMessage="No factions available yet."
        emptyIcon="fas fa-flag"
      >
        <div className="guide-page__header">
          <h1>World Factions</h1>
          <p>Learn about the various organizations and groups in the world</p>
        </div>

        <div className="guide-page__toolbar">
          <div className="guide-page__search">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search factions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users" />
            <h3>No factions found</h3>
            <p>No factions match your search criteria.</p>
            <button className="button secondary" onClick={() => setSearchQuery('')}>
              Reset Search
            </button>
          </div>
        ) : (
          <div className="guide-page__grid">
            {filtered.map((faction) => {
              const isExpanded = expandedId === faction.id;
              return (
                <div
                  key={faction.id}
                  className={`faction-card${isExpanded ? ' faction-card--expanded' : ''}`}
                >
                  <div
                    className="faction-card__header"
                    onClick={() => toggleExpand(faction.id)}
                  >
                    <div
                      className="faction-card__banner"
                      style={{ borderColor: faction.color }}
                    >
                      <img
                        src={faction.image_url || DEFAULT_IMAGE}
                        alt={faction.name}
                        className="faction-card__image"
                        onError={handleImageError(DEFAULT_IMAGE)}
                      />
                    </div>
                    <div className="faction-card__summary">
                      <h3 style={{ color: faction.color }}>{faction.name}</h3>
                      <span
                        className="faction-card__alignment"
                        data-alignment={faction.alignment}
                      >
                        {capitalize(faction.alignment)}
                      </span>
                      <p>{faction.description}</p>
                      <div className="faction-card__info">
                        <div className="info-pair">
                          <span className="info-pair__label">Leader:</span>
                          <span className="info-pair__value">{faction.leader}</span>
                        </div>
                        <div className="info-pair">
                          <span className="info-pair__label">HQ:</span>
                          <span className="info-pair__value">{faction.headquarters}</span>
                        </div>
                      </div>
                      <span className="expand-toggle">
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="expandable-detail">
                      <div className="expandable-detail__section">
                        <h4 className="section-title">History</h4>
                        <MarkdownRenderer content={faction.history} />
                      </div>

                      <div className="expandable-detail__section">
                        <h4 className="section-title">Goals</h4>
                        <ul className="expandable-detail__list">
                          {faction.goals.map((goal, i) => (
                            <li key={i}>{goal}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="expandable-detail__section">
                        <h4 className="section-title">Notable Members</h4>
                        <div className="member-grid">
                          {faction.notable_members.map((member, i) => (
                            <div className="member-grid__item" key={i}>
                              <img
                                src={member.image_url || DEFAULT_AVATAR}
                                alt={member.name}
                                className="member-grid__avatar"
                                onError={handleImageError(DEFAULT_AVATAR)}
                              />
                              <div className="member-grid__info">
                                <span className="member-grid__name">{member.name}</span>
                                <span className="member-grid__role">{member.role}</span>
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

export default FactionsPage;
