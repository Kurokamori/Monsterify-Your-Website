import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const ProfileSettings = () => {
  const { currentUser, updateProfile, updateMonsterRollerSettings } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [discordId, setDiscordId] = useState('');

  // Monster roller settings
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

  // Load user data on component mount
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.display_name || '');
      setDiscordId(currentUser.discord_id || '');

      // Load monster roller settings from currentUser if available
      if (currentUser.monster_roller_settings) {
        let settings = currentUser.monster_roller_settings;
        
        // Parse if it's a string
        if (typeof settings === 'string') {
          try {
            settings = JSON.parse(settings);
          } catch (e) {
            console.error('Error parsing monster_roller_settings:', e);
            settings = {
              pokemon: true,
              digimon: true,
              yokai: true,
              pals: true,
              nexomon: true,
              fakemon: true,
              finalfantasy: true,
              monsterhunter: true
            };
          }
        }
        
        setMonsterSettings(settings);
      }
    }
  }, [currentUser]);

  // Handle monster type toggle
  const handleMonsterTypeToggle = (type) => {
    setMonsterSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Update profile
      const profileSuccess = await updateProfile({
        display_name: displayName,
        discord_id: discordId
      });

      // Update monster roller settings
      const settingsSuccess = await updateMonsterRollerSettings(monsterSettings);

      if (profileSuccess && settingsSuccess) {
        setSuccess('Profile settings updated successfully!');
      } else {
        setError('Some settings could not be updated. Please try again.');
      }

    } catch (err) {
      console.error('Error updating profile settings:', err);
      setError('Failed to update profile settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-settings">
      <h2>Profile Settings</h2>

      {error && <ErrorMessage message={error} />}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
            <small>This is the name that will be displayed to other users.</small>
          </div>

          <div className="form-group">
            <label htmlFor="discordId">Discord ID</label>
            <input
              type="text"
              id="discordId"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="Enter your Discord ID (e.g., username#1234)"
            />
            <small>Your Discord ID is used for notifications and community features.</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Monster Roller Settings</h3>
          <p>Select which monster types you want to enable for the monster roller:</p>

          <div className="monster-types-grid">
            <div className="monster-type-toggle">
              <input
                type="checkbox"
                id="pokemon"
                checked={monsterSettings.pokemon}
                onChange={() => handleMonsterTypeToggle('pokemon')}
              />
              <label htmlFor="pokemon">
                <span className="monster-type-icon">🐾</span>
                Pokémon
              </label>
            </div>

            <div className="monster-type-toggle">
              <input
                type="checkbox"
                id="digimon"
                checked={monsterSettings.digimon}
                onChange={() => handleMonsterTypeToggle('digimon')}
              />
              <label htmlFor="digimon">
                <span className="monster-type-icon">🤖</span>
                Digimon
              </label>
            </div>

            <div className="monster-type-toggle">
              <input
                type="checkbox"
                id="yokai"
                checked={monsterSettings.yokai}
                onChange={() => handleMonsterTypeToggle('yokai')}
              />
              <label htmlFor="yokai">
                <span className="monster-type-icon">👹</span>
                Yo-kai
              </label>
            </div>

            <div className="monster-type-toggle">
              <input
                type="checkbox"
                id="pals"
                checked={monsterSettings.pals}
                onChange={() => handleMonsterTypeToggle('pals')}
              />
              <label htmlFor="pals">
                <span className="monster-type-icon">🦊</span>
                Pals
              </label>
            </div>

            <div className="monster-type-toggle">
              <input
                type="checkbox"
                id="nexomon"
                checked={monsterSettings.nexomon}
                onChange={() => handleMonsterTypeToggle('nexomon')}
              />
              <label htmlFor="nexomon">
                <span className="monster-type-icon">🐲</span>
                Nexomon
              </label>
            </div>

            <div className="monster-type-toggle">
              <input
                type="checkbox"
                id="fakemon"
                checked={monsterSettings.fakemon}
                onChange={() => handleMonsterTypeToggle('fakemon')}
              />
              <label htmlFor="fakemon">
                <span className="monster-type-icon">⭐</span>
                Fakemon
              </label>
            </div>

            <div className="monster-type-toggle">
              <input
                type="checkbox"
                id="finalfantasy"
                checked={monsterSettings.finalfantasy}
                onChange={() => handleMonsterTypeToggle('finalfantasy')}
              />
              <label htmlFor="finalfantasy">
                <span className="monster-type-icon">🔮</span>
                Final Fantasy
              </label>
            </div>

            <div className="monster-type-toggle">
              <input
                type="checkbox"
                id="monsterhunter"
                checked={monsterSettings.monsterhunter}
                onChange={() => handleMonsterTypeToggle('monsterhunter')}
              />
              <label htmlFor="monsterhunter">
                <span className="monster-type-icon">🗡️</span>
                Monster Hunter
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
