import { TypeBadge } from '../../../components/common/TypeBadge';
import { AttributeBadge } from '../../../components/common/AttributeBadge';
import { BadgeGroup } from '../../../components/common/BadgeGroup';
import type { Mission, MissionRequirements, MissionRewardConfig } from './types';
import { getDifficultyConfig, parseJson } from './types';

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
  return (
    <div className="mission-card__rewards">
      <h4 className="mission-card__section-title">
        <i className="fas fa-gift"></i> Potential Rewards
      </h4>
      <div className="mission-card__reward-grid">
        {rewardConfig.levels && (
          <div className="mission-card__reward-item">
            <i className="fas fa-arrow-up"></i>
            <span>{rewardConfig.levels.min}-{rewardConfig.levels.max} Levels</span>
          </div>
        )}
        {rewardConfig.coins && (
          <div className="mission-card__reward-item">
            <i className="fas fa-coins"></i>
            <span>{rewardConfig.coins.min}-{rewardConfig.coins.max} Coins</span>
          </div>
        )}
        {rewardConfig.items && (
          <div className="mission-card__reward-item">
            <i className="fas fa-box-open"></i>
            <span>{rewardConfig.items.min}-{rewardConfig.items.max} Items</span>
          </div>
        )}
        {rewardConfig.monsters && (
          <div className="mission-card__reward-item">
            <i className="fas fa-paw"></i>
            <span>{rewardConfig.monsters.count} Monster{rewardConfig.monsters.count !== 1 ? 's' : ''}</span>
          </div>
        )}
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
          <i className="fas fa-clock"></i>
          <span>{mission.duration} submissions</span>
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
