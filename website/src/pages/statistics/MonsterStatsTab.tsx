import { useState, useEffect, useCallback, useMemo } from 'react';
import { AutoStateContainer } from '@components/common';
import statisticsService from '@services/statisticsService';
import type { MonsterStatsResponse, MonsterSummary } from '@services/statisticsService';

type SpotlightSort = 'name' | 'hp' | 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed' | 'total';

const MonsterStatsTab = () => {
  const [stats, setStats] = useState<MonsterStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [spotlightSort, setSpotlightSort] = useState<SpotlightSort>('total');
  const [spotlightOrder, setSpotlightOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getMonsterStats();
      setStats(data);
    } catch {
      setError('Failed to load monster statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const allTypes = stats
    ? ['all', ...Object.keys(stats.overview.typeDistribution).sort()]
    : ['all'];

  const spotlightMonsters = useMemo(() => {
    if (!stats) return [];

    // Backend already returns only level 100 monsters in topMonsters
    let filtered = stats.topMonsters;

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m =>
        m.types.some(t => t.toLowerCase() === typeFilter.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let diff = 0;
      switch (spotlightSort) {
        case 'name': diff = a.name.localeCompare(b.name); break;
        case 'hp': diff = a.stats.hp - b.stats.hp; break;
        case 'attack': diff = a.stats.attack - b.stats.attack; break;
        case 'defense': diff = a.stats.defense - b.stats.defense; break;
        case 'spAttack': diff = a.stats.spAttack - b.stats.spAttack; break;
        case 'spDefense': diff = a.stats.spDefense - b.stats.spDefense; break;
        case 'speed': diff = a.stats.speed - b.stats.speed; break;
        case 'total': {
          const totalA = a.stats.hp + a.stats.attack + a.stats.defense + a.stats.spAttack + a.stats.spDefense + a.stats.speed;
          const totalB = b.stats.hp + b.stats.attack + b.stats.defense + b.stats.spAttack + b.stats.spDefense + b.stats.speed;
          diff = totalA - totalB;
          break;
        }
      }
      return spotlightOrder === 'desc' ? -diff : diff;
    });

    return sorted;
  }, [stats, typeFilter, spotlightSort, spotlightOrder]);

  const totalPages = Math.max(1, Math.ceil(spotlightMonsters.length / PAGE_SIZE));
  const paginatedMonsters = spotlightMonsters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSpotlightSort = (field: SpotlightSort) => {
    if (spotlightSort === field) {
      setSpotlightOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSpotlightSort(field);
      setSpotlightOrder('desc');
    }
    setPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  return (
    <AutoStateContainer
      loading={loading && !stats}
      error={error}
      onRetry={fetchStats}
      loadingMessage="Loading monster statistics..."
    >
      {stats && (
        <div className="stats-tab">
          {/* Overview Cards */}
          <section className="stats-section">
            <h3 className="stats-section__title">
              <i className="fas fa-chart-pie" />
              Monster Collection Overview
            </h3>
            <div className="stats-overview-grid">
              <OverviewCard icon="fas fa-dragon" value={stats.overview.totalMonsters} label="Total Monsters" />
              <OverviewCard icon="fas fa-dna" value={stats.overview.uniqueSpecies} label="Unique Species" />
              <OverviewCard icon="fas fa-chart-line" value={stats.overview.averageLevel} label="Average Level" />
              <OverviewCard icon="fas fa-bolt" value={stats.overview.highestLevel} label="Highest Level" />
            </div>
          </section>

          {/* Type Distribution */}
          {Object.keys(stats.overview.typeDistribution).length > 0 && (
            <section className="stats-section">
              <h3 className="stats-section__title">
                <i className="fas fa-th-large" />
                Type Distribution
              </h3>
              <div className="type-distribution-grid">
                {Object.entries(stats.overview.typeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const pct = Math.round((count / (stats.overview.totalMonsters || 1)) * 100);
                    return (
                      <div className="type-distribution-card" key={type}>
                        <div className="type-distribution-info">
                          <span className={`badge type-${type.toLowerCase()}`}>{type}</span>
                          <span className="type-distribution-count">{count}</span>
                        </div>
                        <div className="type-distribution-bar">
                          <div
                            className={`type-distribution-fill type-${type.toLowerCase()}-bg`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="type-distribution-percent">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Top Monster Spotlight */}
          <section className="stats-section">
            <div className="stats-section__header">
              <h3 className="stats-section__title">
                <i className="fas fa-crown" />
                Top Monster Spotlight
              </h3>
              <div className="stats-filters">
                <div className="stats-filter-group">
                  <label>Type:</label>
                  <select
                    className="stats-select"
                    value={typeFilter}
                    onChange={(e) => handleTypeFilter(e.target.value)}
                  >
                    {allTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="stats-filter-group">
                  <label>Sort:</label>
                  <select
                    className="stats-select"
                    value={spotlightSort}
                    onChange={(e) => handleSpotlightSort(e.target.value as SpotlightSort)}
                  >
                    <option value="total">Total Stats</option>
                    <option value="hp">HP</option>
                    <option value="attack">Attack</option>
                    <option value="defense">Defense</option>
                    <option value="spAttack">Sp. Attack</option>
                    <option value="spDefense">Sp. Defense</option>
                    <option value="speed">Speed</option>
                    <option value="name">Name</option>
                  </select>
                  <button
                    className="stats-sort-toggle"
                    onClick={() => setSpotlightOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    title={spotlightOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    <i className={`fas fa-sort-${spotlightOrder === 'asc' ? 'up' : 'down'}`} />
                  </button>
                </div>
              </div>
            </div>

            {spotlightMonsters.length === 0 ? (
              <p className="stats-empty-message">No level 100 monsters match the current filter.</p>
            ) : (
              <>
                <p className="stats-result-count">{spotlightMonsters.length} level 100 monster{spotlightMonsters.length !== 1 ? 's' : ''}</p>
                <div className="top-monsters-grid">
                  {paginatedMonsters.map((monster) => (
                    <SpotlightCard key={monster.id} monster={monster} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="stats-pagination">
                    <button
                      className="stats-pagination__btn"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <i className="fas fa-chevron-left" /> Previous
                    </button>
                    <span className="stats-pagination__info">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="stats-pagination__btn"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next <i className="fas fa-chevron-right" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </AutoStateContainer>
  );
};

// --- Helper Components ---

function SpotlightCard({ monster }: { monster: MonsterSummary }) {
  const total = monster.stats.hp + monster.stats.attack + monster.stats.defense +
    monster.stats.spAttack + monster.stats.spDefense + monster.stats.speed;

  return (
    <div className="top-monster-card">
      <div className="top-monster-avatar">
        <img
          src={monster.imagePath}
          alt={monster.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/default_mon.png';
          }}
        />
      </div>
      <div className="top-monster-details">
        <h4 className="top-monster-name">{monster.name}</h4>
        <div className="top-monster-meta">
          <span className="level-badge">Lv. {monster.level}</span>
          <span className="total-stats-badge">BST: {total}</span>
          <div className="top-monster-types">
            {monster.types.map((type, i) => (
              <span className={`badge sm type-${type.toLowerCase()}`} key={i}>{type}</span>
            ))}
          </div>
        </div>
        <div className="monster-stats-bars">
          <StatBar label="HP" value={monster.stats.hp} className="hp" />
          <StatBar label="ATK" value={monster.stats.attack} className="attack" />
          <StatBar label="DEF" value={monster.stats.defense} className="defense" />
          <StatBar label="SP.A" value={monster.stats.spAttack} className="special-attack" />
          <StatBar label="SP.D" value={monster.stats.spDefense} className="special-defense" />
          <StatBar label="SPD" value={monster.stats.speed} className="speed" />
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="stats-overview-card">
      <div className="stats-overview-icon">
        <i className={icon} />
      </div>
      <div className="stats-overview-content">
        <span className="stats-overview-value">{value.toLocaleString()}</span>
        <span className="stats-overview-label">{label}</span>
      </div>
    </div>
  );
}

function StatBar({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="stats-page-stat-row">
      <span className="stats-page-stat-label">{label}</span>
      <div className="monster-stat-bar">
        <div className={`monster-stat-fill ${className}`} style={{ width: `${Math.min((value / 150) * 100, 100)}%` }} />
      </div>
      <span className="stats-page-stat-value">{value}</span>
    </div>
  );
}

export default MonsterStatsTab;
