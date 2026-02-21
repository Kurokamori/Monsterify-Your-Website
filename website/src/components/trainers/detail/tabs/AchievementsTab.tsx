import type { Achievement, AchievementStats } from '../useTrainerDetail';

const CATEGORY_ICONS: Record<string, string> = {
  type: 'fas fa-fire',
  attribute: 'fas fa-shield-alt',
  level100: 'fas fa-star',
  trainer_level: 'fas fa-trophy',
  special: 'fas fa-crown',
};

interface AchievementsTabProps {
  achievements: Achievement[];
  achievementStats: AchievementStats | null;
  achievementsLoading: boolean;
  achievementFilter: string;
  setAchievementFilter: (v: string) => void;
  isOwner: boolean;
  isClaimingAll: boolean;
  handleClaimAchievement: (id: number) => void;
  handleClaimAllAchievements: () => void;
}

export const AchievementsTab = ({
  achievements,
  achievementStats,
  achievementsLoading,
  achievementFilter,
  setAchievementFilter,
  isOwner,
  isClaimingAll,
  handleClaimAchievement,
  handleClaimAllAchievements,
}: AchievementsTabProps) => {
  const filtered = achievements.filter(a => {
    if (achievementFilter === 'all') return true;
    if (achievementFilter === 'unlocked') return a.unlocked;
    if (achievementFilter === 'claimable') return a.canClaim;
    return a.category === achievementFilter;
  });

  const filters = [
    { key: 'all', label: 'All', count: achievements.length },
    { key: 'unlocked', label: 'Unlocked', count: achievements.filter(a => a.unlocked).length },
    { key: 'type', label: 'Type', count: achievements.filter(a => a.category === 'type').length },
    { key: 'attribute', label: 'Attribute', count: achievements.filter(a => a.category === 'attribute').length },
    { key: 'level100', label: 'Level 100', count: achievements.filter(a => a.category === 'level100').length },
    { key: 'trainer_level', label: 'Trainer Level', count: achievements.filter(a => a.category === 'trainer_level').length },
    { key: 'special', label: 'Special', count: achievements.filter(a => a.category === 'special').length },
  ];

  if (isOwner) {
    filters.push({ key: 'claimable', label: 'Claimable', count: achievements.filter(a => a.canClaim).length });
  }

  return (
    <div className="trainer-achievements-tab">
      <div className="achievements-header">
        <h2>Achievements</h2>
        {achievementStats && (
          <div className="achievement-stats">
            <div className="trainer-detail__stat-item">
              <span className="stat-number">{achievementStats.unlocked}</span>
              <span className="trainer-detail__stat-label">Unlocked</span>
            </div>
            <div className="trainer-detail__stat-item">
              <span className="stat-number">{achievementStats.claimed}</span>
              <span className="trainer-detail__stat-label">Claimed</span>
            </div>
            {isOwner && achievementStats.unclaimed > 0 && (
              <div className="trainer-detail__stat-item highlight">
                <span className="stat-number">{achievementStats.unclaimed}</span>
                <span className="trainer-detail__stat-label">Ready to Claim</span>
              </div>
            )}
          </div>
        )}
        {isOwner && achievementStats && achievementStats.unclaimed > 0 && (
          <button className="button primary" onClick={handleClaimAllAchievements} disabled={isClaimingAll}>
            {isClaimingAll ? (
              <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
            ) : (
              <><i className="fas fa-trophy"></i> Claim All ({achievementStats.unclaimed})</>
            )}
          </button>
        )}
      </div>

      {achievementsLoading ? (
        <div className="loading-message">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading achievements...</p>
        </div>
      ) : (
        <>
          <div className="achievement-filters">
            {filters.map(f => (
              <button
                key={f.key}
                className={`button filter ${achievementFilter === f.key ? 'active' : ''}`}
                onClick={() => setAchievementFilter(f.key)}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <div className="achievements-grid">
            {filtered.map(achievement => (
              <div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} ${achievement.claimed ? 'claimed' : ''}`}
              >
                <div className="achievement-icon">
                  <i className={CATEGORY_ICONS[achievement.category || ''] || 'fas fa-trophy'}></i>
                </div>

                <div className="achievement-content">
                  <h3 className="achievement-name">{achievement.name}</h3>
                  <p className="achievement-description">{achievement.description}</p>

                  <div className="achievement-progress">
                    <div className="progress">
                      <div
                        className="progress-fill primary"
                        style={{
                          width: `${Math.min(100, ((achievement.progress || 0) / (achievement.requirement as number || 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {achievement.progress || 0} / {achievement.requirement as number || 0}
                    </span>
                  </div>

                  {(achievement.reward_currency || achievement.reward_item) && (
                    <div className="achievement-reward">
                      {achievement.reward_currency && (
                        <span className="reward-currency">
                          <i className="fas fa-coins"></i> {achievement.reward_currency}
                        </span>
                      )}
                      {achievement.reward_item && (
                        <span className="trainer-detail__reward-item">
                          <i className="fas fa-gift"></i> {achievement.reward_item}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="achievement-status">
                  {achievement.claimed && (
                    <span className="status-locked"><i className="fas fa-check-circle"></i> Claimed</span>
                  )}
                  {achievement.canClaim && (
                    <button className="button primary" onClick={() => handleClaimAchievement(achievement.id)}>
                      <i className="fas fa-hand-point-right"></i> Claim
                    </button>
                  )}
                  {achievement.unlocked && !achievement.claimed && !achievement.canClaim && (
                    <span className="status-locked"><i className="fas fa-unlock"></i> Unlocked</span>
                  )}
                  {!achievement.unlocked && (
                    <span className="status-locked"><i className="fas fa-lock"></i> Locked</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {achievements.length === 0 && (
            <div className="no-achievements-message">
              <i className="fas fa-trophy"></i>
              <p>No achievements found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
