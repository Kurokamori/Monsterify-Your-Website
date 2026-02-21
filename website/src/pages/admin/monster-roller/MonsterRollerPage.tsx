import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import {
  AdminRoute,
  AutocompleteInput,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
} from '@components/common';
import type { AutocompleteOption } from '@components/common';
import { MonsterRollConfigurator } from '@components/admin/MonsterRollConfigurator';
import type { MonsterRollConfig } from '@components/admin/MonsterRollConfigurator';
import { StarterMonsterCard } from '@components/monsters/StarterMonsterCard';
import trainerService from '@services/trainerService';
import adminService from '@services/adminService';

import '@styles/admin/monster-roller.css';

// ── Types ─────────────────────────────────────────────────────────────

interface RolledMonster {
  name?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  species1_image?: string;
  species2_image?: string;
  species3_image?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  image_url?: string;
  img_link?: string;
  monster_type?: string;
  is_legendary?: boolean;
  is_mythical?: boolean;
  [key: string]: unknown;
}

type AssignResult = { status: 'success' | 'error'; message?: string };

// ── Helpers ───────────────────────────────────────────────────────────

function getAxiosError(err: unknown, fallback: string): string {
  const axiosMessage = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (axiosMessage) return axiosMessage;
  if (err instanceof Error) return err.message;
  return fallback;
}

function getSpeciesLabel(m: RolledMonster): string {
  return [m.species1, m.species2, m.species3].filter(Boolean).join(' / ');
}

// ── Component ─────────────────────────────────────────────────────────

function MonsterRollerContent() {
  useDocumentTitle('Monster Roller');

  // Config
  const [rollConfig, setRollConfig] = useState<MonsterRollConfig | null>(null);
  const [count, setCount] = useState(5);

  // Results
  const [rolledMonsters, setRolledMonsters] = useState<RolledMonster[]>([]);
  const [rolling, setRolling] = useState(false);

  // Trainers
  const [trainerOptions, setTrainerOptions] = useState<AutocompleteOption[]>([]);

  // Assignment
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [trainerSearchValue, setTrainerSearchValue] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<{ id: number; name: string } | null>(null);
  const [monsterName, setMonsterName] = useState('');
  const [monsterLevel, setMonsterLevel] = useState(1);
  const [assigning, setAssigning] = useState(false);
  const [assignResults, setAssignResults] = useState<Map<number, AssignResult>>(new Map());

  // UI
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Fetch trainers on mount ───────────────────────────────────────

  useEffect(() => {
    trainerService.getAllTrainers()
      .then(response => {
        const options: AutocompleteOption[] = response.trainers.map(t => ({
          name: `${t.name}${t.player_display_name ? ` (${t.player_display_name})` : ''}`,
          value: t.id,
          matchNames: [t.name, t.nickname ?? '', t.player_display_name ?? '', t.player_username ?? ''].filter(Boolean),
        }));
        setTrainerOptions(options);
      })
      .catch(err => console.error('Error fetching trainers:', err));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleConfigChange = useCallback((config: MonsterRollConfig) => {
    setRollConfig(config);
  }, []);

  const adjustCount = useCallback((delta: number) => {
    setCount(prev => Math.max(1, Math.min(100, prev + delta)));
  }, []);

  const handleRoll = useCallback(async () => {
    if (!rollConfig) return;

    setRolling(true);
    setError(null);
    setSuccess(null);
    setSelectedCardIndex(null);
    setAssignResults(new Map());

    try {
      const result = await adminService.rollMonstersMany({ ...rollConfig, count });
      setRolledMonsters(result.data as RolledMonster[]);
    } catch (err: unknown) {
      setError(getAxiosError(err, 'Failed to roll monsters'));
    } finally {
      setRolling(false);
    }
  }, [rollConfig, count]);

  const handleCardClick = useCallback((index: number) => {
    if (assignResults.has(index)) return;

    if (selectedCardIndex === index) {
      setSelectedCardIndex(null);
      return;
    }

    setSelectedCardIndex(index);
    setTrainerSearchValue('');
    setSelectedTrainer(null);

    const monster = rolledMonsters[index];
    setMonsterName(monster?.species1 || 'New Monster');
    setMonsterLevel(1);
  }, [assignResults, selectedCardIndex, rolledMonsters]);

  const handleTrainerSelect = useCallback((option: AutocompleteOption | null) => {
    if (option) {
      setSelectedTrainer({ id: Number(option.value), name: option.name });
    } else {
      setSelectedTrainer(null);
    }
  }, []);

  const handleAssignMonster = useCallback(async () => {
    if (selectedCardIndex === null || !selectedTrainer) return;

    const monster = rolledMonsters[selectedCardIndex];
    if (!monster) return;

    setAssigning(true);
    setError(null);

    try {
      await adminService.createAndInitializeMonster({
        trainer_id: selectedTrainer.id,
        name: monsterName || monster.species1 || 'New Monster',
        species1: monster.species1 || '',
        species2: monster.species2,
        species3: monster.species3,
        type1: monster.type1 || '',
        type2: monster.type2,
        type3: monster.type3,
        type4: monster.type4,
        type5: monster.type5,
        attribute: monster.attribute,
        level: monsterLevel,
      });

      setAssignResults(prev => new Map(prev).set(selectedCardIndex, { status: 'success' }));
      setSuccess(`${monsterName || monster.species1} added to ${selectedTrainer.name}`);
      setSelectedCardIndex(null);
      setTrainerSearchValue('');
      setSelectedTrainer(null);
    } catch (err: unknown) {
      const msg = getAxiosError(err, 'Failed to assign monster');
      setAssignResults(prev => new Map(prev).set(selectedCardIndex, { status: 'error', message: msg }));
      setError(msg);
    } finally {
      setAssigning(false);
    }
  }, [selectedCardIndex, selectedTrainer, rolledMonsters, monsterName, monsterLevel]);

  const handleCancelAssign = useCallback(() => {
    setSelectedCardIndex(null);
    setTrainerSearchValue('');
    setSelectedTrainer(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="container vertical gap-lg">
      {/* Header */}
      <div>
        <h1><i className="fas fa-dice-d20"></i> Monster Roller</h1>
        <p className="text-muted">Roll monsters and assign them to trainers</p>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}

      {/* Configuration */}
      <div className="card">
        <div className="card__header">
          <div className="card__header-content">
            <h2 className="card__title"><i className="fas fa-cog"></i> Roll Configuration</h2>
          </div>
        </div>
        <div className="card__body container vertical gap-md p-md">
          <MonsterRollConfigurator onChange={handleConfigChange} />

          {/* Quantity */}
          <div className="container vertical gap-sm">
            <label className="form-label"><i className="fas fa-hashtag"></i> Number of Monsters</label>
            <div className="container align-center gap-sm">
              <button className="button secondary sm" onClick={() => adjustCount(-1)}>-</button>
              <input
                type="number"
                className="input monster-roller__quantity-input"
                value={count}
                onChange={e => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                min={1}
                max={100}
              />
              <button className="button secondary sm" onClick={() => adjustCount(1)}>+</button>
              <span className="text-muted">monsters (max 100)</span>
            </div>
          </div>

          {/* Roll Button */}
          <button className="button primary" onClick={handleRoll} disabled={rolling}>
            {rolling
              ? <><i className="fas fa-spinner fa-spin"></i> Rolling...</>
              : <><i className="fas fa-dice-d20"></i> Roll Monsters</>
            }
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="card__header">
          <div className="card__header-content">
            <h2 className="card__title"><i className="fas fa-dragon"></i> Results</h2>
          </div>
          {rolledMonsters.length > 0 && (
            <div className="card__header-action">
              <span className="text-muted">{rolledMonsters.length} monsters rolled</span>
            </div>
          )}
        </div>
        <div className="card__body p-md">
          {rolling && <LoadingSpinner message="Rolling monsters..." />}

          {!rolling && rolledMonsters.length === 0 && (
            <div className="container vertical center gap-md p-lg">
              <i className="fas fa-dice fa-3x text-muted"></i>
              <p className="text-muted">Configure the roll settings and click &quot;Roll Monsters&quot; to see results</p>
            </div>
          )}

          {!rolling && rolledMonsters.length > 0 && (
            <div className="monster-roller__grid">
              {rolledMonsters.map((monster, index) => {
                const isSelected = selectedCardIndex === index;
                const result = assignResults.get(index);

                return (
                  <div
                    key={index}
                    className={[
                      'monster-roller__card-wrapper',
                      isSelected && 'monster-roller__card-wrapper--selected',
                      result?.status === 'success' && 'monster-roller__card-wrapper--success',
                      result?.status === 'error' && 'monster-roller__card-wrapper--error',
                    ].filter(Boolean).join(' ')}
                  >
                    {/* Monster Card */}
                    <div
                      className="monster-roller__card-clickable"
                      onClick={() => !isSelected && handleCardClick(index)}
                    >
                      <StarterMonsterCard monster={monster} selected={isSelected} />

                      {/* Source table badge */}
                      {monster.monster_type && (
                        <div className="monster-roller__card-source">
                          <span className="badge sm">{monster.monster_type}</span>
                          {monster.is_legendary && <span className="badge sm legendary">Legendary</span>}
                          {monster.is_mythical && <span className="badge sm mythic">Mythical</span>}
                        </div>
                      )}
                    </div>

                    {/* Status overlays */}
                    {result?.status === 'success' && (
                      <div className="monster-roller__card-status monster-roller__card-status--success">
                        <i className="fas fa-check-circle"></i> Assigned
                      </div>
                    )}
                    {result?.status === 'error' && (
                      <div className="monster-roller__card-status monster-roller__card-status--error">
                        <i className="fas fa-exclamation-circle"></i> Failed
                      </div>
                    )}

                    {/* Click hint */}
                    {!result && !isSelected && (
                      <div className="monster-roller__card-hint">
                        <i className="fas fa-user-plus"></i> Click to assign
                      </div>
                    )}

                    {/* Assignment Panel */}
                    {isSelected && (
                      <div className="monster-roller__assign" onClick={e => e.stopPropagation()}>
                        {/* Trainer Selection */}
                        <div className="monster-roller__assign-field">
                          <label className="form-label">Trainer</label>
                          <AutocompleteInput
                            name="trainerSearch"
                            placeholder="Search trainers..."
                            value={trainerSearchValue}
                            onChange={setTrainerSearchValue}
                            options={trainerOptions}
                            onSelect={handleTrainerSelect}
                          />
                        </div>

                        {/* Monster Name */}
                        <div className="monster-roller__assign-field">
                          <label className="form-label">Name</label>
                          <input
                            type="text"
                            className="input"
                            value={monsterName}
                            onChange={e => setMonsterName(e.target.value)}
                            placeholder={getSpeciesLabel(monster) || 'Monster name'}
                          />
                        </div>

                        {/* Level */}
                        <div className="monster-roller__assign-field">
                          <label className="form-label">Level</label>
                          <input
                            type="number"
                            className="input monster-roller__level-input"
                            value={monsterLevel}
                            onChange={e => setMonsterLevel(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                            min={1}
                            max={100}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="container gap-xs">
                          <button
                            className="button success sm"
                            disabled={!selectedTrainer || assigning}
                            onClick={handleAssignMonster}
                          >
                            {assigning
                              ? <><i className="fas fa-spinner fa-spin"></i> Adding...</>
                              : <><i className="fas fa-plus"></i> Add to Trainer</>
                            }
                          </button>
                          <button className="button secondary sm" onClick={handleCancelAssign}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MonsterRollerPage() {
  return (
    <AdminRoute>
      <MonsterRollerContent />
    </AdminRoute>
  );
}
