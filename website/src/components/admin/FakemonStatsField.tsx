import { useState } from 'react';
import '../../styles/admin/fakemon-stats-field.css';

interface StatDef {
  key: string;
  label: string;
  color: string;
}

const STAT_DEFS: StatDef[] = [
  { key: 'hp',             label: 'HP',     color: '#ff5959' },
  { key: 'attack',         label: 'Atk',    color: '#f5ac78' },
  { key: 'defense',        label: 'Def',    color: '#fae078' },
  { key: 'specialAttack',  label: 'Sp.Atk', color: '#9db7f5' },
  { key: 'specialDefense', label: 'Sp.Def', color: '#a7db8d' },
  { key: 'speed',          label: 'Speed',  color: '#fa92b2' },
];

const STAT_TIERS = [
  { value: 'fodder',           label: 'Fodder  (175–240)',            min: 175, max: 240 },
  { value: 'weak',             label: 'Weak  (245–295)',              min: 245, max: 295 },
  { value: 'small',            label: 'Small  (300–355)',             min: 300, max: 355 },
  { value: 'average',          label: 'Average  (360–420)',           min: 360, max: 420 },
  { value: 'above-average',    label: 'Above Average  (425–490)',     min: 425, max: 490 },
  { value: 'strong',           label: 'Strong  (495–565)',            min: 495, max: 565 },
  { value: 'pseudo-legendary', label: 'Pseudo-Legendary  (575–615)',  min: 575, max: 615 },
  { value: 'mythical',         label: 'Mythical  (580–650)',          min: 580, max: 650 },
  { value: 'legendary',        label: 'Legendary  (655–720)',         min: 655, max: 720 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStats(tierValue: string): Record<string, number> {
  const tier = STAT_TIERS.find(t => t.value === tierValue) ?? STAT_TIERS[3];
  const targetBST = randomInt(tier.min, tier.max);

  // Random weights with variance — each stat between 0.5× and 2× average
  const raw = Array.from({ length: 6 }, () => Math.random() * 1.5 + 0.5);
  const sum = raw.reduce((a, b) => a + b, 0);
  const stats = raw.map(w => Math.max(1, Math.min(255, Math.round((w / sum) * targetBST))));

  // Nudge individual stats until BST matches exactly
  let diff = targetBST - stats.reduce((a, b) => a + b, 0);
  for (let iter = 0; Math.abs(diff) > 0 && iter < 600; iter++) {
    const idx = iter % 6;
    if (diff > 0 && stats[idx] < 255) { stats[idx]++; diff--; }
    else if (diff < 0 && stats[idx] > 1) { stats[idx]--; diff++; }
  }

  return {
    hp:             stats[0],
    attack:         stats[1],
    defense:        stats[2],
    specialAttack:  stats[3],
    specialDefense: stats[4],
    speed:          stats[5],
  };
}

interface FakemonStatsFieldProps {
  formValues: Record<string, unknown>;
  formOnChange: (key: string, value: unknown) => void;
  errors: Record<string, string>;
}

export function FakemonStatsField({ formValues, formOnChange, errors }: FakemonStatsFieldProps) {
  const [tier, setTier] = useState('average');

  const getVal = (key: string): number => {
    const v = formValues[key];
    if (v === '' || v == null) return 0;
    return typeof v === 'number' ? v : Number(v);
  };

  const bst = STAT_DEFS.reduce((s, d) => s + getVal(d.key), 0);

  const handleRandom = () => {
    const stats = generateStats(tier);
    Object.entries(stats).forEach(([k, v]) => formOnChange(k, v));
  };

  const handleChange = (key: string, raw: string) => {
    formOnChange(key, raw === '' ? '' : Number(raw));
  };

  return (
    <div className="fk-stats">
      {/* Randomizer bar */}
      <div className="fk-stats__randomizer">
        <span className="fk-stats__random-label">Tier</span>
        <select
          className="fk-stats__tier-select select"
          value={tier}
          onChange={e => setTier(e.target.value)}
        >
          {STAT_TIERS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button type="button" className="button small fk-stats__roll-btn" onClick={handleRandom}>
          <i className="fas fa-dice" /> Random
        </button>
      </div>

      {/* Stats 2×3 grid */}
      <div className="fk-stats__grid">
        {STAT_DEFS.map(stat => {
          const val = getVal(stat.key);
          const rawVal = formValues[stat.key];
          const displayVal = rawVal === '' || rawVal == null ? '' : String(rawVal);
          const pct = Math.min(100, Math.round((val / 255) * 100));
          const hasError = !!errors[stat.key];

          return (
            <div key={stat.key} className={`fk-stat-row${hasError ? ' fk-stat-row--error' : ''}`}>
              <span className="fk-stat-row__label" style={{ color: stat.color }}>
                {stat.label}
              </span>
              <input
                type="number"
                className="fk-stat-row__input"
                value={displayVal}
                onChange={e => handleChange(stat.key, e.target.value)}
                min={0}
                max={255}
              />
              <div className="fk-stat-row__track">
                <div
                  className="fk-stat-row__fill"
                  style={{ width: `${pct}%`, backgroundColor: stat.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* BST total */}
      <div className="fk-stats__bst">
        Base Stat Total: <strong>{bst}</strong>
      </div>
    </div>
  );
}
