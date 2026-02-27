import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import type { MonsterRollerSettings } from '../../contexts/authContextDef';
import { FormInput } from '../../components/common/FormInput';
import { DiscordLoginButton } from '../../components/auth/DiscordLoginButton';
import { ErrorModal } from '../../components/common/ErrorModal';
import { extractErrorMessage } from '../../utils/errorUtils';

interface FandomOption {
  key: keyof MonsterRollerSettings;
  label: string;
  icon: string;
}

const FANDOM_OPTIONS: FandomOption[] = [
  { key: 'pokemon', label: 'Pokemon', icon: '\uD83D\uDC3E' },
  { key: 'digimon', label: 'Digimon', icon: '\uD83E\uDD16' },
  { key: 'yokai', label: 'Yo-kai', icon: '\uD83D\uDC79' },
  { key: 'pals', label: 'Pals', icon: '\uD83E\uDD8A' },
  { key: 'nexomon', label: 'Nexomon', icon: '\uD83D\uDC32' },
  { key: 'fakemon', label: 'Fakemon', icon: '\u2B50' },
  { key: 'finalfantasy', label: 'Final Fantasy', icon: '\uD83D\uDD2E' },
  { key: 'monsterhunter', label: 'Monster Hunter', icon: '\uD83D\uDDE1\uFE0F' },
  { key: 'dragonquest', label: 'Dragon Quest', icon: '\u2694\uFE0F' },
];

const DEFAULT_SETTINGS: MonsterRollerSettings = {
  pokemon: true,
  digimon: true,
  yokai: true,
  pals: true,
  nexomon: true,
  fakemon: true,
  finalfantasy: true,
  monsterhunter: true,
  dragonquest: true,
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    discord_id: '',
    password: '',
    confirm_password: '',
  });
  const [monsterSettings, setMonsterSettings] = useState<MonsterRollerSettings>(DEFAULT_SETTINGS);
  const [localError, setLocalError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, error: authError, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Clear any stale auth errors from other pages on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMonsterToggle = (key: keyof MonsterRollerSettings) => {
    setMonsterSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      setLocalError('Username is required');
      return;
    }
    if (!formData.password) {
      setLocalError('Password is required');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      setLocalError('');
      setSubmitLoading(true);
      await register({
        username: formData.username,
        password: formData.password,
        display_name: formData.display_name || undefined,
        discord_id: formData.discord_id || undefined,
        monster_roller_settings: monsterSettings,
      });
    } catch (err) {
      setLocalError(extractErrorMessage(err, 'Failed to register. Please try again later.'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const displayError = localError || authError;

  const renderFandomToggles = (idPrefix: string) => (
    FANDOM_OPTIONS.map(({ key, label, icon }) => (
      <div key={key} className="fandom-toggle">
        <input
          type="checkbox"
          id={`${idPrefix}_${key}`}
          checked={!!monsterSettings[key]}
          onChange={() => handleMonsterToggle(key)}
          disabled={submitLoading}
        />
        <label htmlFor={`${idPrefix}_${key}`}>
          <span className="fandom-icon">{icon}</span>
          {label}
        </label>
      </div>
    ))
  );

  return (
    <div className="auth-container register-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h1>Register</h1>
        </div>

        <ErrorModal
          isOpen={!!displayError}
          onClose={() => { clearError(); setLocalError(''); }}
          message={displayError}
          title="Registration Error"
        />

        <form className="auth-form" onSubmit={handleSubmit}>
          <FormInput
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            disabled={submitLoading}
            required
            icon={<i className="fa-solid fa-user" />}
          />

          <FormInput
            label="Display Name"
            name="display_name"
            value={formData.display_name}
            onChange={handleChange}
            placeholder="How you want to be known (optional)"
            disabled={submitLoading}
            icon={<i className="fa-solid fa-id-card" />}
          />

          <FormInput
            label="Discord ID"
            name="discord_id"
            value={formData.discord_id}
            onChange={handleChange}
            placeholder="Your Discord ID (optional)"
            disabled={submitLoading}
            icon={<i className="fa-brands fa-discord" />}
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            disabled={submitLoading}
            required
            icon={<i className="fa-solid fa-lock" />}
          />

          <FormInput
            label="Confirm Password"
            name="confirm_password"
            type="password"
            value={formData.confirm_password}
            onChange={handleChange}
            placeholder="Confirm your password"
            disabled={submitLoading}
            required
            icon={<i className="fa-solid fa-lock" />}
          />

          <div className="mobile-fandom-section">
            <h3>Monster Roller Settings</h3>
            <p>Select which monster types you want to roll from. This can be changed later in your profile settings.</p>
            <div className="mobile-fandom-grid">
              {renderFandomToggles('mobile')}
            </div>
          </div>

          <button
            type="submit"
            className="button primary lg block"
            disabled={submitLoading}
          >
            {submitLoading ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Registering...</>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <DiscordLoginButton disabled={submitLoading} showNote />

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Login here</Link>
          </p>
        </div>
      </div>

      <div className="fandom-panel">
        <h2>Monster Roller Settings</h2>
        <p>Select which monster types you want to roll from. This can be changed later in your profile settings.</p>
        <div className="container vertical gap-small">
          {renderFandomToggles('reg')}
        </div>
      </div>
    </div>
  );
}
