import { useState, useEffect, useCallback } from 'react';
import { AutoStateContainer, TabContainer } from '@components/common';
import type { Tab } from '@components/common';
import statisticsService from '@services/statisticsService';
import type {
  AchievementStatsResponse,
  AchievementTrainerEntry,
  AchievementCategoryEntry,
} from '@services/statisticsService';

const AchievementStatsTab = () => {
  const [stats, setStats] = useState<AchievementStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getAchievementStats();
      setStats(data);
    } catch {
      setError('Failed to load achievement statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const subTabs: Tab[] = stats ? [
    { key: 'overview', label: 'Overview', icon: 'fas fa-chart-pie', content: <OverviewSubTab stats={stats} /> },
    { key: 'leaderboards', label: 'Leaderboards', icon: 'fas fa-trophy', content: <LeaderboardsSubTab stats={stats} /> },
    { key: 'categories', label: 'Categories', icon: 'fas fa-tags', content: <CategoriesSubTab stats={stats} /> },
    { key: 'subtypes', label: 'Subtypes', icon: 'fas fa-list', content: <SubtypesSubTab stats={stats} /> },
  ] : [];

  return (
    <AutoStateContainer
      loading={loading}
      error={error}
      onRetry={fetchStats}
      loadingMessage="Loading achievement statistics..."
    >
      {stats && (
        <div className="stats-tab">
          <TabContainer tabs={subTabs} variant="underline" />
        </div>
      )}
    </AutoStateContainer>
  );
};

// --- Overview ---

function OverviewSubTab({ stats }: { stats: AchievementStatsResponse }) {
  return (
    <div>
      <div className="stats-overview-grid">
        <OverviewCard icon="fas fa-trophy" value={stats.overview.totalAchievementsAvailable} label="Total Available" />
        <OverviewCard icon="fas fa-check-circle" value={stats.overview.totalAchievementsClaimed} label="Total Claimed" />
        <OverviewCard icon="fas fa-users" value={stats.overview.trainersWithAchievements} label={`Active Achievers (of ${stats.overview.totalTrainers})`} />
        <OverviewCard icon="fas fa-chart-line" value={stats.overview.averageAchievementsPerTrainer} label="Avg per Trainer" />
      </div>

      <section className="stats-section">
        <h3 className="stats-section__title">
          <i className="fas fa-tags" />
          Achievement Categories
        </h3>
        <div className="category-breakdown-grid">
          <CategoryItem label="Type Achievements" count={stats.categoryBreakdown.type} />
          <CategoryItem label="Attribute Achievements" count={stats.categoryBreakdown.attribute} />
          <CategoryItem label="Level 100 Achievements" count={stats.categoryBreakdown.level100} />
          <CategoryItem label="Trainer Level Achievements" count={stats.categoryBreakdown.trainerLevel} />
          <CategoryItem label="Special Achievements" count={stats.categoryBreakdown.special} />
        </div>
      </section>
    </div>
  );
}

// --- Leaderboards ---

function LeaderboardsSubTab({ stats }: { stats: AchievementStatsResponse }) {
  return (
    <div>
      <section className="stats-section">
        <h3 className="stats-section__title">
          <i className="fas fa-crown" />
          Most Achievements
        </h3>
        <AchievementPodium entries={stats.mostAchievements} />
      </section>

      <section className="stats-section">
        <h3 className="stats-section__title">
          <i className="fas fa-seedling" />
          Least Achievements (Room to Grow!)
        </h3>
        <div className="player-ranking-list">
          {stats.leastAchievements.slice(0, 10).map((trainer, index) => (
            <AchievementRow key={trainer.trainerId} trainer={trainer} rank={index + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}

// --- Categories ---

function CategoriesSubTab({ stats }: { stats: AchievementStatsResponse }) {
  const categoryLabels: Record<string, string> = {
    type: 'Type',
    attribute: 'Attribute',
    level100: 'Level 100',
    trainerLevel: 'Trainer Level',
    special: 'Special',
  };

  return (
    <div>
      {Object.entries(stats.topByCategory).map(([category, trainers]) => (
        <section className="stats-section" key={category}>
          <h3 className="stats-section__title">
            <i className="fas fa-medal" />
            Top {categoryLabels[category] || category} Achievers
          </h3>
          <div className="player-ranking-list">
            {(trainers as AchievementCategoryEntry[]).slice(0, 5).map((trainer, index) => (
              <div className="player-ranking-row" key={trainer.trainerId}>
                <div className="player-ranking-row__rank">#{index + 1}</div>
                <div className="player-ranking-row__avatar-section">
                  {trainer.mainRef && (
                    <img
                      className="player-ranking-row__avatar"
                      src={trainer.mainRef}
                      alt={trainer.trainerName}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
                <div className="player-ranking-row__info">
                  <span className="player-ranking-row__name">{trainer.trainerName}</span>
                  <span className="player-ranking-row__detail">Player: {trainer.playerDisplayName}</span>
                </div>
                <div className="player-ranking-row__value">{trainer.count} achievements</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// --- Subtypes ---

function SubtypesSubTab({ stats }: { stats: AchievementStatsResponse }) {
  return (
    <div>
      <section className="stats-section">
        <h3 className="stats-section__title">
          <i className="fas fa-dragon" />
          Top Type Specialists
        </h3>
        <div className="subtype-grid">
          {Object.entries(stats.topBySubtype.types).map(([type, trainers]) => (
            <div key={type} className={`subtype-card sub-type-${type.toLowerCase()}`}>
              <h5>{type} Type</h5>
              <div className="subtype-entries">
                {trainers.slice(0, 3).map((trainer, index) => (
                  <div key={trainer.trainerId} className="subtype-entry">
                    <span className="subtype-entry__rank">#{index + 1}</span>
                    <span className="subtype-entry__name">{trainer.trainerName}</span>
                    <span className="subtype-entry__count">{trainer.count}</span>
                  </div>
                ))}
                {trainers.length === 0 && (
                  <div className="subtype-entry subtype-entry--empty">No achievements yet</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-section">
        <h3 className="stats-section__title">
          <i className="fas fa-shield-alt" />
          Top Attribute Specialists
        </h3>
        <div className="subtype-grid">
          {Object.entries(stats.topBySubtype.attributes).map(([attribute, trainers]) => (
            <div key={attribute} className={`subtype-card sub-attribute-${attribute.toLowerCase()}`}>
              <h5>{attribute} Attribute</h5>
              <div className="subtype-entries">
                {trainers.slice(0, 3).map((trainer, index) => (
                  <div key={trainer.trainerId} className="subtype-entry">
                    <span className="subtype-entry__rank">#{index + 1}</span>
                    <span className="subtype-entry__name">{trainer.trainerName}</span>
                    <span className="subtype-entry__count">{trainer.count}</span>
                  </div>
                ))}
                {trainers.length === 0 && (
                  <div className="subtype-entry subtype-entry--empty">No achievements yet</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --- Shared Components ---

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

function CategoryItem({ label, count }: { label: string; count: number }) {
  return (
    <div className="category-breakdown-item">
      <span className="category-breakdown-item__label">{label}</span>
      <span className="category-breakdown-item__count">{count}</span>
    </div>
  );
}

function AchievementPodium({ entries }: { entries: AchievementTrainerEntry[] }) {
  if (entries.length === 0) return null;

  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean);
  const remaining = entries.slice(3, 10);

  return (
    <div className="leaderboard-podium">
      <div className="podium-positions">
        {podiumOrder.map((entry, displayIndex) => {
          const positions = [1, 0, 2];
          const actualPosition = positions[displayIndex];
          const isFirst = actualPosition === 0;

          return (
            <div
              key={entry.trainerId}
              className={`podium-card ${isFirst ? 'first-place ' : ''}position-${actualPosition + 1}`}
              style={{ order: displayIndex }}
            >
              <div className={`podium-rank rank-${actualPosition + 1}`}>
                #{actualPosition + 1}
              </div>
              <div className="podium-image">
                {entry.mainRef ? (
                  <img
                    src={entry.mainRef}
                    alt={entry.trainerName}
                    className="trainer-avatar-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                      if (next) next.style.display = 'flex';
                    }}
                  />
                ) : null}
                <i className="fas fa-trophy trainer-icon" style={entry.mainRef ? { display: 'none' } : {}} />
              </div>
              <div className="podium-info">
                <h4 className="podium-name">{entry.trainerName}</h4>
                <div className="podium-details">
                  <span className="podium-value">{entry.count} achievements</span>
                  <span className="podium-player">
                    <i className="fas fa-user" /> {entry.playerDisplayName}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {remaining.length > 0 && (
        <div className="remaining-positions">
          {remaining.map((entry, index) => (
            <AchievementRow key={entry.trainerId} trainer={entry} rank={index + 4} />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementRow({ trainer, rank }: { trainer: AchievementTrainerEntry; rank: number }) {
  return (
    <div className="player-ranking-row">
      <div className="player-ranking-row__rank">#{rank}</div>
      <div className="player-ranking-row__avatar-section">
        {trainer.mainRef && (
          <img
            className="player-ranking-row__avatar"
            src={trainer.mainRef}
            alt={trainer.trainerName}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>
      <div className="player-ranking-row__info">
        <span className="player-ranking-row__name">{trainer.trainerName}</span>
        <span className="player-ranking-row__detail">Player: {trainer.playerDisplayName}</span>
      </div>
      <div className="player-ranking-row__value">{trainer.count} achievements</div>
    </div>
  );
}

export default AchievementStatsTab;
