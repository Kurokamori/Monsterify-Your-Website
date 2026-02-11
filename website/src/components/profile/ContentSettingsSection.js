import React, { useState } from 'react';
import AgeVerificationModal from '../common/AgeVerificationModal';

const ContentSettingsSection = ({
  contentSettings,
  onSettingsChange,
  loading
}) => {
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  const handleMatureToggle = () => {
    if (!contentSettings.mature_enabled) {
      // Show age verification modal when trying to enable
      setShowAgeVerification(true);
    } else {
      // Disable mature content - also disable all sub-options
      onSettingsChange({
        mature_enabled: false,
        gore: false,
        nsfw_light: false,
        nsfw_heavy: false,
        triggering: false,
        intense_violence: false
      });
    }
  };

  const handleAgeConfirm = () => {
    setShowAgeVerification(false);
    onSettingsChange({ ...contentSettings, mature_enabled: true });
  };

  const handleAgeCancel = () => {
    setShowAgeVerification(false);
  };

  const handleSubOptionToggle = (option) => {
    onSettingsChange({
      ...contentSettings,
      [option]: !contentSettings[option]
    });
  };

  return (
    <div className="form-section">
      <h3>Content Settings</h3>
      <p>Control what types of mature content you can view across the site.</p>

      <div className="content-settings-container">
        <div className="content-settings-main-toggle">
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
          <div className="content-settings-sub-options">
            <p className="content-sub-options-label">
              Select the types of mature content you want to enable:
            </p>

            <label className="content-toggle-label">
              <input
                type="checkbox"
                checked={contentSettings.gore}
                onChange={() => handleSubOptionToggle('gore')}
                disabled={loading}
              />
              <span className="content-toggle-text">Gore</span>
              <small className="content-toggle-description">Graphic depictions of blood and injuries</small>
            </label>

            <label className="content-toggle-label">
              <input
                type="checkbox"
                checked={contentSettings.nsfw_light}
                onChange={() => handleSubOptionToggle('nsfw_light')}
                disabled={loading}
              />
              <span className="content-toggle-text">Light NSFW</span>
              <small className="content-toggle-description">Suggestive themes, partial nudity</small>
            </label>

            <label className="content-toggle-label">
              <input
                type="checkbox"
                checked={contentSettings.nsfw_heavy}
                onChange={() => handleSubOptionToggle('nsfw_heavy')}
                disabled={loading}
              />
              <span className="content-toggle-text">Heavy NSFW</span>
              <small className="content-toggle-description">Explicit adult content</small>
            </label>

            <label className="content-toggle-label">
              <input
                type="checkbox"
                checked={contentSettings.triggering}
                onChange={() => handleSubOptionToggle('triggering')}
                disabled={loading}
              />
              <span className="content-toggle-text">Potentially Triggering Content</span>
              <small className="content-toggle-description">Content that may be emotionally difficult</small>
            </label>

            <label className="content-toggle-label">
              <input
                type="checkbox"
                checked={contentSettings.intense_violence}
                onChange={() => handleSubOptionToggle('intense_violence')}
                disabled={loading}
              />
              <span className="content-toggle-text">Intense Violence</span>
              <small className="content-toggle-description">Extreme violence depictions</small>
            </label>
          </div>
        )}
      </div>

      <AgeVerificationModal
        isOpen={showAgeVerification}
        onConfirm={handleAgeConfirm}
        onCancel={handleAgeCancel}
      />
    </div>
  );
};

export default ContentSettingsSection;
