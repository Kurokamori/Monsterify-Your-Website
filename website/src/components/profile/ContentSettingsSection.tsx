import { useState } from 'react';
import type { ContentSettings } from '../../contexts/authContextDef';
import { Modal } from '../common/Modal';

interface ContentSettingsSectionProps {
  contentSettings: ContentSettings;
  onSettingsChange: (settings: ContentSettings) => void;
  loading: boolean;
}

const SUB_OPTIONS: { key: keyof Omit<ContentSettings, 'mature_enabled'>; label: string; description: string }[] = [
  { key: 'gore', label: 'Gore', description: 'Graphic depictions of blood and injuries' },
  { key: 'nsfw_light', label: 'Light NSFW', description: 'Suggestive themes, partial nudity' },
  { key: 'nsfw_heavy', label: 'Heavy NSFW', description: 'Explicit adult content' },
  { key: 'triggering', label: 'Potentially Triggering Content', description: 'Content that may be emotionally difficult' },
  { key: 'intense_violence', label: 'Intense Violence', description: 'Extreme violence depictions' },
];

const DEFAULT_CONTENT_SETTINGS: ContentSettings = {
  mature_enabled: false,
  gore: false,
  nsfw_light: false,
  nsfw_heavy: false,
  triggering: false,
  intense_violence: false,
};

export function ContentSettingsSection({
  contentSettings,
  onSettingsChange,
  loading,
}: ContentSettingsSectionProps) {
  const [showAgeModal, setShowAgeModal] = useState(false);

  const handleMatureToggle = () => {
    if (!contentSettings.mature_enabled) {
      setShowAgeModal(true);
    } else {
      onSettingsChange(DEFAULT_CONTENT_SETTINGS);
    }
  };

  const handleAgeConfirm = () => {
    setShowAgeModal(false);
    onSettingsChange({ ...contentSettings, mature_enabled: true });
  };

  const handleSubOptionToggle = (key: keyof ContentSettings) => {
    onSettingsChange({ ...contentSettings, [key]: !contentSettings[key] });
  };

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">
        <i className="fa-solid fa-shield-halved" /> Content Settings
      </h2>
      <p className="settings-section-desc">Control what types of mature content you can view across the site.</p>

      <div className="content-settings-container">
        <div className="content-toggle-row">
          <label className="content-toggle-label">
            <input
              type="checkbox"
              checked={contentSettings.mature_enabled}
              onChange={handleMatureToggle}
              disabled={loading}
            />
            <span className="content-toggle-text">Enable Mature Content</span>
          </label>
          <small className="content-toggle-description">
            When enabled, you can view submissions tagged with mature content warnings.
          </small>
        </div>

        {contentSettings.mature_enabled && (
          <div className="content-sub-options">
            <p className="content-sub-label">Select the types of mature content you want to enable:</p>
            {SUB_OPTIONS.map(({ key, label, description }) => (
              <label key={key} className="content-toggle-label">
                <input
                  type="checkbox"
                  checked={!!contentSettings[key]}
                  onChange={() => handleSubOptionToggle(key)}
                  disabled={loading}
                />
                <span className="content-toggle-text">{label}</span>
                <small className="content-toggle-description">{description}</small>
              </label>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        title="Age Verification"
        size="small"
        footer={
          <div className="container center gap-small">
            <button className="button secondary" onClick={() => setShowAgeModal(false)}>
              Cancel
            </button>
            <button className="button primary" onClick={handleAgeConfirm}>
              I Confirm
            </button>
          </div>
        }
      >
        <p>You must be 18 years or older to enable mature content.</p>
        <p>By confirming, you verify that you are at least 18 years of age.</p>
      </Modal>
    </div>
  );
}
