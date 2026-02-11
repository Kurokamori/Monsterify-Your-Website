import React from 'react';

const MatureContentCheckbox = ({
  isMature,
  contentRating,
  onMatureChange,
  onRatingChange
}) => {
  const handleMatureToggle = () => {
    if (isMature) {
      // Clear all ratings when unchecking mature
      onMatureChange(false);
      onRatingChange({
        gore: false,
        nsfw_light: false,
        nsfw_heavy: false,
        triggering: false,
        intense_violence: false
      });
    } else {
      onMatureChange(true);
    }
  };

  const handleRatingToggle = (type) => {
    onRatingChange({
      ...contentRating,
      [type]: !contentRating[type]
    });
  };

  return (
    <div className="mature-content-section">
      <label className="mature-content-main-checkbox">
        <input
          type="checkbox"
          checked={isMature}
          onChange={handleMatureToggle}
        />
        <span>Contains mature content</span>
      </label>
      <small className="mature-content-hint">
        Check this if your submission contains mature themes, NSFW content, gore, or other content that may not be suitable for all audiences.
      </small>

      {isMature && (
        <div className="mature-content-options">
          <p className="mature-content-options-label">
            Select all that apply:
          </p>

          <label className="mature-content-option">
            <input
              type="checkbox"
              checked={contentRating.gore}
              onChange={() => handleRatingToggle('gore')}
            />
            <span>Gore</span>
            <small>Graphic depictions of blood and injuries</small>
          </label>

          <label className="mature-content-option">
            <input
              type="checkbox"
              checked={contentRating.nsfw_light}
              onChange={() => handleRatingToggle('nsfw_light')}
            />
            <span>Light NSFW</span>
            <small>Suggestive themes, partial nudity</small>
          </label>

          <label className="mature-content-option">
            <input
              type="checkbox"
              checked={contentRating.nsfw_heavy}
              onChange={() => handleRatingToggle('nsfw_heavy')}
            />
            <span>Heavy NSFW</span>
            <small>Explicit adult content</small>
          </label>

          <label className="mature-content-option">
            <input
              type="checkbox"
              checked={contentRating.triggering}
              onChange={() => handleRatingToggle('triggering')}
            />
            <span>Potentially Triggering Content</span>
            <small>Content that may be emotionally difficult</small>
          </label>

          <label className="mature-content-option">
            <input
              type="checkbox"
              checked={contentRating.intense_violence}
              onChange={() => handleRatingToggle('intense_violence')}
            />
            <span>Intense Violence</span>
            <small>Extreme violence depictions</small>
          </label>
        </div>
      )}
    </div>
  );
};

export default MatureContentCheckbox;
