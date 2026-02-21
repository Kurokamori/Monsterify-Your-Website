import { useState, useEffect, useCallback } from 'react';
import { AutoStateContainer } from '@components/common';
import statisticsService from '@services/statisticsService';
import type {
  LeaderboardStatsResponse,
  GlobalStats,
  TrainerLeaderboardEntry,
  SpecialistEntry,
  SpeciesSpecialistEntry,
} from '@services/statisticsService';

const TrainerLeaderboardTab = () => {
  const [stats, setStats] = useState<LeaderboardStatsResponse | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [leaderboard, comparison] = await Promise.all([
        statisticsService.getLeaderboardStats(),
        statisticsService.getTrainerComparison(),
      ]);
      setStats(leaderboard);
      setGlobalStats(comparison.globalStats);
    } catch {
      setError('Failed to load leaderboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <AutoStateContainer
      loading={loading}
      error={error}
      onRetry={fetchStats}
      loadingMessage="Loading leaderboard statistics..."
    >
      {stats && (
        <div className="stats-tab">
          {/* Global Stats */}
          {globalStats && (
            <section className="stats-section">
              <h3 className="stats-section__title">
                <i className="fas fa-globe" />
                Global Statistics
              </h3>
              <div className="stats-overview-grid stats-overview-grid--5">
                <GlobalStatCard icon="fas fa-users" value={globalStats.totalTrainers} label="Total Trainers" />
                <GlobalStatCard icon="fas fa-dragon" value={globalStats.totalMonsters} label="Total Monsters" />
                <GlobalStatCard icon="fas fa-user-friends" value={globalStats.totalPlayers} label="Total Players" />
                <GlobalStatCard icon="fas fa-chart-line" value={globalStats.averageMonstersPerTrainer} label="Avg Monsters/Trainer" />
                <GlobalStatCard icon="fas fa-percentage" value={`${globalStats.averageReferencePercentage}%`} label="Avg Reference %" />
              </div>
            </section>
          )}

          {/* Podium Leaderboards */}
          <PodiumSection title="Top Trainers by Level" data={stats.topTrainersByLevel} valueKey="level" valueLabel="Level" icon="fa-star" />
          <PodiumSection title="Bottom Trainers by Level" data={stats.bottomTrainersByLevel} valueKey="level" valueLabel="Level" icon="fa-star" />
          <PodiumSection title="Top Trainers by Monster Count" data={stats.topTrainersByMonsterCount} valueKey="monsterCount" valueLabel="Monsters:" icon="fa-dragon" />
          <PodiumSection title="Bottom Trainers by Monster Count" data={stats.bottomTrainersByMonsterCount} valueKey="monsterCount" valueLabel="Monsters:" icon="fa-dragon" />
          <PodiumSection title="Top Trainers by Reference %" data={stats.topTrainersByRefPercent} valueKey="monsterRefPercent" valueLabel="" icon="fa-image" isPercent />
          <PodiumSection title="Bottom Trainers by Reference %" data={stats.bottomTrainersByRefPercent} valueKey="monsterRefPercent" valueLabel="" icon="fa-image" isPercent />
          <PodiumSection title="Top Trainers by Current Currency" data={stats.topTrainersByCurrency} valueKey="currencyAmount" valueLabel="Coins:" icon="fa-coins" />
          <PodiumSection title="Bottom Trainers by Current Currency" data={stats.bottomTrainersByCurrency} valueKey="currencyAmount" valueLabel="Coins:" icon="fa-coins" />
          <PodiumSection title="Top Trainers by Total Earned Currency" data={stats.topTrainersByTotalCurrency} valueKey="totalEarnedCurrency" valueLabel="Earned:" icon="fa-money-bill-wave" />
          <PodiumSection title="Bottom Trainers by Total Earned Currency" data={stats.bottomTrainersByTotalCurrency} valueKey="totalEarnedCurrency" valueLabel="Earned:" icon="fa-money-bill-wave" />
          <PodiumSection title="Top Trainers by Total Monster Levels" data={stats.topTrainersByTotalLevel} valueKey="totalMonsterLevels" valueLabel="Total Levels:" icon="fa-chart-line" />
          <PodiumSection title="Top Trainers by Level 100 Monsters" data={stats.topTrainersByLevel100Count} valueKey="level100Count" valueLabel="Lv.100:" icon="fa-trophy" />

          {/* Type Specialists */}
          <SpecialistsSection
            title="Type Specialists"
            specialists={stats.typeSpecialists}
            badgeClass="type"
            label="monsters"
          />

          {/* Attribute Specialists */}
          <SpecialistsSection
            title="Attribute Specialists"
            specialists={stats.attributeSpecialists}
            badgeClass="attribute"
            label="monsters"
          />

          {/* Species Specialists */}
          {stats.speciesSpecialists.length > 0 && (
            <section className="stats-section">
              <h3 className="stats-section__title">
                <i className="fas fa-paw" />
                Species Specialists
              </h3>
              <div className="species-specialists-list">
                {stats.speciesSpecialists.map((specialist, index) => (
                  <SpeciesSpecialistCard key={`${specialist.trainerName}-${specialist.species}`} specialist={specialist} rank={index + 1} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AutoStateContainer>
  );
};

// --- Reusable Sub-Components ---

function GlobalStatCard({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div className="stats-overview-card">
      <div className="stats-overview-icon">
        <i className={icon} />
      </div>
      <div className="stats-overview-content">
        <span className="stats-overview-value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        <span className="stats-overview-label">{label}</span>
      </div>
    </div>
  );
}

function PodiumSection({
  title,
  data,
  valueKey,
  valueLabel,
  icon,
  isPercent = false,
}: {
  title: string;
  data: TrainerLeaderboardEntry[];
  valueKey: keyof TrainerLeaderboardEntry;
  valueLabel: string;
  icon: string;
  isPercent?: boolean;
}) {
  if (!data || data.length === 0) return null;

  const formatValue = (entry: TrainerLeaderboardEntry) => {
    const val = entry[valueKey];
    if (isPercent) {
      return `${val}% (${entry.monsterRefCount}/${entry.monsterCount})`;
    }
    return valueLabel ? `${valueLabel} ${val}` : String(val);
  };

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [data[1], data[0], data[2]].filter(Boolean);
  const remaining = data.slice(3, 5);

  return (
    <section className="stats-section">
      <h3 className="stats-section__title">
        <i className={`fas ${icon}`} />
        {title}
      </h3>
      <div className="leaderboard-podium">
        <div className="podium-positions">
          {podiumOrder.map((entry, displayIndex) => {
            const positions = [1, 0, 2];
            const actualPosition = positions[displayIndex];
            const isFirst = actualPosition === 0;

            return (
              <div
                key={entry.id}
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
                      alt={entry.name}
                      className="trainer-avatar-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (next) next.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <i className={`fas ${icon} trainer-icon`} style={entry.mainRef ? { display: 'none' } : {}} />
                </div>
                <div className="podium-info">
                  <h4 className="podium-name">{entry.name}</h4>
                  <div className="podium-details">
                    <span className="podium-value">{formatValue(entry)}</span>
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
              <div className="remaining-card" key={entry.id}>
                <div className="remaining-rank">#{index + 4}</div>
                <div className="remaining-avatar">
                  {entry.mainRef ? (
                    <img
                      src={entry.mainRef}
                      alt={entry.name}
                      className="trainer-avatar-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (next) next.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <i className={`fas ${icon} trainer-icon`} style={entry.mainRef ? { display: 'none' } : {}} />
                </div>
                <div className="remaining-info">
                  <h4 className="remaining-name">{entry.name}</h4>
                  <div className="remaining-details">
                    <span className="remaining-value">{formatValue(entry)}</span>
                    <span className="remaining-player">
                      <i className="fas fa-user" /> {entry.playerDisplayName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SpecialistsSection({
  title,
  specialists,
  badgeClass,
  label,
}: {
  title: string;
  specialists: Record<string, SpecialistEntry>;
  badgeClass: string;
  label: string;
}) {
  const entries = Object.entries(specialists);
  if (entries.length === 0) return null;

  return (
    <section className="stats-section">
      <h3 className="stats-section__title">
        <i className={`fas ${badgeClass === 'type' ? 'fa-fire' : 'fa-shield-alt'}`} />
        {title}
      </h3>
      <div className="specialists-grid">
        {entries.map(([key, specialist]) => (
          <div className="specialist-card" key={key}>
            <div className="specialist-card__header">
              <span className={`badge ${badgeClass}-${key.toLowerCase()}`}>{key}</span>
            </div>
            {specialist.mainRef && (
              <div className="specialist-card__avatar">
                <img
                  src={specialist.mainRef}
                  alt={specialist.trainerName}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div className="specialist-card__info">
              <h4>{specialist.trainerName}</h4>
              <span className="specialist-card__count">
                {specialist.count} {key} {label}
              </span>
              <span className="specialist-card__player">
                Player: {specialist.playerDisplayName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SpeciesSpecialistCard({ specialist, rank }: { specialist: SpeciesSpecialistEntry; rank: number }) {
  return (
    <div className="species-specialist-row">
      <div className="species-specialist-row__rank">#{rank}</div>
      {specialist.mainRef && (
        <div className="species-specialist-row__avatar">
          <img
            src={specialist.mainRef}
            alt={specialist.trainerName}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      <div className="species-specialist-row__info">
        <h4>{specialist.trainerName}</h4>
        <span className="species-specialist-row__species">
          {specialist.count} {specialist.species}
        </span>
        <span className="species-specialist-row__player">
          Player: {specialist.playerDisplayName}
        </span>
      </div>
      <div className="species-specialist-row__samples">
        {specialist.sampleMonsters.slice(0, 3).map(mon => (
          <div className="species-sample-monster" key={mon.id}>
            <img
              src={mon.imgLink || '/images/default_mon.png'}
              alt={mon.name}
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/default_mon.png'; }}
            />
            <span>{mon.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrainerLeaderboardTab;
