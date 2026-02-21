import { useState, useEffect, useCallback } from 'react';
import { AutoStateContainer } from '@components/common';
import statisticsService from '@services/statisticsService';
import type {
  PlayerLeaderboardResponse,
  PlayerLeaderboardEntry,
  PlayerSpecialistEntry,
} from '@services/statisticsService';

const PlayerLeaderboardTab = () => {
  const [stats, setStats] = useState<PlayerLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getPlayerLeaderboardStats();
      setStats(data);
    } catch {
      setError('Failed to load player leaderboard statistics.');
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
      loadingMessage="Loading player leaderboard..."
    >
      {stats && (
        <div className="stats-tab">
          {/* Most/Least Monsters */}
          <PlayerRankingSection
            title="Most Monsters"
            icon="fa-dragon"
            data={stats.mostMonsters}
            valueKey="totalMonsters"
            valueLabel="Monsters"
          />
          <PlayerRankingSection
            title="Least Monsters"
            icon="fa-dragon"
            data={stats.leastMonsters}
            valueKey="totalMonsters"
            valueLabel="Monsters"
            inverted
          />

          {/* Most/Least References */}
          <PlayerRankingSection
            title="Most References"
            icon="fa-image"
            data={stats.mostRefs}
            valueKey="totalRefs"
            valueLabel="Refs"
          />
          <PlayerRankingSection
            title="Least References"
            icon="fa-image"
            data={stats.leastRefs}
            valueKey="totalRefs"
            valueLabel="Refs"
            inverted
          />

          {/* Most/Least Ref % */}
          <PlayerRankingSection
            title="Highest Reference %"
            icon="fa-percentage"
            data={stats.mostRefPercent}
            valueKey="refPercent"
            valueLabel=""
            isPercent
          />
          <PlayerRankingSection
            title="Lowest Reference %"
            icon="fa-percentage"
            data={stats.leastRefPercent}
            valueKey="refPercent"
            valueLabel=""
            isPercent
            inverted
          />

          {/* Most/Least Currency */}
          <PlayerRankingSection
            title="Most Currency"
            icon="fa-coins"
            data={stats.mostCurrency}
            valueKey="totalCurrency"
            valueLabel="Coins"
          />
          <PlayerRankingSection
            title="Least Currency"
            icon="fa-coins"
            data={stats.leastCurrency}
            valueKey="totalCurrency"
            valueLabel="Coins"
            inverted
          />

          {/* Type Specialists */}
          <PlayerSpecialistsSection
            title="Type Specialists"
            specialists={stats.typeSpecialists}
            badgeClass="type"
            label="monsters"
          />

          {/* Attribute Specialists */}
          <PlayerSpecialistsSection
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
              <div className="player-ranking-list">
                {stats.speciesSpecialists.map((entry, index) => (
                  <div className="player-ranking-row" key={`${entry.playerName}-${entry.species}`}>
                    <div className="player-ranking-row__rank">#{index + 1}</div>
                    <div className="player-ranking-row__info">
                      <span className="player-ranking-row__name">{entry.playerName}</span>
                      <span className="player-ranking-row__detail">{entry.count} {entry.species}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AutoStateContainer>
  );
};

// --- Sub-Components ---

function PlayerRankingSection({
  title,
  icon,
  data,
  valueKey,
  valueLabel,
  isPercent = false,
  inverted = false,
}: {
  title: string;
  icon: string;
  data: PlayerLeaderboardEntry[];
  valueKey: keyof PlayerLeaderboardEntry;
  valueLabel: string;
  isPercent?: boolean;
  inverted?: boolean;
}) {
  if (!data || data.length === 0) return null;

  const formatValue = (entry: PlayerLeaderboardEntry) => {
    if (isPercent) {
      return `${entry.refPercent}% (${entry.totalRefs}/${entry.totalMonsters})`;
    }
    const val = entry[valueKey];
    return valueLabel ? `${(val as number).toLocaleString()} ${valueLabel}` : String(val);
  };

  // For "most" lists, show podium. For "least" show flat list.
  if (inverted) {
    return (
      <section className="stats-section">
        <h3 className="stats-section__title">
          <i className={`fas ${icon}`} />
          {title}
        </h3>
        <div className="player-ranking-list">
          {data.map((entry, index) => (
            <div className="player-ranking-row" key={entry.playerUserId}>
              <div className="player-ranking-row__rank">#{index + 1}</div>
              <div className="player-ranking-row__info">
                <span className="player-ranking-row__name">{entry.playerName}</span>
                <span className="player-ranking-row__detail">
                  {entry.trainerCount} trainer{entry.trainerCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="player-ranking-row__value">{formatValue(entry)}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Podium display for top rankings
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
                key={entry.playerUserId}
                className={`podium-card ${isFirst ? 'first-place ' : ''}position-${actualPosition + 1}`}
                style={{ order: displayIndex }}
              >
                <div className={`podium-rank rank-${actualPosition + 1}`}>
                  #{actualPosition + 1}
                </div>
                <div className="podium-image">
                  <i className={`fas fa-user trainer-icon`} />
                </div>
                <div className="podium-info">
                  <h4 className="podium-name">{entry.playerName}</h4>
                  <div className="podium-details">
                    <span className="podium-value">{formatValue(entry)}</span>
                    <span className="podium-player">
                      {entry.trainerCount} trainer{entry.trainerCount !== 1 ? 's' : ''}
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
              <div className="remaining-card" key={entry.playerUserId}>
                <div className="remaining-rank">#{index + 4}</div>
                <div className="remaining-avatar">
                  <i className="fas fa-user trainer-icon" />
                </div>
                <div className="remaining-info">
                  <h4 className="remaining-name">{entry.playerName}</h4>
                  <div className="remaining-details">
                    <span className="remaining-value">{formatValue(entry)}</span>
                    <span className="remaining-player">
                      {entry.trainerCount} trainer{entry.trainerCount !== 1 ? 's' : ''}
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

function PlayerSpecialistsSection({
  title,
  specialists,
  badgeClass,
  label,
}: {
  title: string;
  specialists: Record<string, PlayerSpecialistEntry>;
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
            <div className="specialist-card__info">
              <h4>{specialist.playerName}</h4>
              <span className="specialist-card__count">
                {specialist.count} {key} {label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PlayerLeaderboardTab;
