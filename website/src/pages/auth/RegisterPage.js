import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DiscordLoginButton from '../../components/auth/DiscordLoginButton';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    discord_id: '',
    password: '',
    confirm_password: ''
  });
  const [monsterSettings, setMonsterSettings] = useState({
    pokemon: true,
    digimon: true,
    yokai: true,
    pals: true,
    nexomon: true,
    fakemon: true,
    finalfantasy: true,
    monsterhunter: true
  });
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, error: authError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMonsterTypeToggle = (type) => {
    setMonsterSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
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
      setLoading(true);

      const success = await register({
        ...formData,
        monster_roller_settings: monsterSettings
      });

      if (success) {
        // Registration successful, navigation will be handled by useEffect
        // when isAuthenticated becomes true
        console.log('Registration successful');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setLocalError('Failed to register. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container register-container">
      <div className="image-upload">
        <div className="auth-card register-card">
          <div className="auth-header">
            <h1>Register</h1>
          </div>

          {(localError || authError) && (
            <div className="auth-error">
              <i className="fas fa-exclamation-circle"></i> {localError || authError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="container vertical gap-md">
              <label htmlFor="username">Username*</label>
              <div className="form-input">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="container vertical gap-md">
              <label htmlFor="display_name">Display Name</label>
              <div className="form-input">
                <i className="fas fa-id-card"></i>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="How you want to be known (optional)"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="container vertical gap-md">
              <label htmlFor="discord_id">Discord ID</label>
              <div className="form-input">
                <i className="fab fa-discord"></i>
                <input
                  type="text"
                  id="discord_id"
                  name="discord_id"
                  value={formData.discord_id}
                  onChange={handleChange}
                  placeholder="Your Discord ID (optional)"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="container vertical gap-md">
              <label htmlFor="password">Password*</label>
              <div className="form-input">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="container vertical gap-md">
              <label htmlFor="confirm_password">Confirm Password*</label>
              <div className="form-input">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Mobile-only fandom section */}
            <div className="mobile-fandom-section">
              <h3>Monster Roller Settings</h3>
              <p>Select which monster types you want to roll from. This can be changed later in your profile settings.</p>
              <div className="mobile-fandom-grid">
                <div className="fandom-toggle">
                  <input
                    type="checkbox"
                    id="mobile_pokemon"
                    checked={monsterSettings.pokemon}
                    onChange={() => handleMonsterTypeToggle('pokemon')}
                    disabled={loading}
                  />
                  <label htmlFor="mobile_pokemon">
                    <span className="fandom-icon">🐾</span>
                    Pokemon
                  </label>
                </div>
                <div className="fandom-toggle">
                  <input
                    type="checkbox"
                    id="mobile_digimon"
                    checked={monsterSettings.digimon}
                    onChange={() => handleMonsterTypeToggle('digimon')}
                    disabled={loading}
                  />
                  <label htmlFor="mobile_digimon">
                    <span className="fandom-icon">🤖</span>
                    Digimon
                  </label>
                </div>
                <div className="fandom-toggle">
                  <input
                    type="checkbox"
                    id="mobile_yokai"
                    checked={monsterSettings.yokai}
                    onChange={() => handleMonsterTypeToggle('yokai')}
                    disabled={loading}
                  />
                  <label htmlFor="mobile_yokai">
                    <span className="fandom-icon">👹</span>
                    Yo-kai
                  </label>
                </div>
                <div className="fandom-toggle">
                  <input
                    type="checkbox"
                    id="mobile_pals"
                    checked={monsterSettings.pals}
                    onChange={() => handleMonsterTypeToggle('pals')}
                    disabled={loading}
                  />
                  <label htmlFor="mobile_pals">
                    <span className="fandom-icon">🦊</span>
                    Pals
                  </label>
                </div>
                <div className="fandom-toggle">
                  <input
                    type="checkbox"
                    id="mobile_nexomon"
                    checked={monsterSettings.nexomon}
                    onChange={() => handleMonsterTypeToggle('nexomon')}
                    disabled={loading}
                  />
                  <label htmlFor="mobile_nexomon">
                    <span className="fandom-icon">🐲</span>
                    Nexomon
                  </label>
                </div>
                <div className="fandom-toggle">
                  <input
                    type="checkbox"
                    id="mobile_fakemon"
                    checked={monsterSettings.fakemon}
                    onChange={() => handleMonsterTypeToggle('fakemon')}
                    disabled={loading}
                  />
                  <label htmlFor="mobile_fakemon">
                    <span className="fandom-icon">⭐</span>
                    Fakemon
                  </label>
                </div>
                <div className="fandom-toggle">
                  <input
                    type="checkbox"
                    id="mobile_finalfantasy"
                    checked={monsterSettings.finalfantasy}
                    onChange={() => handleMonsterTypeToggle('finalfantasy')}
                    disabled={loading}
                  />
                  <label htmlFor="mobile_finalfantasy">
                    <span className="fandom-icon">🔮</span>
                    Final Fantasy
                  </label>
                </div>
                <div className="fandom-toggle">
                  <input
                    type="checkbox"
                    id="mobile_monsterhunter"
                    checked={monsterSettings.monsterhunter}
                    onChange={() => handleMonsterTypeToggle('monsterhunter')}
                    disabled={loading}
                  />
                  <label htmlFor="mobile_monsterhunter">
                    <span className="fandom-icon">🗡️</span>
                    Monster Hunter
                  </label>
                </div>
              </div>
            </div>

            <div className="container vertical gap-md">
              <button
                type="submit"
                className="button primary lg block"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Registering...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </form>

          <DiscordLoginButton disabled={loading} showNote={true} />

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Login here
              </Link>
            </p>
          </div>
        </div>

        <div className="fandom-panel">
          <h2>Monster Roller Settings</h2>
          <p>Select which monster types you want to roll from. This can be changed later in your profile settings.</p>

          <div className="container vertical gap-md">
            <div className="fandom-toggle">
              <input
                type="checkbox"
                id="reg_pokemon"
                checked={monsterSettings.pokemon}
                onChange={() => handleMonsterTypeToggle('pokemon')}
                disabled={loading}
              />
              <label htmlFor="reg_pokemon">
                <span className="fandom-icon">🐾</span>
                Pokemon
              </label>
            </div>

            <div className="fandom-toggle">
              <input
                type="checkbox"
                id="reg_digimon"
                checked={monsterSettings.digimon}
                onChange={() => handleMonsterTypeToggle('digimon')}
                disabled={loading}
              />
              <label htmlFor="reg_digimon">
                <span className="fandom-icon">🤖</span>
                Digimon
              </label>
            </div>

            <div className="fandom-toggle">
              <input
                type="checkbox"
                id="reg_yokai"
                checked={monsterSettings.yokai}
                onChange={() => handleMonsterTypeToggle('yokai')}
                disabled={loading}
              />
              <label htmlFor="reg_yokai">
                <span className="fandom-icon">👹</span>
                Yo-kai
              </label>
            </div>

            <div className="fandom-toggle">
              <input
                type="checkbox"
                id="reg_pals"
                checked={monsterSettings.pals}
                onChange={() => handleMonsterTypeToggle('pals')}
                disabled={loading}
              />
              <label htmlFor="reg_pals">
                <span className="fandom-icon">🦊</span>
                Pals
              </label>
            </div>

            <div className="fandom-toggle">
              <input
                type="checkbox"
                id="reg_nexomon"
                checked={monsterSettings.nexomon}
                onChange={() => handleMonsterTypeToggle('nexomon')}
                disabled={loading}
              />
              <label htmlFor="reg_nexomon">
                <span className="fandom-icon">🐲</span>
                Nexomon
              </label>
            </div>

            <div className="fandom-toggle">
              <input
                type="checkbox"
                id="reg_fakemon"
                checked={monsterSettings.fakemon}
                onChange={() => handleMonsterTypeToggle('fakemon')}
                disabled={loading}
              />
              <label htmlFor="reg_fakemon">
                <span className="fandom-icon">⭐</span>
                Fakemon
              </label>
            </div>

            <div className="fandom-toggle">
              <input
                type="checkbox"
                id="reg_finalfantasy"
                checked={monsterSettings.finalfantasy}
                onChange={() => handleMonsterTypeToggle('finalfantasy')}
                disabled={loading}
              />
              <label htmlFor="reg_finalfantasy">
                <span className="fandom-icon">🔮</span>
                Final Fantasy
              </label>
            </div>

            <div className="fandom-toggle">
              <input
                type="checkbox"
                id="reg_monsterhunter"
                checked={monsterSettings.monsterhunter}
                onChange={() => handleMonsterTypeToggle('monsterhunter')}
                disabled={loading}
              />
              <label htmlFor="reg_monsterhunter">
                <span className="fandom-icon">🗡️</span>
                Monster Hunter
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
