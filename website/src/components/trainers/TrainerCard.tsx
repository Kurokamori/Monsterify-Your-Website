import { MouseEvent } from 'react';
import { Card } from '../common/Card';
import { TypeBadge } from '../common/TypeBadge';
import { BadgeGroup } from '../common/BadgeGroup';
import type { Trainer, TrainerCardData } from './types/Trainer';
import { getTrainerTypes } from './types/Trainer';

interface CardAction {
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  disabled?: boolean;
}

type TrainerCardVariant = 'default' | 'compact' | 'horizontal';

interface TrainerCardProps {
  /** Trainer data */
  trainer: Trainer | TrainerCardData;
  /** Card visual variant */
  variant?: TrainerCardVariant;
  /** Show monster count */
  showMonsterCount?: boolean;
  /** Show player name */
  showPlayer?: boolean;
  /** Show types */
  showTypes?: boolean;
  /** Maximum types to display */
  maxTypes?: number;
  /** Custom image fallback */
  imageFallback?: string;
  /** Card actions */
  actions?: CardAction[];
  /** Click handler */
  onClick?: (trainer: Trainer | TrainerCardData) => void;
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

const DEFAULT_TRAINER_IMAGE = '/images/default_trainer.png';

/**
 * TrainerCard - Display component for trainer information
 * Wraps the common Card component with trainer-specific styling and content
 */
export function TrainerCard({
  trainer,
  variant = 'default',
  showMonsterCount = true,
  showPlayer = false,
  showTypes = true,
  maxTypes = 3,
  imageFallback = DEFAULT_TRAINER_IMAGE,
  actions,
  onClick,
  selected = false,
  disabled = false,
  className = ''
}: TrainerCardProps) {
  const types = getTrainerTypes(trainer);
  const displayTypes = types.slice(0, maxTypes);
  const remainingTypes = types.length - maxTypes;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(trainer);
    }
  };

  // Build subtitle content
  const renderSubtitle = () => {
    const parts: string[] = [];

    if (trainer.faction) {
      parts.push(trainer.faction);
    }

    if (trainer.nickname) {
      parts.push(trainer.nickname);
    }

    return parts.length > 0 ? parts.join(' • ') : undefined;
  };

  // Build header action (level badge)
  const renderHeaderAction = () => (
    <span className="badge badge--accent">
      Lv. {trainer.level}
    </span>
  );

  // Map variant to Card props
  const getCardProps = () => {
    switch (variant) {
      case 'compact':
        return {
          variant: 'compact' as const,
          size: 'sm' as const,
          imagePosition: 'left' as const,
          imageHeight: '80px'
        };
      case 'horizontal':
        return {
          variant: 'default' as const,
          size: 'md' as const,
          imagePosition: 'left' as const,
          imageHeight: '120px'
        };
      default:
        return {
          variant: 'default' as const,
          size: 'md' as const,
          imagePosition: 'top' as const,
          imageHeight: '180px'
        };
    }
  };

  const cardProps = getCardProps();

  return (
    <Card
      title={trainer.name}
      subtitle={renderSubtitle()}
      imageOverlay={renderHeaderAction()}
      image={trainer.main_ref || imageFallback}
      imageAlt={`${trainer.name} portrait`}
      imageFallback={imageFallback}
      actions={actions}
      selected={selected}
      disabled={disabled}
      onClick={onClick ? handleClick : undefined}
      fullHeight
      className={`trainer-card ${className}`}
      {...cardProps}
    >
      <div className="trainer-card__content">
        {/* Types */}
        {showTypes && displayTypes.length > 0 && (
          <BadgeGroup className="trainer-card__types">
            {displayTypes.map((type) => (
              <TypeBadge key={type} type={type} size="xs" />
            ))}
            {remainingTypes > 0 && (
              <span className="badge badge--muted xs">+{remainingTypes}</span>
            )}
          </BadgeGroup>
        )}

        {/* Stats row */}
        <div className="trainer-card__stats">
          {showMonsterCount && trainer.monster_count !== undefined && (
            <span className="trainer-card__stat">
              <i className="fas fa-paw"></i>
              {trainer.monster_count}
            </span>
          )}

          {showPlayer && trainer.player_display_name && (
            <span className="trainer-card__stat">
              <i className="fas fa-user"></i>
              {trainer.player_display_name}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * TrainerCardSkeleton - Loading placeholder for trainer cards
 */
export function TrainerCardSkeleton() {
  return (
    <div className="card card--default trainer-card trainer-card--skeleton">
      <div className="card__image skeleton" style={{ height: '180px' }} />
      <div className="card__body">
        <div className="card__header">
          <div className="skeleton skeleton--text" style={{ width: '70%', height: '1.25rem' }} />
          <div className="skeleton skeleton--text" style={{ width: '3rem', height: '1rem' }} />
        </div>
        <div className="skeleton skeleton--text" style={{ width: '50%', height: '0.875rem', marginTop: '0.5rem' }} />
        <div className="trainer-card__types" style={{ marginTop: '0.75rem' }}>
          <div className="skeleton" style={{ width: '3rem', height: '1.25rem', borderRadius: '0.25rem' }} />
          <div className="skeleton" style={{ width: '3rem', height: '1.25rem', borderRadius: '0.25rem' }} />
        </div>
      </div>
    </div>
  );
}
