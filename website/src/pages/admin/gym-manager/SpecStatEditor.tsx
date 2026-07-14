/**
 * SpecStatEditor
 *
 * Optional difficulty controls for a generated battle monster (gym leader /
 * gauntlet trainer team member). Collapsed by default: a designer who ignores it
 * gets the server's medium/balanced preset, which puts the monster on par with an
 * average player-owned monster of the same level.
 *
 * Two ways to author:
 *  - Roll from a difficulty + role preset (difficulty sets how strong, role sets
 *    what shape that strength takes).
 *  - Enter nature / IVs / EVs by hand.
 *
 * Totals are never computed here. They come from the server's stat curve — the
 * same one the battle itself runs — so the preview cannot drift from reality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import battleService, {
  type BattleStatSpec,
  type StatSpread,
  type SpecStatPresets,
  type SpecMonsterStatPreview,
} from '@services/battleService';

const STAT_KEYS: Array<keyof StatSpread> = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

const STAT_LABELS: Record<keyof StatSpread, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
};

const TOTAL_KEYS: Array<{ key: keyof SpecMonsterStatPreview['totals']; label: string }> = [
  { key: 'hp_total', label: 'HP' },
  { key: 'atk_total', label: 'Atk' },
  { key: 'def_total', label: 'Def' },
  { key: 'spa_total', label: 'SpA' },
  { key: 'spd_total', label: 'SpD' },
  { key: 'spe_total', label: 'Spe' },
];

const FALLBACK_BOUNDS = { maxIv: 31, maxEvPerStat: 252, maxEvTotal: 510 };

const sumSpread = (spread: StatSpread): number =>
  STAT_KEYS.reduce((sum, key) => sum + (Number(spread[key]) || 0), 0);

export function SpecStatEditor({
  level,
  stats,
  presets,
  onChange,
}: {
  level: number;
  stats: BattleStatSpec | null | undefined;
  presets: SpecStatPresets | null;
  onChange: (stats: BattleStatSpec | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState('');
  const [role, setRole] = useState('');
  const [preview, setPreview] = useState<SpecMonsterStatPreview | null>(null);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState('');

  const bounds = presets?.bounds ?? FALLBACK_BOUNDS;
  const isCustom = Boolean(stats);

  // Seed the roller selects from the server's defaults once presets arrive.
  useEffect(() => {
    if (!presets) return;
    setDifficulty(prev => prev || presets.defaults.difficulty);
    setRole(prev => prev || presets.defaults.role);
  }, [presets]);

  // Ask the server what these inputs actually produce at this level. Debounced so
  // dragging a number input doesn't fire a request per keystroke. Only while the
  // section is open — a collapsed editor has nothing to show.
  const requestSeq = useRef(0);
  useEffect(() => {
    if (!open) return;

    const seq = ++requestSeq.current;
    const timer = window.setTimeout(() => {
      battleService
        .adminPreviewSpecStats(level, stats ?? null)
        .then(result => {
          // Ignore a response that a newer edit has already superseded.
          if (seq === requestSeq.current) {
            setPreview(result);
            setError('');
          }
        })
        .catch(() => {
          if (seq === requestSeq.current) {
            setError('Could not preview stats.');
          }
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, level, stats]);

  const handleRoll = useCallback(async () => {
    if (!difficulty || !role) return;
    setRolling(true);
    setError('');
    try {
      const result = await battleService.adminRollSpecStats(level, difficulty, role);
      setPreview(result);
      onChange(result.stats);
    } catch {
      setError('Could not roll stats.');
    } finally {
      setRolling(false);
    }
  }, [level, difficulty, role, onChange]);

  // Editing any field on an untuned spec promotes it to custom, seeded from
  // whatever the server currently resolves it to, so nothing jumps unexpectedly.
  const baseSpec = (): BattleStatSpec | null => stats ?? preview?.stats ?? null;

  const setNature = (nature: string) => {
    const base = baseSpec();
    if (!base) return;
    onChange({ ...base, nature });
  };

  const setStatValue = (group: 'ivs' | 'evs', key: keyof StatSpread, raw: string) => {
    const base = baseSpec();
    if (!base) return;
    const max = group === 'ivs' ? bounds.maxIv : bounds.maxEvPerStat;
    const value = Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
    onChange({ ...base, [group]: { ...base[group], [key]: value } });
  };

  const activeRole = presets?.roles.find(r => r.value === role);
  const evTotal = stats ? sumSpread(stats.evs) : preview ? sumSpread(preview.stats.evs) : 0;
  const evOverBudget = evTotal > bounds.maxEvTotal;

  const summary = isCustom
    ? `Custom · ${stats?.nature ?? '—'}`
    : 'Default (Medium · Balanced)';

  return (
    <div className={`gym-manager__stats${open ? ' gym-manager__stats--open' : ''}`}>
      <button
        type="button"
        className="gym-manager__stats-toggle"
        onClick={() => setOpen(!open)}
      >
        <i className={`fas fa-chevron-${open ? 'down' : 'right'}`} />
        <span>Stats &amp; Difficulty</span>
        <span className={`gym-manager__stats-badge${isCustom ? ' gym-manager__stats-badge--custom' : ''}`}>
          {summary}
        </span>
      </button>

      {open && (
        <div className="gym-manager__stats-content">
          <p className="gym-manager__stats-note">
            Stats are derived from the same level curve player monsters use, so a level-{level}{' '}
            monster here is comparable to a level-{level} trainer monster. Leave this alone for a
            fair fight; tune it to make a leader genuinely harder.
          </p>

          <div className="gym-manager__stats-roller">
            <div className="gym-manager__field">
              <label>Difficulty</label>
              <select
                className="gym-manager__input"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                {(presets?.difficulties ?? []).map(d => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="gym-manager__field gym-manager__field--grow">
              <label>Role</label>
              <select
                className="gym-manager__input"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                {(presets?.roles ?? []).map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="button primary sm"
              onClick={handleRoll}
              disabled={rolling || !presets}
            >
              <i className={`fas fa-${rolling ? 'spinner fa-spin' : 'dice'}`} /> Roll
            </button>
          </div>

          {activeRole && <p className="gym-manager__stats-hint">{activeRole.description}</p>}

          {!isCustom && (
            <p className="gym-manager__stats-hint">
              Roll a preset, or click below to start editing from the default spread.
            </p>
          )}

          <div className="gym-manager__stats-grid">
            <div className="gym-manager__field">
              <label>Nature</label>
              <select
                className="gym-manager__input"
                value={stats?.nature ?? preview?.stats.nature ?? ''}
                disabled={!baseSpec()}
                onChange={e => setNature(e.target.value)}
              >
                {(presets?.natures ?? []).map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="gym-manager__field gym-manager__field--grow">
              <label>IVs <span className="gym-manager__optional">(0–{bounds.maxIv})</span></label>
              <div className="gym-manager__stats-row">
                {STAT_KEYS.map(key => (
                  <div key={key} className="gym-manager__stats-cell">
                    <span>{STAT_LABELS[key]}</span>
                    <input
                      className="gym-manager__input"
                      type="number"
                      min={0}
                      max={bounds.maxIv}
                      disabled={!baseSpec()}
                      value={stats?.ivs[key] ?? preview?.stats.ivs[key] ?? 0}
                      onChange={e => setStatValue('ivs', key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="gym-manager__field gym-manager__field--grow">
              <label>
                EVs <span className="gym-manager__optional">(0–{bounds.maxEvPerStat} each)</span>
                <span className={`gym-manager__ev-total${evOverBudget ? ' gym-manager__ev-total--over' : ''}`}>
                  {evTotal} / {bounds.maxEvTotal}
                </span>
              </label>
              <div className="gym-manager__stats-row">
                {STAT_KEYS.map(key => (
                  <div key={key} className="gym-manager__stats-cell">
                    <span>{STAT_LABELS[key]}</span>
                    <input
                      className="gym-manager__input"
                      type="number"
                      min={0}
                      max={bounds.maxEvPerStat}
                      disabled={!baseSpec()}
                      value={stats?.evs[key] ?? preview?.stats.evs[key] ?? 0}
                      onChange={e => setStatValue('evs', key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              {evOverBudget && (
                <p className="gym-manager__stats-warn">
                  Over the {bounds.maxEvTotal} EV budget — the server will scale this spread down
                  proportionally when the battle starts.
                </p>
              )}
            </div>
          </div>

          {preview && (
            <div className="gym-manager__stats-preview">
              <span className="gym-manager__stats-preview-label">
                At level {preview.level}:
              </span>
              {TOTAL_KEYS.map(({ key, label }) => (
                <span key={key} className="gym-manager__stats-preview-stat">
                  <em>{label}</em> {preview.totals[key]}
                </span>
              ))}
              <span className="gym-manager__stats-preview-stat">
                <em>Battle HP</em> {preview.battleHp}
              </span>
            </div>
          )}

          {error && <p className="gym-manager__stats-warn">{error}</p>}

          {isCustom && (
            <button
              type="button"
              className="button secondary sm"
              onClick={() => onChange(null)}
            >
              <i className="fas fa-rotate-left" /> Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SpecStatEditor;
