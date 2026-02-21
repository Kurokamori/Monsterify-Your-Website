import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage, TypeBadge, BadgeGroup } from '../common';
import api from '../../services/api';

interface Trainer {
  id: number | string;
  name: string;
  level?: number;
}

interface MonsterStats {
  hp: number;
  attack: number;
  defense: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
}

interface RolledMonster {
  id?: number | string;
  name: string;
  species?: string;
  image_path?: string;
  types: string[];
  description?: string;
  stats: MonsterStats;
}

interface CustomRollParams {
  minTypes?: number;
  maxTypes?: number;
  rarityBoost?: number;
  legendaryEnabled?: boolean;
  mythicalEnabled?: boolean;
}

interface MonsterRollerProps {
  context?: 'adoption' | 'starter' | 'event' | 'item' | 'breeding';
  onMonsterSelected?: (monster: RolledMonster) => void;
  trainerId?: number | string;
}

const DEFAULT_MAX_ROLLS = 3;

export const MonsterRoller = ({
  context = 'adoption',
  onMonsterSelected,
  trainerId
}: MonsterRollerProps) => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolledMonster, setRolledMonster] = useState<RolledMonster | null>(null);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>(trainerId?.toString() || '');
  const [rollCount, setRollCount] = useState(0);
  const [maxRolls, setMaxRolls] = useState(DEFAULT_MAX_ROLLS);
  const [customRollParams, setCustomRollParams] = useState<CustomRollParams>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const [sourcesResponse, settingsResponse] = await Promise.all([
          api.get('/monsters/sources'),
          api.get('/users/roller-settings')
        ]);

        const sources = sourcesResponse.data.sources || [];
        setAvailableSources(sources);

        const settings = settingsResponse.data.settings || {};
        setSelectedSources(settings.enabledTypes || []);
        if (settings.maxRolls) {
          setMaxRolls(settings.maxRolls);
        }

        if (!trainerId) {
          const trainersResponse = await api.get('/trainers/user');
          const trainers = trainersResponse.data.trainers || [];
          setUserTrainers(trainers);

          if (trainers.length > 0) {
            setSelectedTrainer(trainers[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load roller data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [trainerId]);

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => {
      if (prev.includes(source)) {
        return prev.filter(s => s !== source);
      } else {
        return [...prev, source];
      }
    });
  };

  const handleTrainerChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrainer(e.target.value);
  };

  const handleAdvancedOptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCustomRollParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value) || 0
    }));
  };

  const buildRollParams = () => {
    const baseParams: Record<string, unknown> = {
      sources: selectedSources,
      trainerId: parseInt(selectedTrainer),
      userId: currentUser?.id
    };

    switch (context) {
      case 'starter':
        baseParams.rarityBoost = 0;
        baseParams.legendaryEnabled = false;
        baseParams.mythicalEnabled = false;
        break;
      case 'adoption':
        baseParams.rarityBoost = 1;
        break;
      case 'event':
        baseParams.rarityBoost = 2;
        baseParams.legendaryEnabled = true;
        break;
      case 'item':
        baseParams.rarityBoost = 3;
        baseParams.legendaryEnabled = true;
        baseParams.mythicalEnabled = true;
        break;
      case 'breeding':
        baseParams.rarityBoost = 1;
        break;
    }

    return { ...baseParams, ...customRollParams };
  };

  const handleRoll = async () => {
    if (rollCount >= maxRolls) {
      setError(`You've reached the maximum number of rolls (${maxRolls}). Please adopt this monster or try again later.`);
      return;
    }

    if (!selectedTrainer) {
      setError('Please select a trainer.');
      return;
    }

    if (selectedSources.length === 0) {
      setError('Please select at least one monster source.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rollParams = buildRollParams();
      const response = await api.post('/monsters/roll', rollParams);

      if (response.data.success) {
        setRolledMonster(response.data.monster);
        setRollCount(prev => prev + 1);
      } else {
        setError(response.data.message || 'Failed to roll monster.');
      }
    } catch (err: unknown) {
      console.error('Error rolling monster:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to roll monster. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdopt = async () => {
    if (!rolledMonster || !selectedTrainer) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/monsters/initialize', {
        trainerId: parseInt(selectedTrainer),
        monster: rolledMonster,
        context
      });

      if (response.data.success && onMonsterSelected) {
        onMonsterSelected(response.data.monster);
      }

      setRolledMonster(null);
      setRollCount(0);
    } catch (err: unknown) {
      console.error('Error adopting monster:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to adopt monster. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRolledMonster(null);
    setRollCount(0);
    setError(null);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/images/default_mon.png';
  };

  if (loading && !rolledMonster) {
    return <LoadingSpinner message="Loading monster roller..." />;
  }

  return (
    <div className="monster-roller">
      <div className="monster-roller__header">
        <h2>Monster Roller</h2>
        <p>Roll a random monster based on your preferences.</p>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {!rolledMonster ? (
        <div className="monster-roller__form">
          {!trainerId && userTrainers.length > 0 && (
            <div className="monster-roller__trainer-select">
              <label>Select Trainer</label>
              <select
                value={selectedTrainer}
                onChange={handleTrainerChange}
              >
                {userTrainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} {trainer.level && `(Lv. ${trainer.level})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="monster-roller__sources">
            <span className="monster-roller__sources-label">Monster Sources</span>
            <div className="monster-roller__sources-grid">
              {availableSources.map(source => (
                <div
                  key={source}
                  className={[
                    'monster-roller__source',
                    selectedSources.includes(source) && 'monster-roller__source--selected'
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleSourceToggle(source)}
                >
                  <span className="monster-roller__source-name">{source}</span>
                  <span className="monster-roller__source-status">
                    {selectedSources.includes(source) ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            className={[
              'monster-roller__advanced-toggle',
              showAdvancedOptions && 'monster-roller__advanced-toggle--open'
            ].filter(Boolean).join(' ')}
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            <i className={`fas fa-chevron-${showAdvancedOptions ? 'up' : 'down'}`}></i>
            {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>

          {showAdvancedOptions && (
            <div className="monster-roller__advanced-options">
              <div className="monster-roller__option-row">
                <div className="monster-roller__option">
                  <label>Min Types</label>
                  <input
                    type="number"
                    name="minTypes"
                    min={1}
                    max={5}
                    value={customRollParams.minTypes || 1}
                    onChange={handleAdvancedOptionChange}
                  />
                </div>
                <div className="monster-roller__option">
                  <label>Max Types</label>
                  <input
                    type="number"
                    name="maxTypes"
                    min={1}
                    max={5}
                    value={customRollParams.maxTypes || 2}
                    onChange={handleAdvancedOptionChange}
                  />
                </div>
              </div>

              <div className="monster-roller__option-row">
                <div className="monster-roller__option">
                  <label>Rarity Boost</label>
                  <input
                    type="number"
                    name="rarityBoost"
                    min={0}
                    max={5}
                    value={customRollParams.rarityBoost || 0}
                    onChange={handleAdvancedOptionChange}
                  />
                </div>
              </div>

              <div className="monster-roller__option-row">
                <div className="monster-roller__option monster-roller__option--checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="legendaryEnabled"
                      checked={customRollParams.legendaryEnabled || false}
                      onChange={handleAdvancedOptionChange}
                    />
                    Enable Legendary
                  </label>
                </div>
                <div className="monster-roller__option monster-roller__option--checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="mythicalEnabled"
                      checked={customRollParams.mythicalEnabled || false}
                      onChange={handleAdvancedOptionChange}
                    />
                    Enable Mythical
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="monster-roller__actions">
            <button
              className="button primary lg"
              onClick={handleRoll}
              disabled={loading || selectedSources.length === 0 || !selectedTrainer}
            >
              {loading ? 'Rolling...' : 'Roll Monster'}
            </button>
            <div className="monster-roller__roll-count">
              Rolls: <span className="monster-roller__roll-count-current">{rollCount}</span>/{maxRolls}
            </div>
          </div>
        </div>
      ) : (
        <div className="monster-roller__result">
          <div className="monster-roller__monster">
            <div className="monster-roller__monster-image">
              <img
                src={rolledMonster.image_path || '/images/default_mon.png'}
                alt={rolledMonster.name}
                onError={handleImageError}
              />
            </div>
            <div className="monster-roller__monster-info">
              <h3 className="monster-roller__monster-name">{rolledMonster.name}</h3>
              {rolledMonster.species && (
                <div className="monster-roller__monster-species">{rolledMonster.species}</div>
              )}
              <BadgeGroup className="monster-roller__monster-types" gap="xs">
                {rolledMonster.types.map((type, index) => (
                  <TypeBadge key={index} type={type} size="sm" />
                ))}
              </BadgeGroup>
              {rolledMonster.description && (
                <p className="monster-roller__monster-description">{rolledMonster.description}</p>
              )}
              <div className="monster-roller__stats">
                <div className="monster-roller__stat-group">
                  <div className="monster-roller__stat">
                    <span className="monster-roller__stat-label">HP</span>
                    <span className="monster-roller__stat-value">{rolledMonster.stats.hp}</span>
                  </div>
                  <div className="monster-roller__stat">
                    <span className="monster-roller__stat-label">Attack</span>
                    <span className="monster-roller__stat-value">{rolledMonster.stats.attack}</span>
                  </div>
                  <div className="monster-roller__stat">
                    <span className="monster-roller__stat-label">Defense</span>
                    <span className="monster-roller__stat-value">{rolledMonster.stats.defense}</span>
                  </div>
                </div>
                <div className="monster-roller__stat-group">
                  <div className="monster-roller__stat">
                    <span className="monster-roller__stat-label">Sp. Attack</span>
                    <span className="monster-roller__stat-value">{rolledMonster.stats.sp_attack}</span>
                  </div>
                  <div className="monster-roller__stat">
                    <span className="monster-roller__stat-label">Sp. Defense</span>
                    <span className="monster-roller__stat-value">{rolledMonster.stats.sp_defense}</span>
                  </div>
                  <div className="monster-roller__stat">
                    <span className="monster-roller__stat-label">Speed</span>
                    <span className="monster-roller__stat-value">{rolledMonster.stats.speed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="monster-roller__result-actions">
            <button
              className="button success"
              onClick={handleAdopt}
              disabled={loading}
            >
              {loading ? 'Adopting...' : 'Adopt This Monster'}
            </button>

            {rollCount < maxRolls && (
              <button
                className="button primary"
                onClick={handleRoll}
                disabled={loading}
              >
                {loading ? 'Rolling...' : 'Roll Again'}
              </button>
            )}

            <button
              className="button secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
