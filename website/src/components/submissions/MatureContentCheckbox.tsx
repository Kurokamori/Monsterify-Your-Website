import { MatureFilters } from './MatureContentFilter';

interface MatureContentCheckboxProps {
  isMature: boolean;
  contentRating: MatureFilters;
  onMatureChange: (isMature: boolean) => void;
  onRatingChange: (rating: MatureFilters) => void;
}

const RATING_OPTIONS: Array<{
  key: keyof MatureFilters;
  label: string;
  description: string;
}> = [
  { key: 'gore', label: 'Gore', description: 'Graphic depictions of blood and injuries' },
  { key: 'nsfw_light', label: 'Light NSFW', description: 'Suggestive themes, partial nudity' },
  { key: 'nsfw_heavy', label: 'Heavy NSFW', description: 'Explicit adult content' },
  { key: 'triggering', label: 'Potentially Triggering Content', description: 'Content that may be emotionally difficult' },
  { key: 'intense_violence', label: 'Intense Violence', description: 'Extreme violence depictions' }
];

export function MatureContentCheckbox({
  isMature,
  contentRating,
  onMatureChange,
  onRatingChange
}: MatureContentCheckboxProps) {
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

  const handleRatingToggle = (type: keyof MatureFilters) => {
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
          className="checkbox"
        />
        <span>Contains mature content</span>
      </label>
      <small className="mature-content-hint">
        Check this if your submission contains mature themes, NSFW content, gore,
        or other content that may not be suitable for all audiences.
      </small>

      {isMature && (
        <div className="mature-content-options">
          <p className="mature-content-options-label">
            Select all that apply:
          </p>

          {RATING_OPTIONS.map(({ key, label, description }) => (
            <label key={key} className="mature-content-option">
              <input
                type="checkbox"
                checked={contentRating[key]}
                onChange={() => handleRatingToggle(key)}
                className="checkbox"
              />
              <div className="mature-content-option-text">
                <span>{label}</span>
                <small>{description}</small>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
