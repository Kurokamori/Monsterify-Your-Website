import { useState, useEffect, useCallback, type SyntheticEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import rerollerService, { type RerollClaim } from '../../services/rerollerService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// --- Types ---

interface Trainer {
  id: number;
  name: string;
}

interface ClaimMonster {
  species1: string;
  species2?: string;
  image_url?: string;
  species1_img?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  claimed: boolean;
}

interface ClaimItem {
  name: string;
  category?: string;
  quantity?: number;
  image_url?: string;
  claimed: boolean;
}

interface ClaimRemaining {
  monstersRemaining: number | 'unlimited';
  itemsRemaining: number | 'unlimited';
  monstersClaimed: number;
  itemsClaimed: number;
}

interface ClaimSessionData {
  monsters: ClaimMonster[];
  items: ClaimItem[];
  trainers: Trainer[];
  remaining: ClaimRemaining;
  monsterClaimLimit?: number;
  itemClaimLimit?: number;
}

interface ClaimSuccessData {
  monsters?: Array<{ name: string; species1: string }>;
  items?: Array<{ name: string; quantity: number }>;
}

interface MonsterSelection {
  trainerId: string;
  name: string;
}

interface ItemSelection {
  trainerId: string;
}

// --- Helpers ---

function handleImageError(e: SyntheticEvent<HTMLImageElement>, fallback: string) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = fallback;
}

function getRewardCardClass(
  claimed: boolean,
  isSelected: boolean,
  atLimit: boolean,
): string {
  if (claimed) return 'area-card claimed';
  if (isSelected) return 'area-card selected';
  if (atLimit) return 'area-card disabled';
  return 'area-card';
}

// --- Component ---

export default function RerollClaimPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useDocumentTitle('Claim Rewards');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<ClaimSessionData | null>(null);
  const [monsterSelections, setMonsterSelections] = useState<Record<number, MonsterSelection>>({});
  const [itemSelections, setItemSelections] = useState<Record<number, ItemSelection>>({});
  const [defaultTrainerId, setDefaultTrainerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<ClaimSuccessData | null>(null);

  // Check token + load session
  const fetchSession = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      await rerollerService.checkToken(token);

      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      const response = await rerollerService.getClaimSession(token);
      const data = response.data ?? response;
      setSessionData(data);

      if (data.trainers?.length > 0) {
        setDefaultTrainerId(String(data.trainers[0].id));
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Invalid or expired claim link');
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  // --- Selection handlers ---

  const toggleMonsterSelection = (index: number) => {
    if (!sessionData) return;
    const monster = sessionData.monsters[index];
    if (monster.claimed) return;

    const remaining = sessionData.remaining.monstersRemaining;
    const selectedCount = Object.keys(monsterSelections).length;

    if (monsterSelections[index]) {
      const next = { ...monsterSelections };
      delete next[index];
      setMonsterSelections(next);
    } else {
      if (remaining !== 'unlimited' && selectedCount >= remaining) return;
      setMonsterSelections({
        ...monsterSelections,
        [index]: { trainerId: defaultTrainerId, name: monster.species1 || '' },
      });
    }
  };

  const toggleItemSelection = (index: number) => {
    if (!sessionData) return;
    const item = sessionData.items[index];
    if (item.claimed) return;

    const remaining = sessionData.remaining.itemsRemaining;
    const selectedCount = Object.keys(itemSelections).length;

    if (itemSelections[index]) {
      const next = { ...itemSelections };
      delete next[index];
      setItemSelections(next);
    } else {
      if (remaining !== 'unlimited' && selectedCount >= remaining) return;
      setItemSelections({ ...itemSelections, [index]: { trainerId: defaultTrainerId } });
    }
  };

  const updateMonsterName = (index: number, name: string) => {
    if (!monsterSelections[index]) return;
    setMonsterSelections({ ...monsterSelections, [index]: { ...monsterSelections[index], name } });
  };

  const updateMonsterTrainer = (index: number, trainerId: string) => {
    if (!monsterSelections[index]) return;
    setMonsterSelections({ ...monsterSelections, [index]: { ...monsterSelections[index], trainerId } });
  };

  const updateItemTrainer = (index: number, trainerId: string) => {
    if (!itemSelections[index]) return;
    setItemSelections({ ...itemSelections, [index]: { ...itemSelections[index], trainerId } });
  };

  const allSelectionsHaveTrainers = (): boolean => {
    for (const sel of Object.values(monsterSelections)) {
      if (!sel.trainerId) return false;
    }
    for (const sel of Object.values(itemSelections)) {
      if (!sel.trainerId) return false;
    }
    return true;
  };

  const getTrainerName = (trainerId: string): string => {
    const trainer = sessionData?.trainers?.find(t => String(t.id) === trainerId);
    return trainer?.name || 'Unknown';
  };

  // --- Submit ---

  const handleSubmit = async () => {
    if (!token || !sessionData) return;

    const monsterCount = Object.keys(monsterSelections).length;
    const itemCount = Object.keys(itemSelections).length;

    if (monsterCount === 0 && itemCount === 0) {
      setError('Please select at least one reward to claim');
      return;
    }

    if (!allSelectionsHaveTrainers()) {
      setError('Please select a trainer for each reward');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const claims: RerollClaim[] = [];

      for (const [index, selection] of Object.entries(monsterSelections)) {
        const idx = Number(index);
        claims.push({
          type: 'monster',
          index: idx,
          trainerId: Number(selection.trainerId),
          monsterName: selection.name || sessionData.monsters[idx].species1,
        });
      }

      for (const [index, selection] of Object.entries(itemSelections)) {
        claims.push({
          type: 'item',
          index: Number(index),
          trainerId: Number(selection.trainerId),
        });
      }

      const response = await rerollerService.submitClaims(token, claims);
      setClaimSuccess(response.data ?? response);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to submit claims');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Login redirect ---

  const handleLogin = () => {
    if (token) {
      sessionStorage.setItem('claimReturnUrl', `/claim/${token}`);
    }
    navigate('/login');
  };

  // --- Render: Loading ---

  if (loading) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <LoadingSpinner message="Loading claim session..." />
        </div>
      </div>
    );
  }

  // --- Render: Error (no session) ---

  if (error && !sessionData) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <div className="claim-status-card">
            <i className="fa-solid fa-exclamation-circle" />
            <h2>Unable to Load Rewards</h2>
            <p>{error}</p>
            <Link to="/" className="button primary">Return Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Not logged in ---

  if (!isAuthenticated) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <div className="claim-status-card">
            <i className="fa-solid fa-gift" />
            <h2>Claim Your Rewards</h2>
            <p>Please log in to claim your rewards from this link.</p>
            <button className="button primary" onClick={handleLogin}>
              <i className="fa-solid fa-right-to-bracket" /> Log In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Success ---

  if (claimSuccess) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <div className="claim-status-card success">
            <i className="fa-solid fa-check-circle" />
            <h2>Rewards Claimed Successfully!</h2>
            <p>Your rewards have been added to your trainers.</p>

            <div className="claim-success-list">
              {claimSuccess.monsters && claimSuccess.monsters.length > 0 && (
                <>
                  <h3>Monsters Received:</h3>
                  <ul>
                    {claimSuccess.monsters.map((m, i) => (
                      <li key={i}>
                        <i className="fa-solid fa-dragon" />
                        {m.name} ({m.species1})
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {claimSuccess.items && claimSuccess.items.length > 0 && (
                <>
                  <h3>Items Received:</h3>
                  <ul>
                    {claimSuccess.items.map((item, i) => (
                      <li key={i}>
                        <i className="fa-solid fa-box" />
                        {item.name} {item.quantity > 1 && `x${item.quantity}`}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <Link to="/" className="button primary lg">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Main claim interface ---

  const selectedMonsterCount = Object.keys(monsterSelections).length;
  const selectedItemCount = Object.keys(itemSelections).length;
  const totalSelected = selectedMonsterCount + selectedItemCount;

  return (
    <div className="claim-page">
      <div className="claim-container">
        <div className="claim-header">
          <h1><i className="fa-solid fa-gift" /> Claim Your Rewards</h1>
          <p>Select the rewards you want to claim and choose which trainer receives each one.</p>
        </div>

        {error && (
          <div className="claim-info error">
            <i className="fa-solid fa-exclamation-triangle" /> {error}
          </div>
        )}

        <div className="claim-content">
          <div className="rewards-wrapper">
            {/* Monsters */}
            {sessionData?.monsters && sessionData.monsters.length > 0 && (
              <div className="rewards-section">
                <h2>
                  <i className="fa-solid fa-dragon" />
                  Monsters
                  {sessionData.monsterClaimLimit && (
                    <span className="claim-count-info">
                      (Select up to {sessionData.remaining.monstersRemaining})
                    </span>
                  )}
                </h2>

                {sessionData.remaining.monstersClaimed > 0 && (
                  <div className="claim-info">
                    You have already claimed {sessionData.remaining.monstersClaimed} monster(s).
                  </div>
                )}

                <div className="reward-grid">
                  {sessionData.monsters.map((monster, index) => {
                    const isSelected = !!monsterSelections[index];
                    const selection = monsterSelections[index];
                    const atLimit =
                      sessionData.remaining.monstersRemaining !== 'unlimited' &&
                      selectedMonsterCount >= sessionData.remaining.monstersRemaining;

                    return (
                      <div
                        key={index}
                        className={getRewardCardClass(monster.claimed, isSelected, atLimit)}
                        onClick={() => toggleMonsterSelection(index)}
                      >
                        <img
                          src={monster.image_url || monster.species1_img || '/images/monsters/default.png'}
                          alt={monster.species1}
                          className="reward-image"
                          onError={e => handleImageError(e, '/images/monsters/default.png')}
                        />
                        <div className="reward-name">{monster.species1}</div>
                        {monster.species2 && (
                          <div className="reward-details">+ {monster.species2}</div>
                        )}
                        <div className="reward-types">
                          {monster.type1 && <span className="reward-type-badge">{monster.type1}</span>}
                          {monster.type2 && <span className="reward-type-badge">{monster.type2}</span>}
                          {monster.type3 && <span className="reward-type-badge">{monster.type3}</span>}
                        </div>

                        {monster.claimed && <span className="claimed-badge">Already Claimed</span>}
                        {isSelected && <span className="selected-badge">Selected</span>}

                        {isSelected && (
                          <div className="reward-config" onClick={e => e.stopPropagation()}>
                            <div className="form-group">
                              <label>Nickname:</label>
                              <input
                                type="text"
                                className="input"
                                value={selection.name || ''}
                                onChange={e => updateMonsterName(index, e.target.value)}
                                placeholder={monster.species1}
                              />
                            </div>
                            <div className="form-group">
                              <label>Trainer:</label>
                              <select
                                className="select"
                                value={selection.trainerId || ''}
                                onChange={e => updateMonsterTrainer(index, e.target.value)}
                              >
                                <option value="">Choose trainer...</option>
                                {sessionData.trainers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items */}
            {sessionData?.items && sessionData.items.length > 0 && (
              <div className="rewards-section">
                <h2>
                  <i className="fa-solid fa-box" />
                  Items
                  {sessionData.itemClaimLimit && (
                    <span className="claim-count-info">
                      (Select up to {sessionData.remaining.itemsRemaining})
                    </span>
                  )}
                </h2>

                {sessionData.remaining.itemsClaimed > 0 && (
                  <div className="claim-info">
                    You have already claimed {sessionData.remaining.itemsClaimed} item(s).
                  </div>
                )}

                <div className="reward-grid">
                  {sessionData.items.map((item, index) => {
                    const isSelected = !!itemSelections[index];
                    const selection = itemSelections[index];
                    const atLimit =
                      sessionData.remaining.itemsRemaining !== 'unlimited' &&
                      selectedItemCount >= sessionData.remaining.itemsRemaining;

                    return (
                      <div
                        key={index}
                        className={getRewardCardClass(item.claimed, isSelected, atLimit)}
                        onClick={() => toggleItemSelection(index)}
                      >
                        <img
                          src={item.image_url || '/images/items/default_item.png'}
                          alt={item.name}
                          className="reward-image"
                          onError={e => handleImageError(e, '/images/items/default_item.png')}
                        />
                        <div className="reward-name">{item.name}</div>
                        <div className="reward-details">
                          {item.category} {item.quantity && item.quantity > 1 && `x${item.quantity}`}
                        </div>

                        {item.claimed && <span className="claimed-badge">Already Claimed</span>}
                        {isSelected && <span className="selected-badge">Selected</span>}

                        {isSelected && (
                          <div className="reward-config" onClick={e => e.stopPropagation()}>
                            <div className="form-group">
                              <label>Trainer:</label>
                              <select
                                className="select"
                                value={selection.trainerId || ''}
                                onChange={e => updateItemTrainer(index, e.target.value)}
                              >
                                <option value="">Choose trainer...</option>
                                {sessionData.trainers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Claim Panel */}
          <div className="claim-panel">
            <h2>Claim Summary</h2>

            {totalSelected > 0 ? (
              <>
                <div className="claim-summary-list">
                  {Object.entries(monsterSelections).map(([index, selection]) => (
                    <div key={`monster-${index}`} className="selected-item">
                      <div className="selected-item-info">
                        <i className="fa-solid fa-dragon category-icon" />
                        <span className="selected-item-name">
                          {selection.name || sessionData!.monsters[Number(index)].species1}
                        </span>
                        <span className="selected-item-trainer">
                          {selection.trainerId
                            ? `\u2192 ${getTrainerName(selection.trainerId)}`
                            : <em>No trainer</em>}
                        </span>
                      </div>
                      <button
                        className="button danger icon sm no-flex"
                        onClick={() => {
                          const next = { ...monsterSelections };
                          delete next[Number(index)];
                          setMonsterSelections(next);
                        }}
                      >
                        <i className="fa-solid fa-times" />
                      </button>
                    </div>
                  ))}
                  {Object.entries(itemSelections).map(([index, selection]) => (
                    <div key={`item-${index}`} className="selected-item">
                      <div className="selected-item-info">
                        <i className="fa-solid fa-box category-icon" />
                        <span className="selected-item-name">
                          {sessionData!.items[Number(index)].name}
                        </span>
                        <span className="selected-item-trainer">
                          {selection.trainerId
                            ? `\u2192 ${getTrainerName(selection.trainerId)}`
                            : <em>No trainer</em>}
                        </span>
                      </div>
                      <button
                        className="button danger icon sm no-flex"
                        onClick={() => {
                          const next = { ...itemSelections };
                          delete next[Number(index)];
                          setItemSelections(next);
                        }}
                      >
                        <i className="fa-solid fa-times" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="button primary lg block"
                  onClick={handleSubmit}
                  disabled={submitting || !allSelectionsHaveTrainers()}
                >
                  {submitting ? (
                    <><i className="fa-solid fa-spinner fa-spin" /> Processing...</>
                  ) : (
                    <><i className="fa-solid fa-check" /> Claim {totalSelected} Reward{totalSelected > 1 ? 's' : ''}</>
                  )}
                </button>

                {!allSelectionsHaveTrainers() && (
                  <p className="claim-warning">
                    <i className="fa-solid fa-exclamation-triangle" /> Please select a trainer for each reward
                  </p>
                )}
              </>
            ) : (
              <p className="no-selection">Click on rewards above to select them for claiming.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
