import { useState, useEffect } from 'react';
import battleService, { type TrainerBadge } from '@services/battleService';

interface BadgeCaseProps {
  trainerId: number;
}

/** Slots shown in the gym badge case. Bump if more gyms are added. */
const GYM_BADGE_SLOTS = 8;
/** Slots shown in the league badge case (the four league badges). */
const LEAGUE_BADGE_SLOTS = 4;

/** Placeholder image shown for a badge slot that hasn't been earned yet. */
const EMPTY_BADGE_IMG = '/images/badge_empty.png';

const badgeTooltip = (badge: TrainerBadge): string =>
  `${badge.badgeName} — ${badge.gymName} (Leader: ${badge.leaderName})\nEarned ${new Date(badge.earnedAt).toLocaleDateString()}`;

const EarnedBadge = ({ badge, extraClass = '' }: { badge: TrainerBadge; extraClass?: string }) => (
  <div className={`battle-badge-case__item ${extraClass}`} title={badgeTooltip(badge)}>
    {badge.badgeImgLink ? (
      <img src={badge.badgeImgLink} alt={badge.badgeName} />
    ) : (
      <span className="battle-badge-placeholder">
        <i className={badge.badgeKind === 'champion' ? 'fas fa-crown' : 'fas fa-medal'}></i>
      </span>
    )}
    <span className="battle-badge-case__name">{badge.badgeName}</span>
  </div>
);

const EmptyBadge = ({ extraClass = '' }: { extraClass?: string }) => (
  <div className={`battle-badge-case__item battle-badge-case__item--empty ${extraClass}`} title="Badge not yet earned">
    <img src={EMPTY_BADGE_IMG} alt="Empty badge slot" />
    <span className="battle-badge-case__name">&mdash;</span>
  </div>
);

/**
 * Displays the badges a trainer has earned: gym badges in one case, and league
 * badges — with the champion badge shown as a separate, special slot — in another.
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

  // `ai` battles never award badges; treat any unexpected kind as a gym badge.
  const gymBadges = badges.filter(b => b.badgeKind !== 'league' && b.badgeKind !== 'champion');
  const leagueBadges = badges.filter(b => b.badgeKind === 'league');
  const championBadge = badges.find(b => b.badgeKind === 'champion') ?? null;

  const gymEmpty = Math.max(0, GYM_BADGE_SLOTS - gymBadges.length);
  const leagueEmpty = Math.max(0, LEAGUE_BADGE_SLOTS - leagueBadges.length);

  return (
    <div className="battle-badge-cases">
      <div className="battle-badge-case">
        <h3>
          <i className="fas fa-medal"></i> Badges
          <span className="battle-badge-case__count">{gymBadges.length}/{GYM_BADGE_SLOTS}</span>
        </h3>
        <div className="battle-badge-case__grid">
          {gymBadges.map(badge => <EarnedBadge key={badge.id} badge={badge} />)}
          {Array.from({ length: gymEmpty }).map((_, i) => <EmptyBadge key={`gym-empty-${i}`} />)}
        </div>
      </div>

      <div className="battle-badge-case battle-badge-case--league">
        <h3>
          <i className="fas fa-award"></i> League Badges
          <span className="battle-badge-case__count">{leagueBadges.length}/{LEAGUE_BADGE_SLOTS}</span>
        </h3>
        <div className="battle-badge-case__grid">
          {leagueBadges.map(badge => <EarnedBadge key={badge.id} badge={badge} />)}
          {Array.from({ length: leagueEmpty }).map((_, i) => (
            <EmptyBadge key={`league-empty-${i}`} />
          ))}
          {championBadge ? (
            <EarnedBadge badge={championBadge} extraClass="battle-badge-case__item--champion" />
          ) : (
            <EmptyBadge extraClass="battle-badge-case__item--champion" />
          )}
        </div>
      </div>
    </div>
  );
};
