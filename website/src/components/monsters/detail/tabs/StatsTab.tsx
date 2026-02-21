import type { Monster } from '@services/monsterService';

interface StatConfig {
  key: string;
  label: string;
  barClass: string;
  totalKey: string;
  ivKey: string;
  evKey: string;
  maxStat: number;
}

const STAT_CONFIG: StatConfig[] = [
  { key: 'hp', label: 'HP', barClass: 'stat-bar--hp', totalKey: 'hp_total', ivKey: 'hp_iv', evKey: 'hp_ev', maxStat: 714 },
  { key: 'atk', label: 'Atk', barClass: 'stat-bar--atk', totalKey: 'atk_total', ivKey: 'atk_iv', evKey: 'atk_ev', maxStat: 526 },
  { key: 'def', label: 'Def', barClass: 'stat-bar--def', totalKey: 'def_total', ivKey: 'def_iv', evKey: 'def_ev', maxStat: 614 },
  { key: 'spa', label: 'SpA', barClass: 'stat-bar--spa', totalKey: 'spa_total', ivKey: 'spa_iv', evKey: 'spa_ev', maxStat: 526 },
  { key: 'spd', label: 'SpD', barClass: 'stat-bar--spd', totalKey: 'spd_total', ivKey: 'spd_iv', evKey: 'spd_ev', maxStat: 614 },
  { key: 'spe', label: 'Spe', barClass: 'stat-bar--spe', totalKey: 'spe_total', ivKey: 'spe_iv', evKey: 'spe_ev', maxStat: 504 },
];

function getStatColorClass(value: number, maxStat: number): string {
  const percentage = (value / maxStat) * 100;
  if (percentage >= 85) return 'stat-color--legendary';
  if (percentage >= 70) return 'stat-color--excellent';
  if (percentage >= 50) return 'stat-color--great';
  if (percentage >= 35) return 'stat-color--good';
  if (percentage >= 20) return 'stat-color--average';
  return 'stat-color--low';
}

interface StatsTabProps {
  monster: Monster;
}

export const StatsTab = ({ monster }: StatsTabProps) => {
  const getVal = (key: string): number => (monster[key] as number) || 0;

  const totalStats = STAT_CONFIG.reduce((sum, s) => sum + getVal(s.totalKey), 0);
  const totalIVs = STAT_CONFIG.reduce((sum, s) => sum + getVal(s.ivKey), 0);
  const totalEVs = STAT_CONFIG.reduce((sum, s) => sum + getVal(s.evKey), 0);
  const avgIV = Math.round((totalIVs / 6) * 10) / 10;

  return (
    <div className="town-square">
      <div className="trainer-detail__stats-section">
        <h2>Base Stats</h2>
        <div className="monster-stats-grid">
          {STAT_CONFIG.map((stat) => {
            const value = getVal(stat.totalKey);
            const iv = getVal(stat.ivKey);
            const ev = getVal(stat.evKey);
            const pct = Math.min((value / stat.maxStat) * 100, 100);

            return (
              <div className="monster-stat-row" key={stat.key}>
                <span className="monster-stat-label">{stat.label}</span>
                <span className={`monster-stat-value ${getStatColorClass(value, stat.maxStat)}`}>
                  {value}
                </span>
                <div className="monster-stat-bar-track">
                  <div
                    className={`monster-stat-bar-fill ${stat.barClass}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                <div className="monster-iv-ev">
                  <span className="monster-iv" title={`IV: ${iv}/31`}>
                    <span className="monster-iv-ev-label">IV</span>
                    <span className="monster-iv-ev-value">{iv}</span>
                  </span>
                  <span className="monster-ev" title={`EV: ${ev}/252`}>
                    <span className="monster-iv-ev-label">EV</span>
                    <span className="monster-iv-ev-value">{ev}</span>
                  </span>
                </div>
              </div>
            );
          })}

          <div className="monster-stat-row monster-stat-row--total">
            <span className="monster-stat-label">Total</span>
            <span className="monster-stat-value monster-stat-total-value">{totalStats}</span>
            <div className="monster-stat-bar-track"></div>
            <div className="monster-iv-ev"></div>
          </div>
        </div>

        <div className="monster-stats-summary">
          <div className="monster-stats-summary-item">
            <span className="detail-label">Average IV</span>
            <span className="detail-value">{avgIV}</span>
          </div>
          <div className="monster-stats-summary-item">
            <span className="detail-label">Total EVs</span>
            <span className="detail-value">{totalEVs}/510</span>
          </div>
        </div>
      </div>
    </div>
  );
};
