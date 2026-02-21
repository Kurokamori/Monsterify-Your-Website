import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import type { MonsterRollerSettings, ContentSettings } from '../../contexts/authContextDef';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import { FormInput } from '../../components/common/FormInput';
import { Modal } from '../../components/common/Modal';
import { ErrorModal } from '../../components/common/ErrorModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SuccessMessage } from '../../components/common/SuccessMessage';
import { ContentSettingsSection } from '../../components/profile/ContentSettingsSection';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// --- Fandom options (shared pattern with RegisterPage) ---

interface FandomOption {
  key: keyof MonsterRollerSettings;
  label: string;
  icon: string;
}

const FANDOM_OPTIONS: FandomOption[] = [
  { key: 'pokemon', label: 'Pokemon', icon: '🐾' },
  { key: 'digimon', label: 'Digimon', icon: '🤖' },
  { key: 'yokai', label: 'Yo-kai', icon: '👹' },
  { key: 'pals', label: 'Pals', icon: '🦊' },
  { key: 'nexomon', label: 'Nexomon', icon: '🐲' },
  { key: 'fakemon', label: 'Fakemon', icon: '⭐' },
  { key: 'finalfantasy', label: 'Final Fantasy', icon: '🔮' },
  { key: 'monsterhunter', label: 'Monster Hunter', icon: '🗡️' },
];

const DEFAULT_MONSTER_SETTINGS: MonsterRollerSettings = {
  pokemon: true,
  digimon: true,
  yokai: true,
  pals: true,
  nexomon: true,
  fakemon: true,
  finalfantasy: true,
  monsterhunter: true,
};

const DEFAULT_CONTENT_SETTINGS: ContentSettings = {
  mature_enabled: false,
  gore: false,
  nsfw_light: false,
  nsfw_heavy: false,
  triggering: false,
  intense_violence: false,
};

// --- Helpers ---

function parseSettings<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; }
    catch { return fallback; }
  }
  return raw as T;
}

// --- Component ---

export default function ProfilePage() {
  useDocumentTitle('Profile Settings');

  const {
    currentUser,
    isAuthenticated,
    loading: authLoading,
    logout,
    updateProfile,
    updateMonsterRollerSettings,
    updateContentSettings,
    error: authError,
    clearError,
  } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Clear any stale auth errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [monsterSettings, setMonsterSettings] = useState<MonsterRollerSettings>(DEFAULT_MONSTER_SETTINGS);
  const [contentSettings, setContentSettings] = useState<ContentSettings>(DEFAULT_CONTENT_SETTINGS);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // Handle Discord link callback via query params
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const linkedDiscordId = params.get('discord_id');
    const linkedUsername = params.get('discord_username');
    const discordError = params.get('discord_error');

    if (!linkedDiscordId && !discordError) return;

    // Clean the URL
    navigate('/profile', { replace: true });

    if (discordError) {
      setError(`Discord link failed: ${discordError}`);
      return;
    }

    if (linkedDiscordId) {
      setDiscordId(linkedDiscordId);
      updateProfile({ discord_id: linkedDiscordId }).then(ok => {
        if (ok) {
          setSuccess(`Discord account linked! (${linkedUsername ?? linkedDiscordId})`);
        } else {
          setError('Discord ID retrieved but failed to save. Please save manually.');
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleLinkDiscord = () => {
    window.location.href = `${API_URL}/auth/discord/link`;
  };

  // Load user data
  useEffect(() => {
    if (!currentUser) return;
    setDisplayName(currentUser.display_name || '');
    setDiscordId(currentUser.discord_id || '');
    setMonsterSettings(parseSettings(currentUser.monster_roller_settings, DEFAULT_MONSTER_SETTINGS));
    setContentSettings(parseSettings(currentUser.content_settings, DEFAULT_CONTENT_SETTINGS));
  }, [currentUser]);

  // Redirect if not authenticated (wait for auth to finish loading first)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleMonsterToggle = (key: keyof MonsterRollerSettings) => {
    setMonsterSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const [profileOk, settingsOk, contentOk] = await Promise.all([
        updateProfile({ display_name: displayName, discord_id: discordId }),
        updateMonsterRollerSettings(monsterSettings),
        updateContentSettings(contentSettings),
      ]);

      if (profileOk && settingsOk && contentOk) {
        setSuccess('Profile settings updated successfully!');
      } else {
        setError(authError || 'Some settings could not be updated. Please try again.');
      }
    } catch {
      setError(authError || 'Failed to update profile settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      logout();
      navigate('/login');
    } catch {
      setError('Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  if (!currentUser) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div>
          <h1>Profile Settings</h1>
          <p className="profile-username">
            {currentUser.display_name || currentUser.username}
          </p>
        </div>
        <button
          className="button danger no-flex"
          onClick={() => setLogoutModalOpen(true)}
        >
          <i className="fa-solid fa-right-from-bracket" /> Logout
        </button>
      </div>

      {/* Messages */}
      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error ?? undefined}
        title="Profile Error"
      />
      {success && (
        <SuccessMessage message={success} onClose={() => setSuccess(null)} />
      )}

      {/* Settings Form */}
      <form className="profile-form" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="settings-section">
          <h2 className="settings-section-title">
            <i className="fa-solid fa-user" /> Basic Information
          </h2>

          <FormInput
            label="Display Name"
            name="profile_display_name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            disabled={saving}
            helpText="This is the name that will be displayed to other users."
            icon={<i className="fa-solid fa-id-card" />}
          />

          <div className="flex flex-col">
            <h3>Discord ID</h3>
            <div className="flex flex-col">
            <FormInput
              name="profile_discord_id"
              value={discordId}
              onChange={e => setDiscordId(e.target.value)}
              placeholder="Enter your Discord ID (e.g., 123412456789)"
              disabled={saving}
              icon={<i className="fa-brands fa-discord" />}
            />
            <div className="p-md flex flex-col gap-xs">
            <div className="form-tooltip">
              <p>Discord ID is used as the 'source of truth' for all authetication, and is thus needed for you to play the game.</p>
            </div>
            <button
              type="button"
              className="button discord-link-btn w-full"
              onClick={handleLinkDiscord}
              disabled={saving}
              title="Authenticate with Discord to auto-fill your ID"
            >
              <i className="fa-brands fa-discord" /> Link Discord
            </button>
            </div>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="settings-section">
          <h2 className="settings-section-title">
            <i className="fa-solid fa-palette" /> Theme
          </h2>
          <p className="settings-section-desc">Choose how the site looks:</p>

          <div className="theme-options">
            {THEMES.map(t => (
              <label
                key={t.id}
                className={`theme-option${theme === t.id ? ' active' : ''}`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.id}
                  checked={theme === t.id}
                  onChange={() => setTheme(t.id)}
                />
                <span className="theme-option-label">{t.label}</span>
                <small className="theme-option-desc">{t.description}</small>
              </label>
            ))}
          </div>
        </div>

        {/* Monster Roller Settings */}
        <div className="settings-section">
          <h2 className="settings-section-title">
            <i className="fa-solid fa-dice" /> Monster Roller Settings
          </h2>
          <p className="settings-section-desc">
            Select which monster types you want to enable for the monster roller:
          </p>

          <div className="fandom-grid">
            {FANDOM_OPTIONS.map(({ key, label, icon }) => (
              <div key={key} className="fandom-toggle">
                <input
                  type="checkbox"
                  id={`profile_${key}`}
                  checked={!!monsterSettings[key]}
                  onChange={() => handleMonsterToggle(key)}
                  disabled={saving}
                />
                <label htmlFor={`profile_${key}`}>
                  <span className="fandom-icon">{icon}</span>
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Content Settings */}
        <ContentSettingsSection
          contentSettings={contentSettings}
          onSettingsChange={setContentSettings}
          loading={saving}
        />

        {/* Save */}
        <div className="profile-form-actions">
          <button
            type="submit"
            className="button primary lg"
            disabled={saving}
          >
            {saving ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fa-solid fa-save" /> Save Changes</>
            )}
          </button>
        </div>
      </form>

      {/* Logout Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        size="small"
        footer={
          <div className="container center gap-small">
            <button className="button secondary" onClick={() => setLogoutModalOpen(false)}>
              Cancel
            </button>
            <button
              className="button danger"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Logging out...</>
              ) : (
                'Logout'
              )}
            </button>
          </div>
        }
      >
        <p>Are you sure you want to log out?</p>
      </Modal>
    </div>
  );
}
