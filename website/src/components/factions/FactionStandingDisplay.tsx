import { useMemo } from 'react';

interface FactionTitle {
  id: number;
  name: string;
  description: string;
  standing_requirement: number;
  is_positive: boolean;
  requires_tribute?: boolean;
  tribute_status?: 'pending' | 'rejected' | 'approved' | null;
}

interface FactionStanding {
  standing: number;
  current_title_name?: string;
  current_title_description?: string;
  availableTitles?: FactionTitle[];
}

interface Faction {
  id: number | string;
  name: string;
  color?: string;
}

interface FactionStandingDisplayProps {
  standing?: FactionStanding | null;
  faction: Faction;
  trainerId?: number | string;
}

const getStandingColor = (standingValue: number): string => {
  if (standingValue >= 800) return 'var(--success-color)';
  if (standingValue >= 400) return '#8BC34A';
  if (standingValue >= 200) return '#CDDC39';
  if (standingValue > 0) return 'var(--warning-color)';
  if (standingValue === 0) return 'var(--text-color-muted)';
  if (standingValue >= -200) return '#FF9800';
  if (standingValue >= -400) return '#FF5722';
  if (standingValue >= -600) return 'var(--error-color)';
  if (standingValue >= -800) return '#E91E63';
  return '#9C27B0';
};

const getStandingLabel = (standingValue: number): string => {
  if (standingValue >= 1000) return 'Champion';
  if (standingValue >= 800) return 'Expert';
  if (standingValue >= 600) return 'Adept';
  if (standingValue >= 400) return 'Apprentice';
  if (standingValue >= 200) return 'Initiate';
  if (standingValue > 0) return 'Favorable';
  if (standingValue === 0) return 'Neutral';
  if (standingValue >= -200) return 'Distrusted';
  if (standingValue >= -400) return 'Unwelcome';
  if (standingValue >= -600) return 'Adversary';
  if (standingValue >= -800) return 'Enemy';
  return 'Nemesis';
};

const getProgressPercentage = (standingValue: number): number => {
  return ((standingValue + 1000) / 2000) * 100;
};

export const FactionStandingDisplay = ({
  standing,
  faction
}: FactionStandingDisplayProps) => {
  const nextTitle = useMemo(() => {
    if (!standing?.availableTitles) return null;

    return standing.availableTitles
      .filter(title => title.is_positive && title.standing_requirement > standing.standing)
      .sort((a, b) => a.standing_requirement - b.standing_requirement)[0] || null;
  }, [standing]);

  if (!standing) {
    return (
      <div className="standing-display standing-display--empty">
        <div className="standing-display__header">
          <h3>Standing with {faction?.name}</h3>
          <div className="standing-display__value" style={{ color: 'var(--text-color-muted)' }}>
            <span className="standing-display__number">0</span>
            <span className="standing-display__label">Neutral</span>
          </div>
        </div>
        <div className="standing-bar">
          <div className="progress">
            <div className="progress-fill" style={{ width: '50%', backgroundColor: 'var(--text-color-muted)' }}></div>
          </div>
        </div>
        <p>No standing established with this faction yet.</p>
      </div>
    );
  }

  const standingColor = getStandingColor(standing.standing);
  const standingLabel = getStandingLabel(standing.standing);
  const progressPercentage = getProgressPercentage(standing.standing);

  return (
    <div className="standing-display">
      <div className="standing-display__header">
        <h3>Standing with {faction.name}</h3>
        <div className="standing-display__value" style={{ color: standingColor }}>
          <span className="standing-display__number">{standing.standing}</span>
          <span className="standing-display__label">{standingLabel}</span>
        </div>
      </div>

      <div className="standing-bar">
        <div className="progress">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: standingColor
            }}
          ></div>
        </div>
        <div className="standing-markers">
          <span className="marker negative">-1000</span>
          <span className="marker neutral">0</span>
          <span className="marker positive">1000</span>
        </div>
      </div>

      <div className="standing-details">
        {standing.current_title_name && (
          <div className="current-title">
            <span className="title-badge" style={{ backgroundColor: standingColor }}>
              {standing.current_title_name}
            </span>
            {standing.current_title_description && (
              <span className="title-description">{standing.current_title_description}</span>
            )}
          </div>
        )}

        {nextTitle && (
          <div className="next-title">
            <h4>Next Title: {nextTitle.name}</h4>
            <p>{nextTitle.description}</p>
            <div className="title-progress">
              <span>Progress to next title:</span>
              <div className="progress">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.max(0, (standing.standing / nextTitle.standing_requirement) * 100)}%`,
                    backgroundColor: standingColor
                  }}
                ></div>
              </div>
              <span>{standing.standing} / {nextTitle.standing_requirement}</span>
            </div>

            {nextTitle.requires_tribute && (
              <div className="tribute-requirement">
                <div className="tribute-notice">
                  <i className="fas fa-crown"></i>
                  <span>This title requires a tribute submission!</span>
                </div>
                {nextTitle.tribute_status === 'pending' && (
                  <div className="tribute-status pending">
                    <i className="fas fa-clock"></i>
                    <span>Tribute pending review</span>
                  </div>
                )}
                {nextTitle.tribute_status === 'rejected' && (
                  <div className="tribute-status rejected">
                    <i className="fas fa-times"></i>
                    <span>Tribute rejected - you may submit again</span>
                  </div>
                )}
                {!nextTitle.tribute_status && standing.standing >= nextTitle.standing_requirement && (
                  <div className="tribute-status ready">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>Ready to submit tribute!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
