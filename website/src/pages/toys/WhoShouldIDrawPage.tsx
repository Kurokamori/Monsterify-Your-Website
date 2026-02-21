import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { TypeBadge, AttributeBadge } from '@components/common';
import trainerService from '@services/trainerService';
import monsterService from '@services/monsterService';
import userService from '@services/userService';
import type { Trainer } from '@components/trainers/types/Trainer';
import type { Monster } from '@services/monsterService';
import type { User } from '@services/userService';

// --- Types ---

type UserScope = 'self' | 'all' | 'specific';
type RollType = 'both' | 'trainers' | 'monsters';

interface RolledResult {
  kind: 'trainer' | 'monster';
  id: number;
  name: string;
  image?: string;
  types: string[];
  attribute?: string;
  level?: number;
  species: string[];
  ownerName?: string;
  trainerName?: string;
}

interface RollConfig {
  userScope: UserScope;
  selectedUserDiscordId: string | null;
  selectedUserName: string;
  rollType: RollType;
  limitToTrainer: boolean;
  selectedTrainerId: number | null;
  selectedTrainerName: string;
  rollCount: number;
  requireImage: boolean;
}

const DEFAULT_CONFIG: RollConfig = {
  userScope: 'self',
  selectedUserDiscordId: null,
  selectedUserName: '',
  rollType: 'both',
  limitToTrainer: false,
  selectedTrainerId: null,
  selectedTrainerName: '',
  rollCount: 1,
  requireImage: false,
};

// --- Helpers ---

function pickRandom<T>(arr: T[], count: number): T[] {
  if (arr.length <= count) return [...arr];
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function extractTypes(obj: Record<string, unknown>): string[] {
  const types: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const val = obj[`type${i}`];
    if (typeof val === 'string' && val) types.push(val);
  }
  return types;
}

function extractSpecies(obj: Record<string, unknown>): string[] {
  const species: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const val = obj[`species${i}`];
    if (typeof val === 'string' && val) species.push(val);
  }
  return species;
}

function hasValidImage(image?: string): boolean {
  return !!image && image.trim().length > 0;
}

function trainerToResult(t: Trainer): RolledResult {
  return {
    kind: 'trainer',
    id: t.id,
    name: t.name,
    image: t.main_ref,
    types: extractTypes(t as unknown as Record<string, unknown>),
    species: extractSpecies(t as unknown as Record<string, unknown>),
    level: t.level,
    ownerName: t.player_display_name || t.player_username,
  };
}

function monsterToResult(m: Monster): RolledResult {
  return {
    kind: 'monster',
    id: m.id,
    name: m.name || 'Unnamed',
    image: m.img_link || m.main_ref,
    types: extractTypes(m as Record<string, unknown>),
    attribute: (m.attribute as string) || undefined,
    level: m.level,
    species: extractSpecies(m as Record<string, unknown>),
    trainerName: (m as Record<string, unknown>).trainer_name as string | undefined,
  };
}

// --- Component ---

const WhoShouldIDrawPage = () => {
  useDocumentTitle('Who Should I Draw?');

  const [config, setConfig] = useState<RollConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<RolledResult[]>([]);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState('');
  const [hasRolled, setHasRolled] = useState(false);

  // User search state
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

  // Trainer search state (for "limit to trainer" mode)
  const [trainerSearch, setTrainerSearch] = useState('');
  const [trainerResults, setTrainerResults] = useState<Trainer[]>([]);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const [availableTrainers, setAvailableTrainers] = useState<Trainer[]>([]);
  const trainerSearchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (trainerSearchRef.current && !trainerSearchRef.current.contains(e.target as Node)) {
        setShowTrainerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load users when switching to "specific" scope
  useEffect(() => {
    if (config.userScope === 'specific' && !usersLoaded) {
      userService.getAllUsers().then((users) => {
        setAllUsers(users);
        setUsersLoaded(true);
      }).catch(() => { /* ignore */ });
    }
  }, [config.userScope, usersLoaded]);

  // Filter users as user types
  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults(allUsers.slice(0, 20));
    } else {
      const lower = userSearch.toLowerCase();
      setUserResults(
        allUsers
          .filter(u =>
            u.username.toLowerCase().includes(lower) ||
            (u.display_name && u.display_name.toLowerCase().includes(lower))
          )
          .slice(0, 20)
      );
    }
  }, [userSearch, allUsers]);

  // Load trainers for the selected scope when "limit to trainer" is on
  const loadTrainersForScope = useCallback(async () => {
    try {
      if (config.userScope === 'self') {
        // No userId = uses auth middleware (discord_id from token)
        const res = await trainerService.getUserTrainers();
        setAvailableTrainers(res.trainers);
      } else if (config.userScope === 'specific' && config.selectedUserDiscordId) {
        const res = await trainerService.getUserTrainers(config.selectedUserDiscordId);
        setAvailableTrainers(res.trainers);
      } else {
        const res = await trainerService.getAllTrainers();
        setAvailableTrainers(res.trainers);
      }
    } catch {
      setAvailableTrainers([]);
    }
  }, [config.userScope, config.selectedUserDiscordId]);

  useEffect(() => {
    if (config.limitToTrainer) {
      loadTrainersForScope();
    }
  }, [config.limitToTrainer, loadTrainersForScope]);

  // Filter trainers as user types
  useEffect(() => {
    if (!trainerSearch.trim()) {
      setTrainerResults(availableTrainers.slice(0, 20));
    } else {
      const lower = trainerSearch.toLowerCase();
      setTrainerResults(
        availableTrainers
          .filter(t => t.name.toLowerCase().includes(lower))
          .slice(0, 20)
      );
    }
  }, [trainerSearch, availableTrainers]);

  // Update config helper
  const updateConfig = useCallback((updates: Partial<RollConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // --- Roll logic ---
  const handleRoll = useCallback(async () => {
    setRolling(true);
    setError('');
    setResults([]);

    try {
      const pool: RolledResult[] = [];
      const wantTrainers = config.rollType === 'trainers' || config.rollType === 'both';
      const wantMonsters = config.rollType === 'monsters' || config.rollType === 'both';

      if (config.limitToTrainer && config.selectedTrainerId) {
        // --- Limited to a single trainer ---
        if (wantTrainers) {
          const trainer = availableTrainers.find(t => t.id === config.selectedTrainerId);
          if (trainer) pool.push(trainerToResult(trainer));
        }
        if (wantMonsters) {
          // Single query for one trainer's monsters
          const monstersRes = await trainerService.getAllTrainerMonsters(config.selectedTrainerId);
          for (const m of monstersRes.monsters) {
            pool.push(monsterToResult(m as unknown as Monster));
          }
        }
      } else if (config.userScope === 'self') {
        // --- Self: use auth-based endpoints (no userId needed) ---
        if (wantTrainers) {
          const res = await trainerService.getUserTrainers();
          for (const t of res.trainers) pool.push(trainerToResult(t));
        }
        if (wantMonsters) {
          // Single query: GET /monsters/user (uses auth token)
          const monsters = await monsterService.getMonstersByUserId();
          for (const m of monsters) pool.push(monsterToResult(m));
        }
      } else if (config.userScope === 'specific' && config.selectedUserDiscordId) {
        // --- Specific user: use discord_id ---
        if (wantTrainers) {
          const res = await trainerService.getUserTrainers(config.selectedUserDiscordId);
          for (const t of res.trainers) pool.push(trainerToResult(t));
        }
        if (wantMonsters) {
          // Single query: GET /monsters/user/:discordId
          const monsters = await monsterService.getMonstersByUserId(config.selectedUserDiscordId);
          for (const m of monsters) pool.push(monsterToResult(m));
        }
      } else {
        // --- All users ---
        if (wantTrainers) {
          const res = await trainerService.getAllTrainers();
          for (const t of res.trainers) pool.push(trainerToResult(t));
        }
        if (wantMonsters) {
          // Single query: GET /monsters with high limit
          const res = await monsterService.getAllMonsters({ limit: 100000 });
          const monsters = res.data ?? res.monsters ?? [];
          for (const m of monsters) pool.push(monsterToResult(m));
        }
      }

      // Apply "require image" filter
      const filtered = config.requireImage
        ? pool.filter(r => hasValidImage(r.image))
        : pool;

      if (filtered.length === 0) {
        setError(
          config.requireImage
            ? 'No results with valid images found. Try disabling the image filter.'
            : 'No trainers or monsters found with the current filters.'
        );
        setHasRolled(true);
        setRolling(false);
        return;
      }

      // Short delay for the rolling animation feel
      await new Promise(resolve => setTimeout(resolve, 800));

      const picked = pickRandom(filtered, config.rollCount);
      setResults(picked);
      setHasRolled(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setRolling(false);
    }
  }, [config, availableTrainers]);

  // Select a user
  const selectUser = (user: User) => {
    updateConfig({
      selectedUserDiscordId: user.discord_id || null,
      selectedUserName: user.display_name || user.username,
      limitToTrainer: false,
      selectedTrainerId: null,
      selectedTrainerName: '',
    });
    setUserSearch('');
    setShowUserDropdown(false);
  };

  // Select a trainer
  const selectTrainer = (trainer: Trainer) => {
    updateConfig({
      selectedTrainerId: trainer.id,
      selectedTrainerName: trainer.name,
    });
    setTrainerSearch('');
    setShowTrainerDropdown(false);
  };

  return (
    <div className="who-should-i-draw">
      <Link to="/toys" className="wsid-back-link">
        <i className="fas fa-arrow-left"></i> Back to Toys
      </Link>

      <div className="who-should-i-draw__header">
        <h1 className="who-should-i-draw__title">Who Should I Draw?</h1>
        <p className="who-should-i-draw__subtitle">
          Get random suggestions for characters to draw
        </p>
      </div>

      {/* Configuration */}
      <div className="wsid-config">
        <h2 className="wsid-config__title">
          <i className="fas fa-sliders-h"></i> Configuration
        </h2>

        <div className="wsid-config__grid">
          {/* User scope */}
          <div className="wsid-config__field">
            <label className="wsid-config__label">Roll From</label>
            <div className="wsid-config__option-group">
              <button
                className={`wsid-config__option ${config.userScope === 'self' ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ userScope: 'self', selectedUserDiscordId: null, selectedUserName: '', limitToTrainer: false, selectedTrainerId: null, selectedTrainerName: '' })}
              >
                Myself
              </button>
              <button
                className={`wsid-config__option ${config.userScope === 'all' ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ userScope: 'all', selectedUserDiscordId: null, selectedUserName: '', limitToTrainer: false, selectedTrainerId: null, selectedTrainerName: '' })}
              >
                All Users
              </button>
              <button
                className={`wsid-config__option ${config.userScope === 'specific' ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ userScope: 'specific', limitToTrainer: false, selectedTrainerId: null, selectedTrainerName: '' })}
              >
                Specific User
              </button>
            </div>
          </div>

          {/* Specific user selector */}
          {config.userScope === 'specific' && (
            <div className="wsid-config__field">
              <label className="wsid-config__label">Select User</label>
              {config.selectedUserDiscordId ? (
                <div className="wsid-config__selected-user">
                  <i className="fas fa-user"></i>
                  <span>{config.selectedUserName}</span>
                  <button onClick={() => updateConfig({ selectedUserDiscordId: null, selectedUserName: '' })}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="wsid-config__user-search" ref={userSearchRef}>
                  <input
                    type="text"
                    className="wsid-config__input"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                  />
                  {showUserDropdown && userResults.length > 0 && (
                    <div className="wsid-config__user-results">
                      {userResults.map((u) => (
                        <div
                          key={u.id}
                          className="wsid-config__user-option"
                          onClick={() => selectUser(u)}
                        >
                          {u.display_name || u.username}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Roll type */}
          <div className="wsid-config__field">
            <label className="wsid-config__label">What to Roll</label>
            <div className="wsid-config__option-group">
              <button
                className={`wsid-config__option ${config.rollType === 'both' ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ rollType: 'both' })}
              >
                Both
              </button>
              <button
                className={`wsid-config__option ${config.rollType === 'trainers' ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ rollType: 'trainers' })}
              >
                Trainers
              </button>
              <button
                className={`wsid-config__option ${config.rollType === 'monsters' ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ rollType: 'monsters' })}
              >
                Monsters
              </button>
            </div>
          </div>

          {/* Limit to trainer */}
          <div className="wsid-config__field">
            <label className="wsid-config__label">Limit to Trainer</label>
            <div className="wsid-config__option-group">
              <button
                className={`wsid-config__option ${!config.limitToTrainer ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ limitToTrainer: false, selectedTrainerId: null, selectedTrainerName: '' })}
              >
                No Limit
              </button>
              <button
                className={`wsid-config__option ${config.limitToTrainer ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ limitToTrainer: true })}
              >
                Specific Trainer
              </button>
            </div>
          </div>

          {/* Trainer selector */}
          {config.limitToTrainer && (
            <div className="wsid-config__field">
              <label className="wsid-config__label">Select Trainer</label>
              {config.selectedTrainerId ? (
                <div className="wsid-config__selected-user">
                  <i className="fas fa-id-badge"></i>
                  <span>{config.selectedTrainerName}</span>
                  <button onClick={() => updateConfig({ selectedTrainerId: null, selectedTrainerName: '' })}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="wsid-config__user-search" ref={trainerSearchRef}>
                  <input
                    type="text"
                    className="wsid-config__input"
                    placeholder="Search trainers..."
                    value={trainerSearch}
                    onChange={(e) => {
                      setTrainerSearch(e.target.value);
                      setShowTrainerDropdown(true);
                    }}
                    onFocus={() => setShowTrainerDropdown(true)}
                  />
                  {showTrainerDropdown && trainerResults.length > 0 && (
                    <div className="wsid-config__user-results">
                      {trainerResults.map((t) => (
                        <div
                          key={t.id}
                          className="wsid-config__user-option"
                          onClick={() => selectTrainer(t)}
                        >
                          {t.name} {t.player_display_name ? `(${t.player_display_name})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Roll count */}
          <div className="wsid-config__field">
            <label className="wsid-config__label">Number of Rolls</label>
            <input
              type="number"
              className="wsid-config__input"
              min={1}
              max={20}
              value={config.rollCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 20) {
                  updateConfig({ rollCount: val });
                }
              }}
            />
          </div>

          {/* Require image */}
          <div className="wsid-config__field">
            <label className="wsid-config__label">Image Filter</label>
            <div className="wsid-config__option-group">
              <button
                className={`wsid-config__option ${!config.requireImage ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ requireImage: false })}
              >
                All
              </button>
              <button
                className={`wsid-config__option ${config.requireImage ? 'wsid-config__option--active' : ''}`}
                onClick={() => updateConfig({ requireImage: true })}
              >
                With Image Only
              </button>
            </div>
          </div>
        </div>

        <div className="wsid-config__actions">
          <button
            className="button primary"
            onClick={handleRoll}
            disabled={rolling || (config.userScope === 'specific' && !config.selectedUserDiscordId)}
          >
            <i className="fas fa-dice"></i>{' '}
            {rolling ? 'Rolling...' : 'Roll!'}
          </button>
        </div>
      </div>

      {/* Rolling animation */}
      {rolling && (
        <div className="wsid-rolling">
          <div className="wsid-rolling__spinner"></div>
          <span className="wsid-rolling__text">Rolling the dice...</span>
        </div>
      )}

      {/* Error */}
      {error && !rolling && (
        <div className="wsid-empty">
          <i className="fas fa-exclamation-triangle wsid-empty__icon"></i>
          <p className="wsid-empty__text">{error}</p>
        </div>
      )}

      {/* Results */}
      {!rolling && results.length > 0 && (
        <div className="wsid-results">
          <div className="wsid-results__header">
            <h2 className="wsid-results__title">
              <i className="fas fa-star"></i> Results
            </h2>
            <span className="wsid-results__count">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="wsid-results__grid">
            {results.map((result, idx) => (
              <Link
                key={`${result.kind}-${result.id}-${idx}`}
                to={result.kind === 'trainer' ? `/trainers/${result.id}` : `/monsters/${result.id}`}
                className={`wsid-result-card wsid-result-card--${result.kind}`}
              >
                <span className={`wsid-result-card__badge wsid-result-card__badge--${result.kind}`}>
                  {result.kind}
                </span>

                <div className={`wsid-result-card__avatar ${!result.image ? 'wsid-result-card__avatar--placeholder' : ''}`}>
                  {result.image ? (
                    <img src={result.image} alt={result.name} />
                  ) : (
                    <i className={result.kind === 'trainer' ? 'fas fa-user' : 'fas fa-dragon'}></i>
                  )}
                </div>

                <div className="wsid-result-card__details">
                  <h3 className="wsid-result-card__name">{result.name}</h3>

                  <div className="wsid-result-card__meta">
                    {result.level !== undefined && (
                      <span className="wsid-result-card__meta-item">
                        <i className="fas fa-arrow-up"></i> Lv. {result.level}
                      </span>
                    )}
                    {result.species.length > 0 && (
                      <span className="wsid-result-card__meta-item">
                        <i className="fas fa-paw"></i> {result.species.join(' / ')}
                      </span>
                    )}
                  </div>

                  {(result.types.length > 0 || result.attribute) && (
                    <div className="wsid-result-card__types">
                      {result.types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                      {result.attribute && (
                        <AttributeBadge attribute={result.attribute} />
                      )}
                    </div>
                  )}

                  {(result.ownerName || result.trainerName) && (
                    <span className="wsid-result-card__owner">
                      <i className="fas fa-user"></i>
                      {result.kind === 'trainer'
                        ? result.ownerName
                        : `${result.trainerName}'s`}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state (after rolling with no results) */}
      {!rolling && !error && hasRolled && results.length === 0 && (
        <div className="wsid-empty">
          <i className="fas fa-ghost wsid-empty__icon"></i>
          <p className="wsid-empty__text">No results found. Try adjusting your filters!</p>
        </div>
      )}
    </div>
  );
};

export default WhoShouldIDrawPage;
