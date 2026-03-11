import { TypeBadge } from '../../../components/common/TypeBadge';
import { AttributeBadge } from '../../../components/common/AttributeBadge';
import { BadgeGroup } from '../../../components/common/BadgeGroup';
import type { Mission, MissionRequirements, MissionRewardConfig, MissionItemRewardEntry } from './types';
import { getDifficultyConfig, parseJson } from './types';

// ── Helpers ────────────────────────────────────────────────────────────────

const formatAmount = (val: number | { min: number; max: number } | undefined): string | null => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return val > 0 ? String(val) : null;
  if (val.min === 0 && val.max === 0) return null;
  return val.min === val.max ? String(val.min) : `${val.min}-${val.max}`;
};

const getItemLabel = (entry: MissionItemRewardEntry): string => {
  if (entry.itemName) return entry.itemName;
  if (entry.category) return `Random ${entry.category}`;
  if (entry.itemPool && entry.itemPool.length > 0) return 'Random item';
  return 'Item';
};

// ── Shared sub-components ──────────────────────────────────────────────────

export const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const config = getDifficultyConfig(difficulty);
  return (
    <span className="mission-card__difficulty" style={{ backgroundColor: config.color }}>
      <i className={config.icon}></i> {config.label}
    </span>
  );
};

export const RewardsList = ({ rewardConfig }: { rewardConfig: MissionRewardConfig | null }) => {
  if (!rewardConfig) return null;

  const levelsStr = formatAmount(rewardConfig.levels);
  const coinsStr = formatAmount(rewardConfig.coins);
  const items = rewardConfig.items ?? [];
  const hasRewards = levelsStr || coinsStr || items.length > 0;

  if (!hasRewards) return null;

  return (
    <div className="mission-card__rewards">
      <h4 className="mission-card__section-title">
        <i className="fas fa-gift"></i> Potential Rewards
      </h4>
      <div className="mission-card__reward-grid">
        {levelsStr && (
          <div className="mission-card__reward-item">
            <i className="fas fa-arrow-up"></i>
            <span>{levelsStr} Levels</span>
          </div>
        )}
        {coinsStr && (
          <div className="mission-card__reward-item">
            <i className="fas fa-coins"></i>
            <span>{coinsStr} Coins</span>
          </div>
        )}
        {items.map((entry, i) => {
          const label = getItemLabel(entry);
          const qty = entry.quantity && entry.quantity > 1 ? `${entry.quantity}x ` : '';
          const chance = entry.chance !== undefined && entry.chance < 100;
          return (
            <div key={i} className="mission-card__reward-item">
              <i className="fas fa-box-open"></i>
              <span>{qty}{label}</span>
              {chance && (
                <span className="mission-card__reward-chance">{entry.chance}%</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RequirementsList = ({ requirements }: { requirements: MissionRequirements | null }) => {
  if (!requirements) return null;
  const hasTypes = requirements.types && requirements.types.length > 0;
  const hasAttributes = requirements.attributes && requirements.attributes.length > 0;
  if (!hasTypes && !hasAttributes) return null;

  return (
    <div className="mission-card__requirements">
      {hasTypes && (
        <div className="mission-card__req-group">
          <span className="mission-card__req-label">Required Types:</span>
          <BadgeGroup>
            {requirements.types!.map((type) => (
              <TypeBadge key={type} type={type} size="sm" />
            ))}
          </BadgeGroup>
        </div>
      )}
      {hasAttributes && (
        <div className="mission-card__req-group">
          <span className="mission-card__req-label">Required Attributes:</span>
          <BadgeGroup>
            {requirements.attributes!.map((attr) => (
              <AttributeBadge key={attr} attribute={attr} size="sm" />
            ))}
          </BadgeGroup>
        </div>
      )}
    </div>
  );
};

// ── Main Card ──────────────────────────────────────────────────────────────

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
  footer?: React.ReactNode;
}

export const MissionCard = ({ mission, onClick, footer }: MissionCardProps) => {
  const requirements = parseJson<MissionRequirements>(mission.requirements);
  const rewardConfig = parseJson<MissionRewardConfig>(mission.rewardConfig);

  return (
    <div
      className={`mission-card${onClick ? ' mission-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <div className="mission-card__header">
        <h3 className="mission-card__title">{mission.title}</h3>
        <DifficultyBadge difficulty={mission.difficulty} />
      </div>

      {mission.description && (
        <p className="mission-card__description">{mission.description}</p>
      )}

      <div className="mission-card__stats">
        <div className="mission-card__stat">
          <i className="fas fa-star"></i>
          <span>{mission.requiredProgress} points</span>
        </div>
        <div className="mission-card__stat">
          <i className="fas fa-paw"></i>
          <span>Max {mission.maxMonsters} monsters</span>
        </div>
        {mission.minLevel > 1 && (
          <div className="mission-card__stat">
            <i className="fas fa-level-up-alt"></i>
            <span>Min Lv. {mission.minLevel}</span>
          </div>
        )}
      </div>

      <RequirementsList requirements={requirements} />
      <RewardsList rewardConfig={rewardConfig} />

      {footer && <div className="mission-card__footer">{footer}</div>}
    </div>
  );
};
