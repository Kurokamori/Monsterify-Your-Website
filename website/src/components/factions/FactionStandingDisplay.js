import React from 'react';

const FactionStandingDisplay = ({ standing, faction, trainerId }) => {
  if (!standing) {
    return (
      <div className="standing-display">
        <div className="standing-header">
          <h3>Standing with {faction?.name}</h3>
          <div className="standing-value neutral">
            <span className="standing-number">0</span>
            <span className="standing-label">Neutral</span>
          </div>
        </div>
        <div className="standing-bar">
          <div className="standing-progress" style={{ width: '50%' }}></div>
        </div>
        <div className="standing-info">
          <p>No standing established with this faction yet.</p>
        </div>
      </div>
    );
  }

  const getStandingColor = (standingValue) => {
    if (standingValue >= 800) return '#4CAF50'; // Green for high positive
    if (standingValue >= 400) return '#8BC34A'; // Light green
    if (standingValue >= 200) return '#CDDC39'; // Yellow-green
    if (standingValue > 0) return '#FFC107'; // Yellow
    if (standingValue === 0) return '#9E9E9E'; // Gray for neutral
    if (standingValue >= -200) return '#FF9800'; // Orange
    if (standingValue >= -400) return '#FF5722'; // Red-orange
    if (standingValue >= -600) return '#F44336'; // Red
    if (standingValue >= -800) return '#E91E63'; // Pink-red
    return '#9C27B0'; // Purple for very negative
  };

  const getStandingLabel = (standingValue) => {
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

  const getProgressPercentage = (standingValue) => {
    // Convert -1000 to 1000 range to 0-100%
    return ((standingValue + 1000) / 2000) * 100;
  };

  const getNextTitleRequirement = (standingValue, availableTitles) => {
    if (!availableTitles) return null;
    
    // Find the next positive title that requires higher standing
    const nextTitle = availableTitles
      .filter(title => title.is_positive && title.standing_requirement > standingValue)
      .sort((a, b) => a.standing_requirement - b.standing_requirement)[0];
    
    return nextTitle;
  };

  const standingColor = getStandingColor(standing.standing);
  const standingLabel = getStandingLabel(standing.standing);
  const progressPercentage = getProgressPercentage(standing.standing);
  const nextTitle = getNextTitleRequirement(standing.standing, standing.availableTitles);

  return (
    <div className="standing-display">
      <div className="standing-header">
        <h3>Standing with {faction.name}</h3>
        <div className="standing-value" style={{ color: standingColor }}>
          <span className="standing-number">{standing.standing}</span>
          <span className="standing-label">{standingLabel}</span>
        </div>
      </div>

      <div className="standing-bar">
        <div 
          className="standing-progress" 
          style={{ 
            width: `${progressPercentage}%`,
            backgroundColor: standingColor
          }}
        ></div>
        <div className="standing-markers">
          <div className="marker negative" style={{ left: '0%' }}>-1000</div>
          <div className="marker neutral" style={{ left: '50%' }}>0</div>
          <div className="marker positive" style={{ left: '100%' }}>1000</div>
        </div>
      </div>

      <div className="standing-details">
        {standing.current_title_name && (
          <div className="current-title">
            <span className="title-badge" style={{ backgroundColor: standingColor }}>
              {standing.current_title_name}
            </span>
            <span className="title-description">{standing.current_title_description}</span>
          </div>
        )}

        {nextTitle && (
          <div className="next-title">
            <h4>Next Title: {nextTitle.name}</h4>
            <p>{nextTitle.description}</p>
            <div className="title-progress">
              <span>Progress to next title:</span>
              <div className="title-progress-bar">
                <div 
                  className="title-progress-fill"
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

export default FactionStandingDisplay;
