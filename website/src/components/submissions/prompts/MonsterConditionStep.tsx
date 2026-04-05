import { useState } from 'react';
import submissionService from '../../../services/submissionService';
import type {
  MonsterConditionResult,
  MonsterCondition,
} from '../../../services/submissionService';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { SuccessMessage } from '../../common/SuccessMessage';

interface MonsterConditionStepProps {
  conditionResults: MonsterConditionResult[];
  promptConditions?: MonsterCondition[];
  promptSubmissionId: number;
  onComplete: () => void;
}

export function MonsterConditionStep({
  conditionResults,
  promptSubmissionId,
  onComplete,
}: MonsterConditionStepProps) {
  const [selections, setSelections] = useState<Record<string, Set<number>>>({});
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [appliedResults, setAppliedResults] = useState<MonsterConditionResult[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const autoResults = conditionResults.filter(r => r.applicationMode === 'auto');
  const optInResults = conditionResults.filter(r => r.applicationMode === 'opt-in');
  const hasOptIn = optInResults.some(r => (r.eligibleMonsters?.length ?? 0) > 0);

  const toggleMonsterSelection = (conditionId: string, monsterId: number) => {
    setSelections(prev => {
      const current = new Set(prev[conditionId] ?? []);
      if (current.has(monsterId)) {
        current.delete(monsterId);
      } else {
        current.add(monsterId);
      }
      return { ...prev, [conditionId]: current };
    });
  };

  const handleApply = async () => {
    const selectionsArray = Object.entries(selections)
      .filter(([, monsterIds]) => monsterIds.size > 0)
      .map(([conditionId, monsterIds]) => ({
        conditionId,
        monsterIds: Array.from(monsterIds),
      }));

    if (selectionsArray.length === 0 && hasOptIn) {
      setError('Please select at least one monster to apply conditions to, or click Continue to skip.');
      return;
    }

    if (selectionsArray.length === 0) {
      onComplete();
      return;
    }

    try {
      setApplying(true);
      setError('');

      const result = await submissionService.applyMonsterConditions(promptSubmissionId, selectionsArray);

      if (result.success) {
        setApplied(true);
        setAppliedResults(result.results || []);
        setSuccessMessage('Monster conditions applied successfully!');
      }
    } catch (err) {
      console.error('Error applying monster conditions:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to apply monster conditions';
      setError(errorMessage);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="prompt-rewards-claiming">
      {successMessage && (
        <SuccessMessage message={successMessage} onClose={() => setSuccessMessage('')} />
      )}
      <ErrorModal isOpen={!!error} onClose={() => setError('')} message={error} title="Error" />

      {/* Auto-Applied Results */}
      {autoResults.length > 0 && (
        <div className="form-section">
          <h3>
            <i className="fas fa-bolt"></i>
            {' '}Auto-Applied Bonuses
          </h3>
          {autoResults.map(result => (
            <div key={result.conditionId} style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{result.label}</p>
              {result.autoResults && result.autoResults.length > 0 ? (
                <div className="rewards-grid">
                  {result.autoResults.map((ar, idx) => (
                    <div key={idx} className="reward-item">
                      <i className="fas fa-dragon"></i>
                      <span>
                        {ar.monsterName} ({ar.trainerName})
                        {ar.effectApplied.bonusLevels ? ` +${ar.effectApplied.bonusLevels} levels` : ''}
                        {ar.effectApplied.bonusCoins ? ` +${ar.effectApplied.bonusCoins} coins` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="form-help-text">No monsters qualified for this condition.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Opt-In Selections */}
      {optInResults.length > 0 && !applied && (
        <div className="form-section">
          <h3>
            <i className="fas fa-hand-pointer"></i>
            {' '}Select Monsters to Upgrade
          </h3>

          {optInResults.map(result => (
            <div key={result.conditionId} style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{result.label}</p>

              {result.eligibleMonsters && result.eligibleMonsters.length > 0 ? (
                <div className="monster-claim-grid">
                  {result.eligibleMonsters.map(monster => {
                    const isSelected = selections[result.conditionId]?.has(monster.monsterId) ?? false;
                    return (
                      <div
                        key={monster.monsterId}
                        className={`monster-claim-card ${isSelected ? 'claimed' : ''}`}
                        onClick={() => toggleMonsterSelection(result.conditionId, monster.monsterId)}
                        style={{ cursor: 'pointer', border: isSelected ? '2px solid var(--success-color, #4caf50)' : '1px solid var(--border-color)' }}
                      >
                        <div className="monster-preview">
                          {monster.imgLink ? (
                            <img src={monster.imgLink} alt={monster.monsterName} />
                          ) : (
                            <div className="monster-placeholder">
                              <i className="fas fa-dragon"></i>
                            </div>
                          )}
                        </div>
                        <div className="monster-info">
                          <h4>{monster.monsterName}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {monster.trainerName}
                          </p>
                          <p style={{ fontSize: '0.85rem' }}>
                            {[monster.species1, monster.species2, monster.species3].filter(Boolean).join(' / ')}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.2rem' }}>
                            {[monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
                              .filter((t): t is string => !!t)
                              .map(type => (
                                <span
                                  key={type}
                                  className={`type-badge type-${type.toLowerCase()}`}
                                >
                                  {type}
                                </span>
                              ))}
                          </div>
                          {monster.attribute && (
                            <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                              <span className="attribute-badge">{monster.attribute}</span>
                            </p>
                          )}
                          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Current Speech: Level {String(monster.currentValue)}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMonsterSelection(result.conditionId, monster.monsterId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="form-help-text">No monsters are eligible for this condition.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Applied Results */}
      {applied && appliedResults.length > 0 && (
        <div className="form-section">
          <h3>
            <i className="fas fa-check-circle"></i>
            {' '}Conditions Applied
          </h3>
          {appliedResults.map(result => (
            <div key={result.conditionId} style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{result.label}</p>
              {result.autoResults && result.autoResults.length > 0 && (
                <div className="rewards-grid">
                  {result.autoResults.map((ar, idx) => (
                    <div key={idx} className="reward-item">
                      <i className="fas fa-check"></i>
                      <span>
                        {ar.monsterName}
                        {ar.effectApplied.newCanTalkLevel !== undefined
                          ? ` upgraded to speech level ${ar.effectApplied.newCanTalkLevel}`
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="form-section">
        <div className="wizard-navigation">
          {!applied && hasOptIn ? (
            <>
              <button
                className="button secondary lg"
                onClick={onComplete}
                disabled={applying}
              >
                Skip
              </button>
              <button
                className="button primary lg"
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? (
                  <>
                    <LoadingSpinner size="small" />
                    Applying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Apply Selected
                  </>
                )}
              </button>
            </>
          ) : (
            <button className="button primary lg" onClick={onComplete}>
              <i className="fas fa-arrow-right"></i>
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
