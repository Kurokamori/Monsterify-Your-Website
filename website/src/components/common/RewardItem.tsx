import { ReactNode, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { TypeBadge } from './TypeBadge';
import { AttributeBadge } from './AttributeBadge';
import { BadgeGroup } from './BadgeGroup';

export type RewardType = 'coin' | 'level' | 'item' | 'monster' | 'points' | 'custom';
export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';

export interface MonsterRewardData {
  species1?: string;
  species2?: string;
  species3?: string;
  types?: string[];
  attribute?: string;
  level?: number;
  isLegendary?: boolean;
  isMystery?: boolean;
}

export interface ItemRewardData {
  name: string;
  category?: string;
  description?: string;
  effect?: string;
}

export interface RewardData {
  id?: string | number;
  type: RewardType;
  /** Amount for coins, levels, points */
  amount?: number;
  /** Item data for item rewards */
  item?: ItemRewardData;
  /** Monster data for monster rewards */
  monster?: MonsterRewardData;
  /** Custom label for display */
  label?: string;
  /** Custom icon class */
  icon?: string;
  /** Rarity level */
  rarity?: RewardRarity;
  /** Whether reward has been claimed */
  claimed?: boolean;
  /** Who claimed the reward */
  claimedBy?: string;
  /** Whether reward was forfeited */
  forfeited?: boolean;
  /** Link URL for item/monster */
  linkUrl?: string;
}

interface RewardItemProps {
  /** Reward data */
  reward: RewardData;
  /** Compact display mode */
  compact?: boolean;
  /** Show claim button */
  showClaimButton?: boolean;
  /** Claim button label */
  claimLabel?: string;
  /** On claim callback */
  onClaim?: (reward: RewardData) => void;
  /** Show assign button (for allocatable rewards) */
  showAssignButton?: boolean;
  /** Assign button label */
  assignLabel?: string;
  /** On assign callback */
  onAssign?: (reward: RewardData) => void;
  /** Show forfeit button (for monster rewards) */
  showForfeitButton?: boolean;
  /** On forfeit callback */
  onForfeit?: (reward: RewardData) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Custom content to render after reward info */
  extra?: ReactNode;
  /** Additional className */
  className?: string;
}

/** Format quantity with proper pluralization */
const formatQuantity = (amount: number, singular: string, plural?: string): string => {
  const pluralForm = plural || `${singular}s`;
  return `${amount.toLocaleString()} ${amount === 1 ? singular : pluralForm}`;
};

/** Get icon class for reward type */
const getRewardIcon = (type: RewardType, customIcon?: string): string => {
  if (customIcon) return customIcon;

  switch (type) {
    case 'coin': return 'fas fa-coins';
    case 'level': return 'fas fa-arrow-up';
    case 'item': return 'fas fa-box';
    case 'monster': return 'fas fa-dragon';
    case 'points': return 'fas fa-seedling';
    default: return 'fas fa-gift';
  }
};

/** Get display label for reward */
const getRewardLabel = (reward: RewardData): string => {
  if (reward.label) return reward.label;

  switch (reward.type) {
    case 'coin':
      return formatQuantity(reward.amount || 0, 'coin');
    case 'level':
      return formatQuantity(reward.amount || 0, 'level');
    case 'points':
      return formatQuantity(reward.amount || 0, 'point');
    case 'item':
      if (reward.item) {
        const qty = reward.amount && reward.amount > 1 ? `${reward.amount}x ` : '';
        return `${qty}${reward.item.name}`;
      }
      return 'Item';
    case 'monster':
      if (reward.monster) {
        const species = [
          reward.monster.species1,
          reward.monster.species2,
          reward.monster.species3
        ].filter(Boolean).join('/');
        return species || (reward.monster.isMystery ? 'Mystery Monster' : 'Monster');
      }
      return 'Monster';
    default:
      return 'Reward';
  }
};

/**
 * RewardItem - Displays a single reward with icon, info, and actions
 */
export const RewardItem = ({
  reward,
  compact = false,
  showClaimButton = false,
  claimLabel = 'Claim',
  onClaim,
  showAssignButton = false,
  assignLabel = 'Assign',
  onAssign,
  showForfeitButton = false,
  onForfeit,
  disabled = false,
  extra,
  className = ''
}: RewardItemProps) => {
  const isClaimed = reward.claimed || reward.forfeited;
  const isDisabled = disabled || isClaimed;

  const handleClaim = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled && onClaim) {
      onClaim(reward);
    }
  };

  const handleAssign = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled && onAssign) {
      onAssign(reward);
    }
  };

  const handleForfeit = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled && onForfeit) {
      onForfeit(reward);
    }
  };

  const classes = [
    'reward-item',
    compact && 'reward-item--compact',
    `reward-item--${reward.type}`,
    reward.rarity && `reward-item--${reward.rarity}`,
    isClaimed && 'reward-item--claimed',
    isDisabled && 'reward-item--disabled',
    className
  ].filter(Boolean).join(' ');

  const iconClasses = [
    'reward-item__icon',
    `reward-item__icon--${reward.type}`
  ].join(' ');

  const label = getRewardLabel(reward);
  const icon = getRewardIcon(reward.type, reward.icon);

  // Render monster-specific content
  const renderMonsterDetails = () => {
    if (reward.type !== 'monster' || !reward.monster || compact) return null;

    const { types, attribute, level, isMystery } = reward.monster;

    return (
      <div className="reward-item__monster-details">
        {level && <span className="reward-item__level">Lv. {level}</span>}
        {types && types.length > 0 && (
          <BadgeGroup gap="xs">
            {types.map((type, idx) => (
              <TypeBadge key={idx} type={isMystery ? '???' : type} size="xs" />
            ))}
          </BadgeGroup>
        )}
        {attribute && (
          <AttributeBadge attribute={isMystery ? '???' : attribute} size="xs" />
        )}
      </div>
    );
  };

  // Render item-specific content
  const renderItemDetails = () => {
    if (reward.type !== 'item' || !reward.item || compact) return null;

    const { category, effect, description } = reward.item;

    return (
      <div className="reward-item__item-details">
        {category && <span className="reward-item__category">{category}</span>}
        {(effect || description) && (
          <p className="reward-item__description">{effect || description}</p>
        )}
      </div>
    );
  };

  // Wrap in link if linkUrl provided
  const content = (
    <>
      <div className={iconClasses}>
        <i className={icon}></i>
      </div>

      <div className="reward-item__content">
        <div className="reward-item__header">
          <span className="reward-item__label">{label}</span>
        </div>

        {renderMonsterDetails()}
        {renderItemDetails()}

        {isClaimed && (
          <span className="reward-item__status">
            {reward.forfeited ? 'Forfeited' : `Claimed${reward.claimedBy ? ` by ${reward.claimedBy}` : ''}`}
          </span>
        )}
      </div>

      {extra && <div className="reward-item__extra">{extra}</div>}

      {!compact && (showClaimButton || showAssignButton || showForfeitButton) && (
        <div className="reward-item__actions">
          {showAssignButton && onAssign && (
            <button
              type="button"
              className="button sm secondary"
              onClick={handleAssign}
              disabled={isDisabled}
            >
              {assignLabel}
            </button>
          )}
          {showForfeitButton && reward.type === 'monster' && onForfeit && (
            <button
              type="button"
              className="button sm ghost"
              onClick={handleForfeit}
              disabled={isDisabled}
            >
              Forfeit
            </button>
          )}
          {showClaimButton && onClaim && (
            <button
              type="button"
              className="button sm primary"
              onClick={handleClaim}
              disabled={isDisabled}
            >
              {claimLabel}
            </button>
          )}
        </div>
      )}
    </>
  );

  if (reward.linkUrl && !compact) {
    return (
      <Link to={reward.linkUrl} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <div className={classes}>
      {content}
    </div>
  );
};
