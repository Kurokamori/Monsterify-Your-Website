import { ReactNode, useMemo } from 'react';
import { RewardItem, RewardData, RewardType } from './RewardItem';
import { AutoStateContainer } from './StateContainer';

type GroupBy = 'type' | 'rarity' | 'none';

interface RewardListProps {
  /** Array of rewards to display */
  rewards: RewardData[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | Error | null;
  /** Retry handler */
  onRetry?: () => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: string;
  /** Compact display mode */
  compact?: boolean;
  /** Group rewards by type or rarity */
  groupBy?: GroupBy;
  /** Show claim buttons */
  showClaimButtons?: boolean;
  /** Claim button label */
  claimLabel?: string;
  /** On claim single reward */
  onClaim?: (reward: RewardData) => void;
  /** Show claim all button */
  showClaimAll?: boolean;
  /** Claim all label */
  claimAllLabel?: string;
  /** On claim all rewards */
  onClaimAll?: (rewards: RewardData[]) => void;
  /** Show assign buttons (for allocatable rewards) */
  showAssignButtons?: boolean;
  /** Assign button label */
  assignLabel?: string;
  /** On assign callback */
  onAssign?: (reward: RewardData) => void;
  /** Show forfeit buttons (for monster rewards) */
  showForfeitButtons?: boolean;
  /** On forfeit callback */
  onForfeit?: (reward: RewardData) => void;
  /** Title for the list */
  title?: string;
  /** Header actions */
  headerActions?: ReactNode;
  /** Filter to show only certain types */
  filterTypes?: RewardType[];
  /** Hide claimed rewards */
  hideClaimed?: boolean;
  /** Additional className */
  className?: string;
}

/** Get group label for display */
const getGroupLabel = (groupBy: GroupBy, value: string): string => {
  if (groupBy === 'type') {
    switch (value) {
      case 'coin': return 'Coins';
      case 'level': return 'Levels';
      case 'item': return 'Items';
      case 'monster': return 'Monsters';
      case 'points': return 'Points';
      default: return 'Other';
    }
  }

  if (groupBy === 'rarity') {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  return value;
};

/** Get group icon for display */
const getGroupIcon = (groupBy: GroupBy, value: string): string => {
  if (groupBy === 'type') {
    switch (value) {
      case 'coin': return 'fas fa-coins';
      case 'level': return 'fas fa-arrow-up';
      case 'item': return 'fas fa-box';
      case 'monster': return 'fas fa-dragon';
      case 'points': return 'fas fa-seedling';
      default: return 'fas fa-gift';
    }
  }

  if (groupBy === 'rarity') {
    switch (value) {
      case 'legendary': return 'fas fa-crown';
      case 'mythic': return 'fas fa-star';
      case 'rare': return 'fas fa-gem';
      default: return 'fas fa-circle';
    }
  }

  return 'fas fa-list';
};

/**
 * RewardList - Displays a list of rewards with grouping and batch actions
 */
export const RewardList = ({
  rewards,
  loading = false,
  error,
  onRetry,
  emptyMessage = 'No rewards available',
  emptyIcon = 'fas fa-gift',
  compact = false,
  groupBy = 'none',
  showClaimButtons = false,
  claimLabel = 'Claim',
  onClaim,
  showClaimAll = false,
  claimAllLabel = 'Claim All',
  onClaimAll,
  showAssignButtons = false,
  assignLabel = 'Assign',
  onAssign,
  showForfeitButtons = false,
  onForfeit,
  title,
  headerActions,
  filterTypes,
  hideClaimed = false,
  className = ''
}: RewardListProps) => {
  // Filter and process rewards
  const filteredRewards = useMemo(() => {
    let result = [...rewards];

    if (filterTypes && filterTypes.length > 0) {
      result = result.filter(r => filterTypes.includes(r.type));
    }

    if (hideClaimed) {
      result = result.filter(r => !r.claimed && !r.forfeited);
    }

    return result;
  }, [rewards, filterTypes, hideClaimed]);

  // Group rewards if needed
  const groupedRewards = useMemo(() => {
    if (groupBy === 'none') {
      return { all: filteredRewards };
    }

    const groups: Record<string, RewardData[]> = {};

    filteredRewards.forEach(reward => {
      const key = groupBy === 'type'
        ? reward.type
        : reward.rarity || 'common';

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(reward);
    });

    // Sort groups by predefined order
    const typeOrder = ['level', 'coin', 'item', 'monster', 'points', 'custom'];
    const rarityOrder = ['mythic', 'legendary', 'rare', 'uncommon', 'common'];
    const order = groupBy === 'type' ? typeOrder : rarityOrder;

    const sorted: Record<string, RewardData[]> = {};
    order.forEach(key => {
      if (groups[key]) {
        sorted[key] = groups[key];
      }
    });

    // Add any remaining groups
    Object.keys(groups).forEach(key => {
      if (!sorted[key]) {
        sorted[key] = groups[key];
      }
    });

    return sorted;
  }, [filteredRewards, groupBy]);

  // Calculate unclaimed rewards for claim all
  const unclaimedRewards = useMemo(() => {
    return filteredRewards.filter(r => !r.claimed && !r.forfeited);
  }, [filteredRewards]);

  const handleClaimAll = () => {
    if (onClaimAll && unclaimedRewards.length > 0) {
      onClaimAll(unclaimedRewards);
    }
  };

  // Summary counts
  const summary = useMemo(() => {
    const counts: Partial<Record<RewardType, number>> = {};

    filteredRewards.forEach(reward => {
      const amount = reward.amount || 1;
      counts[reward.type] = (counts[reward.type] || 0) + amount;
    });

    return counts;
  }, [filteredRewards]);

  const classes = [
    'reward-list',
    compact && 'reward-list--compact',
    className
  ].filter(Boolean).join(' ');

  const renderGroup = (key: string, items: RewardData[]) => (
    <div key={key} className="reward-list__group">
      {groupBy !== 'none' && (
        <div className="reward-list__group-header">
          <i className={getGroupIcon(groupBy, key)}></i>
          <span className="reward-list__group-title">{getGroupLabel(groupBy, key)}</span>
          <span className="reward-list__group-count">({items.length})</span>
        </div>
      )}
      <div className="reward-list__items">
        {items.map((reward, index) => (
          <RewardItem
            key={reward.id || index}
            reward={reward}
            compact={compact}
            showClaimButton={showClaimButtons}
            claimLabel={claimLabel}
            onClaim={onClaim}
            showAssignButton={showAssignButtons}
            assignLabel={assignLabel}
            onAssign={onAssign}
            showForfeitButton={showForfeitButtons}
            onForfeit={onForfeit}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={classes}>
      {/* Header */}
      {(title || headerActions || showClaimAll) && (
        <div className="reward-list__header">
          {title && <h3 className="reward-list__title">{title}</h3>}

          <div className="reward-list__header-actions">
            {headerActions}
            {showClaimAll && unclaimedRewards.length > 0 && onClaimAll && (
              <button
                type="button"
                className="button sm primary"
                onClick={handleClaimAll}
              >
                {claimAllLabel} ({unclaimedRewards.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {!compact && Object.keys(summary).length > 0 && (
        <div className="reward-list__summary">
          {summary.level && (
            <span className="reward-list__summary-item">
              <i className="fas fa-arrow-up"></i>
              {summary.level.toLocaleString()} levels
            </span>
          )}
          {summary.coin && (
            <span className="reward-list__summary-item">
              <i className="fas fa-coins"></i>
              {summary.coin.toLocaleString()} coins
            </span>
          )}
          {summary.item && (
            <span className="reward-list__summary-item">
              <i className="fas fa-box"></i>
              {summary.item} items
            </span>
          )}
          {summary.monster && (
            <span className="reward-list__summary-item">
              <i className="fas fa-dragon"></i>
              {summary.monster} monsters
            </span>
          )}
          {summary.points && (
            <span className="reward-list__summary-item">
              <i className="fas fa-seedling"></i>
              {summary.points.toLocaleString()} points
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <AutoStateContainer
        loading={loading}
        error={error}
        data={filteredRewards}
        onRetry={onRetry}
        emptyMessage={emptyMessage}
        emptyIcon={emptyIcon}
      >
        <div className="reward-list__content">
          {Object.entries(groupedRewards).map(([key, items]) =>
            renderGroup(key, items)
          )}
        </div>
      </AutoStateContainer>
    </div>
  );
};

// Re-export types for convenience
export type { RewardData, RewardType, RewardRarity, MonsterRewardData, ItemRewardData } from './RewardItem';
