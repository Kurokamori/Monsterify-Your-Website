import type { MissionRewardSummary as Summary, UserMission } from './types';

interface MissionRewardSummaryProps {
  mission: UserMission;
  variant: 'needs-attention' | 'view-only';
  onClaim?: () => void;
  claiming?: boolean;
}

export const MissionRewardSummary = ({ mission, variant, onClaim, claiming }: MissionRewardSummaryProps) => {
  const summary = mission.rewardSummary;
  const isUnclaimed = variant === 'needs-attention';
  const className = `mission-reward-summary ${isUnclaimed ? 'mission-reward-summary--unclaimed' : 'mission-reward-summary--claimed'}`;

  return (
    <div className={className}>
      <div className="mission-reward-summary__header">
        <div className="mission-reward-summary__title-row">
          <h3 className="mission-reward-summary__title">
            <i className={isUnclaimed ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'}></i>
            {' '}{mission.title}
          </h3>
          <span className={`badge badge--status badge--status-${isUnclaimed ? 'completed' : 'claimed'}`}>
            {isUnclaimed ? 'Rewards Available' : 'Rewards Claimed'}
          </span>
        </div>
        {mission.description && (
          <p className="mission-reward-summary__description">{mission.description}</p>
        )}
      </div>

      <div className="mission-reward-summary__body">
        {/* If we have a saved summary, show the breakdown */}
        {summary && <RewardBreakdown summary={summary} />}

        {/* If unclaimed and no summary yet, show basic info */}
        {!summary && isUnclaimed && (
          <p className="mission-reward-summary__pending">
            <i className="fas fa-gift"></i> Claim your rewards to see what you earned!
          </p>
        )}
      </div>

      {isUnclaimed && onClaim && (
        <div className="mission-reward-summary__footer">
          <button
            className="button primary"
            onClick={onClaim}
            disabled={claiming}
          >
            {claiming ? (
              <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
            ) : (
              <><i className="fas fa-trophy"></i> Claim Rewards</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const RewardBreakdown = ({ summary }: { summary: Summary }) => (
  <div className="mission-reward-summary__sections">
    {/* Levels Section */}
    {summary.totalLevels > 0 && (
      <div className="mission-reward-summary__section">
        <h4 className="mission-reward-summary__section-title">
          <i className="fas fa-arrow-up"></i> Levels ({summary.totalLevels} total)
        </h4>
        {summary.monsters.length > 0 && (
          <ul className="mission-reward-summary__list">
            {summary.monsters.map((m) => (
              <li key={m.monsterId} className="mission-reward-summary__list-item">
                <span className="mission-reward-summary__item-name">{m.name}</span>
                <span className="mission-reward-summary__item-value">
                  +{m.levelsGained} levels (Lv. {m.newLevel})
                  {m.capped && <span className="badge badge--status badge--status-warning"> Capped</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}

    {/* Reallocations */}
    {summary.reallocations.length > 0 && (
      <div className="mission-reward-summary__section">
        <h4 className="mission-reward-summary__section-title">
          <i className="fas fa-exchange-alt"></i> Redistributed Levels
        </h4>
        <ul className="mission-reward-summary__list">
          {summary.reallocations.map((r, i) => (
            <li key={i} className="mission-reward-summary__list-item">
              <span className="mission-reward-summary__item-name">
                {r.targetName} ({r.targetType})
              </span>
              <span className="mission-reward-summary__item-value">+{r.levels} levels</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Coins Section */}
    {summary.totalCoins > 0 && (
      <div className="mission-reward-summary__section">
        <h4 className="mission-reward-summary__section-title">
          <i className="fas fa-coins"></i> Coins ({summary.totalCoins} total)
        </h4>
        {summary.trainers.length > 0 && (
          <ul className="mission-reward-summary__list">
            {summary.trainers.map((t) => (
              <li key={t.trainerId} className="mission-reward-summary__list-item">
                <span className="mission-reward-summary__item-name">{t.name}</span>
                <span className="mission-reward-summary__item-value">+{t.coinsGained} coins</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}

    {/* Items Section */}
    {summary.items.length > 0 && (
      <div className="mission-reward-summary__section">
        <h4 className="mission-reward-summary__section-title">
          <i className="fas fa-box-open"></i> Items
        </h4>
        <ul className="mission-reward-summary__list">
          {summary.items.map((item, i) => (
            <li key={i} className="mission-reward-summary__list-item">
              <span className="mission-reward-summary__item-name">
                {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.itemName}
              </span>
              <span className="mission-reward-summary__item-value">
                {item.trainerName && <><i className="fas fa-user"></i> {item.trainerName}</>}
                {item.category && !item.trainerName && (
                  <span className="mission-reward-summary__item-category">{item.category}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);
