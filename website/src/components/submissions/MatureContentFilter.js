import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MatureContentFilter = ({
  showMature,
  onShowMatureChange,
  activeFilters,
  onFilterChange
}) => {
  const { currentUser } = useAuth();

  // Check if user has mature content enabled in their profile settings
  let contentSettings = currentUser?.content_settings || {};

  // Parse if it's a string
  if (typeof contentSettings === 'string') {
    try {
      contentSettings = JSON.parse(contentSettings);
    } catch (e) {
      contentSettings = {};
    }
  }

  const matureEnabled = contentSettings.mature_enabled;

  // Don't show filter if user hasn't enabled mature content in their profile
  if (!matureEnabled) {
    return null;
  }

  // Get which content types the user has enabled
  const enabledTypes = {
    gore: contentSettings.gore,
    nsfw_light: contentSettings.nsfw_light,
    nsfw_heavy: contentSettings.nsfw_heavy,
    triggering: contentSettings.triggering,
    intense_violence: contentSettings.intense_violence
  };

  // Check if any content type is enabled
  const hasAnyTypeEnabled = Object.values(enabledTypes).some(v => v);

  return (
    <div className="mature-filter-section">
      <label className="mature-filter-toggle">
        <input
          type="checkbox"
          checked={showMature}
          onChange={(e) => onShowMatureChange(e.target.checked)}
        />
        <span>Show Mature Content</span>
      </label>

      {showMature && hasAnyTypeEnabled && (
        <div className="mature-filter-options">
          <span className="mature-filter-label">Filter by type:</span>
          <div className="mature-filter-checkboxes">
            {enabledTypes.gore && (
              <label className="mature-filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.gore}
                  onChange={() => onFilterChange('gore', !activeFilters.gore)}
                />
                <span>Gore</span>
              </label>
            )}

            {enabledTypes.nsfw_light && (
              <label className="mature-filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.nsfw_light}
                  onChange={() => onFilterChange('nsfw_light', !activeFilters.nsfw_light)}
                />
                <span>Light NSFW</span>
              </label>
            )}

            {enabledTypes.nsfw_heavy && (
              <label className="mature-filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.nsfw_heavy}
                  onChange={() => onFilterChange('nsfw_heavy', !activeFilters.nsfw_heavy)}
                />
                <span>Heavy NSFW</span>
              </label>
            )}

            {enabledTypes.triggering && (
              <label className="mature-filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.triggering}
                  onChange={() => onFilterChange('triggering', !activeFilters.triggering)}
                />
                <span>Triggering</span>
              </label>
            )}

            {enabledTypes.intense_violence && (
              <label className="mature-filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.intense_violence}
                  onChange={() => onFilterChange('intense_violence', !activeFilters.intense_violence)}
                />
                <span>Intense Violence</span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatureContentFilter;
