import type { NotificationSettings } from '../../contexts/authContextDef';

interface NotificationSettingsSectionProps {
  notificationSettings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
  loading: boolean;
}

export function NotificationSettingsSection({
  notificationSettings,
  onSettingsChange,
  loading,
}: NotificationSettingsSectionProps) {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">
        <i className="fa-solid fa-bell" /> Notification Settings
      </h2>
      <p className="settings-section-desc">Control notification badges and alerts across the site.</p>

      <div className="content-settings-container">
        <div className="content-toggle-row">
          <label className="content-toggle-label">
            <input
              type="checkbox"
              checked={notificationSettings.chat_notifications}
              onChange={() =>
                onSettingsChange({
                  ...notificationSettings,
                  chat_notifications: !notificationSettings.chat_notifications,
                })
              }
              disabled={loading}
            />
            <span className="content-toggle-text">Show Chat Notification Badges</span>
          </label>
          <small className="content-toggle-description">
            Display a badge on your user menu when you have unread chat messages.
          </small>
        </div>
      </div>
    </div>
  );
}
