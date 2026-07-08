import { useState, useEffect } from 'react';
import battleService, { type TrainerBadge } from '@services/battleService';

interface BadgeCaseProps {
  trainerId: number;
}

/** Total badge slots to display. Bump this if more gyms/badges are added. */
const TOTAL_BADGE_SLOTS = 8;

/** Placeholder image shown for a badge slot that hasn't been earned yet. */
const EMPTY_BADGE_IMG = '/images/badge_empty.png';

/**
 * Displays the gym badges a trainer has earned through battle gauntlets.
 */
export const BadgeCase = ({ trainerId }: BadgeCaseProps) => {
  const [badges, setBadges] = useState<TrainerBadge[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    battleService.getTrainerBadges(trainerId)
      .then(b => { if (!cancelled) setBadges(b); })
      .catch(() => { if (!cancelled) setBadges([]); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [trainerId]);

  if (!loaded) return null;

  const emptySlots = Math.max(0, TOTAL_BADGE_SLOTS - badges.length);

  return (
    <div className="battle-badge-case">
      <h3><i className="fas fa-medal"></i> Badges <span className="battle-badge-case__count">{badges.length}/{TOTAL_BADGE_SLOTS}</span></h3>
      <div className="battle-badge-case__grid">
        {badges.map(badge => (
          <div
            key={badge.id}
            className="battle-badge-case__item"
            title={`${badge.badgeName} — ${badge.gymName} (Leader: ${badge.leaderName})\nEarned ${new Date(badge.earnedAt).toLocaleDateString()}`}
          >
            {badge.badgeImgLink ? (
              <img src={badge.badgeImgLink} alt={badge.badgeName} />
            ) : (
              <span className="battle-badge-placeholder">
                <i className="fas fa-medal"></i>
              </span>
            )}
            <span className="battle-badge-case__name">{badge.badgeName}</span>
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="battle-badge-case__item battle-badge-case__item--empty"
            title="Badge not yet earned"
          >
            <img src={EMPTY_BADGE_IMG} alt="Empty badge slot" />
            <span className="battle-badge-case__name">&mdash;</span>
          </div>
        ))}
      </div>
    </div>
  );
};
