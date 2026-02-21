export interface MatureFilters {
  gore: boolean;
  nsfw_light: boolean;
  nsfw_heavy: boolean;
  triggering: boolean;
  intense_violence: boolean;
}

export interface ContentSettings {
  mature_enabled?: boolean;
  gore?: boolean;
  nsfw_light?: boolean;
  nsfw_heavy?: boolean;
  triggering?: boolean;
  intense_violence?: boolean;
}

interface MatureContentFilterProps {
  showMature: boolean;
  onShowMatureChange: (value: boolean) => void;
  activeFilters: MatureFilters;
  onFilterChange: (type: keyof MatureFilters, value: boolean) => void;
  userSettings?: ContentSettings | string | null;
}

const FILTER_LABELS: Record<keyof MatureFilters, string> = {
  gore: 'Gore',
  nsfw_light: 'Light NSFW',
  nsfw_heavy: 'Heavy NSFW',
  triggering: 'Triggering',
  intense_violence: 'Intense Violence'
};

export function MatureContentFilter({
  showMature,
  onShowMatureChange,
  activeFilters,
  onFilterChange,
  userSettings
}: MatureContentFilterProps) {
  // Parse content settings if it's a string
  let contentSettings: ContentSettings = {};
  if (typeof userSettings === 'string') {
    try {
      contentSettings = JSON.parse(userSettings);
    } catch {
      contentSettings = {};
    }
  } else if (userSettings) {
    contentSettings = userSettings;
  }

  // If userSettings provided and mature not enabled, don't show filter
  if (userSettings !== undefined && !contentSettings.mature_enabled) {
    return null;
  }

  // Get which content types the user has enabled (if settings provided)
  const enabledTypes: MatureFilters = userSettings !== undefined ? {
    gore: contentSettings.gore ?? false,
    nsfw_light: contentSettings.nsfw_light ?? false,
    nsfw_heavy: contentSettings.nsfw_heavy ?? false,
    triggering: contentSettings.triggering ?? false,
    intense_violence: contentSettings.intense_violence ?? false
  } : {
    // If no settings provided, show all filters
    gore: true,
    nsfw_light: true,
    nsfw_heavy: true,
    triggering: true,
    intense_violence: true
  };

  // Check if any content type is enabled
  const hasAnyTypeEnabled = Object.values(enabledTypes).some(v => v);

  return (
    <div className="mature-filter-section">
      <label className="mature-filter-toggle">
        <input
          type="checkbox"
          className="checkbox"
          checked={showMature}
          onChange={(e) => onShowMatureChange(e.target.checked)}
        />
        <span>Show Mature Content</span>
      </label>

      {showMature && hasAnyTypeEnabled && (
        <div className="mature-filter-options">
          <span className="mature-filter-label">Filter by type:</span>
          <div className="mature-filter-checkboxes">
            {(Object.keys(activeFilters) as Array<keyof MatureFilters>).map(filterKey => {
              // Only show filter if enabled in user settings (or no settings provided)
              if (!enabledTypes[filterKey]) return null;

              return (
                <label key={filterKey} className="mature-filter-option">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={activeFilters[filterKey]}
                    onChange={(e) => onFilterChange(filterKey, e.target.checked)}
                  />
                  <span>{FILTER_LABELS[filterKey]}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
