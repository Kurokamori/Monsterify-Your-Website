import { TypeBadge } from '@components/common/TypeBadge';
import { AttributeBadge } from '@components/common/AttributeBadge';
import type { BattleMonster } from '@services/battleService';
import { activeStatStages, formatStage } from '../battleStats';
import { GenderIcon } from './GenderIcon';

/**
 * The detail read-out for a battling monster: everything the info card beside it on the
 * field is too small to carry — its full species and type lists, its attribute, its
 * gender, and any stat stages it is currently riding.
 *
 * Positioning is not its concern; useMonsterHoverPanel places it.
 */
export function MonsterDetailPanel({
  monster,
  panelId,
}: {
  monster: BattleMonster;
  panelId: string;
}) {
  const stages = activeStatStages(monster.statStages);
  // Battles that predate speciesList only carry the joined label; split it back apart.
  const species = monster.speciesList?.length
    ? monster.speciesList
    : monster.species.split('/').map((s) => s.trim()).filter(Boolean);
  const hpPct = monster.maxHp > 0 ? Math.round((monster.currentHp / monster.maxHp) * 100) : 0;

  return (
    <div className="battle-hover-panel" id={panelId} role="tooltip">
      <div className="battle-hover-panel__head">
        <span className="battle-hover-panel__name">
          {monster.name}
          <GenderIcon gender={monster.gender} />
        </span>
        <span className="battle-hover-panel__level">Lv. {monster.level}</span>
      </div>

      <div className="battle-hover-panel__hp">
        <span>{monster.currentHp} / {monster.maxHp} HP</span>
        <span className="battle-hover-panel__hp-pct">{hpPct}%</span>
      </div>

      {species.length > 0 && (
        <div className="battle-hover-panel__row">
          <span className="battle-hover-panel__label">Species</span>
          <span className="battle-hover-panel__species">
            {species.map((s) => (
              <span key={s} className="battle-species-chip">{s}</span>
            ))}
          </span>
        </div>
      )}

      {monster.types.length > 0 && (
        <div className="battle-hover-panel__row">
          <span className="battle-hover-panel__label">Types</span>
          <span className="battle-hover-panel__badges">
            {monster.types.map((t) => <TypeBadge key={t} type={t} size="xs" />)}
          </span>
        </div>
      )}

      {monster.attribute && (
        <div className="battle-hover-panel__row">
          <span className="battle-hover-panel__label">Attribute</span>
          <span className="battle-hover-panel__badges">
            <AttributeBadge attribute={monster.attribute} size="xs" />
          </span>
        </div>
      )}

      {monster.statusEffects.length > 0 && (
        <div className="battle-hover-panel__row">
          <span className="battle-hover-panel__label">Status</span>
          <span className="battle-hover-panel__badges">
            {monster.statusEffects.map((s) => (
              <span
                key={s}
                className={`battle-status-chip battle-status-chip--${s.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {s}
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="battle-hover-panel__row">
        <span className="battle-hover-panel__label">Stat changes</span>
        {stages.length === 0 ? (
          <span className="battle-hover-panel__none">None</span>
        ) : (
          <span className="battle-hover-panel__stages">
            {stages.map((s) => (
              <span
                key={s.key}
                className={`battle-stat-stage battle-stat-stage--${s.stage > 0 ? 'up' : 'down'}`}
                title={`${s.long} ${formatStage(s.stage)}`}
              >
                <i className={`fas fa-caret-${s.stage > 0 ? 'up' : 'down'}`} />
                {s.short} {formatStage(s.stage)}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
