import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import missionService from '../../../services/missionService';
import { MissionCard } from './MissionCard';
import type { Mission, EligibleMonster } from './types';

const getMonsterTypes = (m: EligibleMonster): string[] =>
  [m.type1, m.type2, m.type3, m.type4, m.type5].filter((t): t is string => t != null);

const MissionStartPage = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();

  const [mission, setMission] = useState<Mission | null>(null);
  const [monsters, setMonsters] = useState<EligibleMonster[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useDocumentTitle(mission ? `Start: ${mission.title}` : 'Start Mission');

  const fetchData = useCallback(async () => {
    if (!missionId) return;
    try {
      setLoading(true);
      setError(null);

      const [missionRes, monstersRes] = await Promise.all([
        missionService.getMissionById(missionId),
        missionService.getEligibleMonsters(missionId),
      ]);

      if (missionRes.success && missionRes.data) {
        setMission(missionRes.data);
      } else {
        setError('Mission not found.');
        return;
      }

      // Filter monsters with valid images
      const eligible: EligibleMonster[] = (monstersRes.data ?? []).filter(
        (m: EligibleMonster) => m.img_link && m.img_link !== '' && m.img_link !== 'null'
      );
      setMonsters(eligible);
    } catch {
      setError('Failed to load mission data.');
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMonster = (monsterId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(monsterId)) {
        next.delete(monsterId);
      } else if (mission && next.size < mission.maxMonsters) {
        next.add(monsterId);
      }
      return next;
    });
  };

  const handleStart = async () => {
    if (!missionId || selected.size === 0) return;
    try {
      setStarting(true);
      const response = await missionService.startMission(missionId, Array.from(selected));
      if (response.success) {
        navigate('/adventures?tab=missions');
      } else {
        setError(response.message ?? 'Failed to start mission.');
      }
    } catch {
      setError('Failed to start mission. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="mission-start">
      <div className="mission-start__nav">
        <button className="button secondary" onClick={() => navigate('/adventures?tab=missions')}>
          <i className="fas fa-arrow-left"></i> Back to Missions
        </button>
      </div>

      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={!mission}
        onRetry={fetchData}
        loadingMessage="Loading mission details..."
        emptyMessage="Mission not found."
        emptyIcon="fas fa-scroll"
      >
        {mission && (
          <>
            {/* Mission details */}
            <MissionCard mission={mission} />

            {/* Monster selection */}
            <div className="mission-start__selection">
              <h3 className="section-title">
                <i className="fas fa-paw"></i>
                Select Monsters ({selected.size}/{mission.maxMonsters})
              </h3>

              {monsters.length === 0 ? (
                <div className="mission-start__empty">
                  <i className="fas fa-search"></i>
                  <p>No eligible monsters found for this mission.</p>
                  <p>Make sure you have monsters that meet the level and type requirements.</p>
                </div>
              ) : (
                <div className="monster-select-grid">
                  {monsters.map((monster) => {
                    const isSelected = selected.has(monster.id);
                    const isDisabled = !isSelected && selected.size >= mission.maxMonsters;
                    const types = getMonsterTypes(monster);

                    return (
                      <button
                        key={monster.id}
                        type="button"
                        className={[
                          'mission-monster-card',
                          isSelected && 'mission-monster-card--selected',
                          isDisabled && 'mission-monster-card--disabled',
                        ].filter(Boolean).join(' ')}
                        onClick={() => toggleMonster(monster.id)}
                        disabled={isDisabled}
                      >
                        <div className="mission-monster-card__image">
                          <img
                            src={monster.img_link || '/images/default_monster.png'}
                            alt={monster.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/images/default_monster.png';
                            }}
                          />
                          {isSelected && (
                            <div className="mission-monster-card__check">
                              <i className="fas fa-check"></i>
                            </div>
                          )}
                        </div>
                        <div className="mission-monster-card__info">
                          <span className="mission-monster-card__name">{monster.name}</span>
                          <span className="mission-monster-card__level">Lv. {monster.level}</span>
                          {monster.trainer_name && (
                            <span className="mission-monster-card__trainer">{monster.trainer_name}</span>
                          )}
                          {types.length > 0 && (
                            <div className="mission-monster-card__types">
                              {types.map((type) => (
                                <span key={type} className="badge badge--type sm">{type}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Start button */}
            {monsters.length > 0 && (
              <div className="mission-start__actions">
                <button
                  className="button primary lg"
                  onClick={handleStart}
                  disabled={selected.size === 0 || starting}
                >
                  {starting ? (
                    <><i className="fas fa-spinner fa-spin"></i> Starting Mission...</>
                  ) : (
                    <><i className="fas fa-play"></i> Start Mission</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </AutoStateContainer>
    </div>
  );
};

export default MissionStartPage;
