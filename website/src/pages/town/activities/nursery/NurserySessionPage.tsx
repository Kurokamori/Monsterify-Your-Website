import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { SuccessMessage } from '@components/common/SuccessMessage';
import { MonsterCard } from '@components/monsters/MonsterCard';
import api from '@services/api';
import type { HatchSession, SessionResponse, SelectMonsterResponse, RerollResponse } from './types';
import { extractErrorMessage } from '@utils/errorUtils';
import '@styles/town/activities.css';
import '@styles/town/nursery.css';

function getOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export default function NurserySessionPage() {
  useDocumentTitle('Hatching Session');
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<HatchSession | null>(null);
  const [currentEgg, setCurrentEgg] = useState(0);
  const [selectedMonsters, setSelectedMonsters] = useState<Record<number, number | undefined>>({});
  const [monsterNames, setMonsterNames] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch session
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<SessionResponse>(`/nursery/session/${sessionId}`);

      if (response.data.success) {
        const sess = response.data.session;
        setSession(sess);

        // Initialize selected monsters and names from existing session data
        const initialSelected: Record<number, number | undefined> = {};
        const initialNames: Record<number, string> = {};

        sess.hatchedEggs.forEach(egg => {
          const selected = sess.selectedMonsters[egg.eggId];
          if (selected) {
            initialSelected[egg.eggId] = selected.monsterIndex;
            initialNames[egg.eggId] = selected.monsterName;
          }
        });

        setSelectedMonsters(initialSelected);
        setMonsterNames(initialNames);
      } else {
        setError(response.data.message || 'Failed to load hatch session');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load hatch session. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Auto-clear status messages
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Handlers
  const handleMonsterSelect = useCallback((eggId: number, monsterIndex: number) => {
    setSelectedMonsters(prev => ({
      ...prev,
      [eggId]: prev[eggId] === monsterIndex ? undefined : monsterIndex,
    }));
  }, []);

  const handleNameChange = useCallback((eggId: number, name: string) => {
    setMonsterNames(prev => ({ ...prev, [eggId]: name }));
  }, []);

  // Select and claim a monster for an egg
  const handleSelectMonster = useCallback(async (eggId: number) => {
    if (!session || !sessionId) return;
    const monsterIndex = selectedMonsters[eggId];
    const monsterName = monsterNames[eggId];

    if (monsterIndex === undefined) {
      setStatusMessage({ type: 'error', message: 'Please select a monster first' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const response = await api.post<SelectMonsterResponse>('/nursery/select', {
        sessionId,
        eggId,
        monsterIndex,
        monsterName: monsterName || `Hatched Monster ${eggId}`,
        dnaSplicers: 0,
        useEdenwiess: false,
      });

      if (response.data.success) {
        setStatusMessage({ type: 'success', message: 'Monster selected successfully!' });

        // Update session with returned data
        setSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            selectedMonsters: {
              ...prev.selectedMonsters,
              [eggId]: {
                monsterIndex,
                monsterId: response.data.monster.id,
                monsterName: response.data.monster.name,
                selectedAt: new Date().toISOString(),
              },
            },
          };
        });

        // Advance to next unselected egg
        const nextEggIndex = session.hatchedEggs.findIndex(
          (egg, idx) => idx > currentEgg && !session.selectedMonsters[egg.eggId]
        );
        if (nextEggIndex !== -1) {
          setCurrentEgg(nextEggIndex);
        }
      }
    } catch (err) {
      setStatusMessage({ type: 'error', message: extractErrorMessage(err, 'Failed to select monster') });
    } finally {
      setSubmitting(false);
    }
  }, [session, sessionId, selectedMonsters, monsterNames, currentEgg]);

  // Claim extra monster with Edenwiess berry
  const handleClaimWithEdenwiess = useCallback(async (eggId: number) => {
    if (!sessionId) return;
    const monsterIndex = selectedMonsters[eggId];
    const monsterName = monsterNames[eggId];

    if (monsterIndex === undefined) {
      setStatusMessage({ type: 'error', message: 'Please select a monster first' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const response = await api.post<SelectMonsterResponse>('/nursery/select', {
        sessionId,
        eggId,
        monsterIndex,
        monsterName: monsterName || `Hatched Monster ${eggId}`,
        dnaSplicers: 0,
        useEdenwiess: true,
      });

      if (response.data.success) {
        setStatusMessage({ type: 'success', message: 'Extra monster claimed with Edenwiess!' });

        // Update session with claimed monsters and berries
        setSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            claimedMonsters: response.data.session.claimedMonsters || prev.claimedMonsters,
            specialBerries: response.data.specialBerries || prev.specialBerries,
          };
        });

        // Reset selection so user can pick another monster
        setSelectedMonsters(prev => ({ ...prev, [eggId]: undefined }));
        setMonsterNames(prev => ({ ...prev, [eggId]: '' }));
      }
    } catch (err) {
      setStatusMessage({ type: 'error', message: extractErrorMessage(err, 'Failed to claim monster') });
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, selectedMonsters, monsterNames]);

  // Reroll egg with Forget-Me-Not berry
  const handleRerollEgg = useCallback(async () => {
    if (!sessionId || !session) return;
    const currentEggData = session.hatchedEggs[currentEgg];
    if (!currentEggData) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const response = await api.post<RerollResponse>('/nursery/reroll', { sessionId });

      if (response.data.success) {
        setStatusMessage({ type: 'success', message: 'Egg rerolled with Forget-Me-Not!' });

        // Reset selections for current egg
        setSelectedMonsters(prev => ({ ...prev, [currentEggData.eggId]: undefined }));
        setMonsterNames(prev => ({ ...prev, [currentEggData.eggId]: '' }));

        // Refresh session data
        await fetchSession();
      } else {
        setStatusMessage({ type: 'error', message: response.data.message || 'Failed to reroll egg' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', message: extractErrorMessage(err, 'Failed to reroll egg. Please try again.') });
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, session, currentEgg, fetchSession]);

  // Derived state
  const currentEggData = session?.hatchedEggs[currentEgg];
  const isEggSelected = currentEggData ? !!session?.selectedMonsters[currentEggData.eggId] : false;
  const allEggsSelected = useMemo(() => {
    if (!session) return false;
    return session.hatchedEggs.every(egg => session.selectedMonsters[egg.eggId]);
  }, [session]);

  // Claimed monsters for current egg
  const claimedMonsterIndices = useMemo(() => {
    if (!session?.claimedMonsters || !currentEggData) return [];
    return session.claimedMonsters
      .filter(claim => claim.startsWith(`${currentEggData.eggId}-`))
      .map(claim => parseInt(claim.split('-')[1]));
  }, [session?.claimedMonsters, currentEggData]);

  const currentEggClaims = claimedMonsterIndices.length;

  // Build species label for naming section
  const getSpeciesLabel = useCallback(() => {
    if (!currentEggData) return 'Selected Monster';
    const labels: string[] = [];

    claimedMonsterIndices.forEach(idx => {
      const monster = currentEggData.monsters[idx];
      if (monster) {
        const speciesParts = [monster.species1, monster.species2, monster.species3].filter(Boolean);
        labels.push(speciesParts.length > 0 ? speciesParts.join(' / ') : (monster.species || monster.species_name || monster.name || 'Unknown'));
      }
    });

    const selectedIdx = selectedMonsters[currentEggData.eggId];
    if (selectedIdx !== undefined) {
      const monster = currentEggData.monsters[selectedIdx];
      if (monster) {
        const speciesParts = [monster.species1, monster.species2, monster.species3].filter(Boolean);
        labels.push(speciesParts.length > 0 ? speciesParts.join(' / ') : (monster.species || monster.species_name || monster.name || 'Selected Monster'));
      }
    }

    return labels.join(' / ') || 'Selected Monster';
  }, [currentEggData, claimedMonsterIndices, selectedMonsters]);

  // Naming section component (used in two places)
  const renderNamingSection = () => {
    if (!currentEggData || selectedMonsters[currentEggData.eggId] === undefined) return null;

    return (
      <div className="nursery-naming">
        <div className="nursery-naming__card">
          <div className="nursery-naming__header">
            <i className="fas fa-signature"></i>
            <span>Name Your Monster</span>
            <span className="nursery-naming__optional">Optional</span>
          </div>
          <div className="nursery-naming__species">{getSpeciesLabel()}</div>
          <div className="nursery-naming__input-wrap">
            <input
              type="text"
              className="input"
              value={monsterNames[currentEggData.eggId] || ''}
              onChange={e => handleNameChange(currentEggData.eggId, e.target.value)}
              placeholder={`Hatched Monster ${currentEggData.eggId}`}
              maxLength={50}
            />
            <div className="nursery-naming__char-count">
              {(monsterNames[currentEggData.eggId] || '').length}/50
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading
  if (loading) {
    return (
      <div className="activity-page">
        <LoadingSpinner message="Loading hatch session..." />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town/activities/nursery" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Nursery
          </Link>
        </div>
        <ErrorMessage message={error} onRetry={fetchSession} />
      </div>
    );
  }

  // Invalid session
  if (!session || !session.hatchedEggs) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town/activities/nursery" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Nursery
          </Link>
        </div>
        <ErrorMessage message="Invalid hatch session" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="activity-page">
        <ErrorMessage message="Please log in to view hatch sessions." />
      </div>
    );
  }

  // All eggs selected — completion view
  if (allEggsSelected) {
    return (
      <div className="activity-page">
        <div className="nursery-complete">
          <div className="nursery-complete__celebration">
            <div className="nursery-complete__icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="nursery-complete__confetti">
              <div className="nursery-confetti"></div>
              <div className="nursery-confetti"></div>
              <div className="nursery-confetti"></div>
            </div>
          </div>
          <h2 className="nursery-complete__title">Hatching Complete!</h2>
          <p className="nursery-complete__description">
            Congratulations! You have successfully hatched{' '}
            <strong>{session.eggCount}</strong> {session.eggCount === 1 ? 'egg' : 'eggs'}{' '}
            and selected your monsters.
          </p>
          <div className="nursery-complete__stats">
            <div className="nursery-complete__stat">
              <i className="fas fa-egg"></i>
              <span>Eggs Hatched: {session.eggCount}</span>
            </div>
            <div className="nursery-complete__stat">
              <i className="fas fa-dragon"></i>
              <span>Monsters Selected: {Object.keys(session.selectedMonsters || {}).length + (session.claimedMonsters?.length || 0)}</span>
            </div>
          </div>
          <button
            className="button primary"
            onClick={() => navigate('/town/activities/nursery')}
          >
            <i className="fas fa-home"></i> Return to Nursery
          </button>
        </div>
      </div>
    );
  }

  // No eggs to display
  if (!currentEggData) {
    return (
      <div className="activity-page">
        <ErrorMessage message="No eggs to hatch" />
      </div>
    );
  }

  return (
    <div className="activity-page">
      {/* Breadcrumb */}
      <div className="activity-page__breadcrumb">
        <Link to="/town/activities/nursery" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Nursery
        </Link>
      </div>

      {/* Header */}
      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-egg"></i>
        </div>
        <div>
          <h1>Hatching Session</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-medium)', flexWrap: 'wrap', marginTop: 'var(--spacing-xxsmall)' }}>
            <span className="nursery-session__type-badge">
              <i className={session.type === 'hatch' ? 'fas fa-magic' : 'fas fa-seedling'}></i>
              {session.type === 'hatch' ? 'Simple Hatch' : 'Advanced Nurture'}
            </span>
            <span className="nursery-session__progress-text">
              Egg <strong>{currentEgg + 1}</strong> of <strong>{session.eggCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="nursery-progress">
        <div className="nursery-progress__bar">
          {session.hatchedEggs.map((egg, index) => {
            let stepClass = 'nursery-progress__step--pending';
            if (session.selectedMonsters[egg.eggId]) {
              stepClass = 'nursery-progress__step--completed';
            } else if (index === currentEgg) {
              stepClass = 'nursery-progress__step--active';
            }

            return (
              <div key={egg.eggId} className={`nursery-progress__step ${stepClass}`}>
                <div className="nursery-progress__circle">
                  {session.selectedMonsters[egg.eggId] ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="nursery-progress__label">Egg {index + 1}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Egg */}
      <div className="nursery-egg">
        {/* Egg Header */}
        <div className="nursery-egg__header">
          <h2 className="nursery-egg__title">
            <i className="fas fa-egg"></i>
            Choose your {getOrdinal(currentEgg + 1)} monster
          </h2>
          <span className="nursery-egg__badge">Egg #{currentEggData.eggId}</span>
        </div>

        {/* Naming Section (top) */}
        {!isEggSelected && renderNamingSection()}

        {/* Monster Selection Grid */}
        <div className="nursery-monsters">
          <h3 className="nursery-monsters__title">
            <i className="fas fa-sparkles"></i> Available Monsters
          </h3>
          <div className="nursery-monsters__grid">
            {currentEggData.monsters.map((monster, index) => {
              const isClaimedWithEdenwiess = claimedMonsterIndices.includes(index);
              const isCurrentlySelected = selectedMonsters[currentEggData.eggId] === index;

              let slotClass = 'nursery-monster-slot';
              if (isCurrentlySelected) slotClass += ' nursery-monster-slot--selected';
              if (isEggSelected) slotClass += ' nursery-monster-slot--disabled';
              if (isClaimedWithEdenwiess) slotClass += ' nursery-monster-slot--claimed';

              return (
                <div
                  key={index}
                  className={slotClass}
                  onClick={() => !isEggSelected && !isClaimedWithEdenwiess && handleMonsterSelect(currentEggData.eggId, index)}
                >
                  <MonsterCard
                    monster={monster}
                    linkToDetail={false}
                    fullHeight={false}
                  />

                  {isCurrentlySelected && !isEggSelected && (
                    <div className="nursery-selection-overlay">
                      <div className="nursery-selection-overlay__check">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    </div>
                  )}

                  {isClaimedWithEdenwiess && (
                    <div className="nursery-claimed-overlay">
                      <div className="nursery-claimed-badge">
                        <i className="fas fa-star"></i>
                        <span>Claimed</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Special Berry Actions */}
        {!isEggSelected && session.specialBerries && (
          <div className="nursery-special-actions">
            <h4 className="nursery-special-actions__title">
              <i className="fas fa-magic"></i> Special Options
            </h4>
            <div className="nursery-special-actions__grid">
              {session.specialBerries['Forget-Me-Not'] > 0 && (
                <button
                  className="nursery-special-button nursery-special-button--forget-me-not"
                  onClick={handleRerollEgg}
                  disabled={submitting}
                  title="Reroll this egg using a Forget-Me-Not berry"
                >
                  <div className="nursery-special-button__icon">
                    <i className="fas fa-dice"></i>
                  </div>
                  <div className="nursery-special-button__content">
                    <span className="nursery-special-button__title">Forget-Me-Not</span>
                    <span className="nursery-special-button__description">
                      Reroll egg ({session.specialBerries['Forget-Me-Not']} available)
                    </span>
                  </div>
                </button>
              )}

              {selectedMonsters[currentEggData.eggId] !== undefined && session.specialBerries['Edenwiess'] > 0 && (
                <button
                  className="nursery-special-button nursery-special-button--edenwiess"
                  onClick={() => handleClaimWithEdenwiess(currentEggData.eggId)}
                  disabled={submitting}
                  title="Claim this monster as an extra using an Edenwiess berry"
                >
                  <div className="nursery-special-button__icon">
                    <i className="fas fa-plus-circle"></i>
                  </div>
                  <div className="nursery-special-button__content">
                    <span className="nursery-special-button__title">Use Edenwiess</span>
                    <span className="nursery-special-button__description">
                      Claim as extra ({session.specialBerries['Edenwiess']} available)
                    </span>
                  </div>
                </button>
              )}
            </div>

            {session.specialBerries['Edenwiess'] > 0 && (
              <div className="nursery-edenwiess-help">
                <i className="fas fa-info-circle"></i>
                <div className="nursery-edenwiess-help__text">
                  <strong>Edenwiess Tip:</strong> Select a monster and use "Edenwiess" to claim it as extra,
                  then select another monster to complete the egg.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Section */}
        {!isEggSelected && (
          <div className="nursery-egg__actions">
            {/* Naming (bottom duplicate for convenience) */}
            {renderNamingSection()}

            <button
              className="button primary"
              onClick={() => handleSelectMonster(currentEggData.eggId)}
              disabled={submitting || selectedMonsters[currentEggData.eggId] === undefined}
            >
              {submitting ? (
                <><LoadingSpinner size="sm" message="" /> Selecting Monster...</>
              ) : (
                <>
                  <i className="fas fa-check"></i>{' '}
                  {currentEggClaims > 0 ? 'Select This Monster (Final)' : 'Select This Monster'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Selected State */}
        {isEggSelected && (
          <div className="nursery-egg-selected">
            <div className="nursery-egg-selected__content">
              <div className="nursery-egg-selected__icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="nursery-egg-selected__info">
                <h4>Monster Selected!</h4>
                <p>You chose: <strong>{session.selectedMonsters[currentEggData.eggId]?.monsterName}</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className="nursery-status">
          {statusMessage.type === 'success' ? (
            <SuccessMessage message={statusMessage.message} />
          ) : (
            <ErrorMessage message={statusMessage.message} />
          )}
        </div>
      )}
    </div>
  );
}
