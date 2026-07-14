import type { BattleMonster } from '@services/battleService';
import { handleMonImgError } from '../battleMonsterUtils';
import { hpBarTier } from '../battleStats';
import { useMonsterHoverPanel } from './useMonsterHoverPanel';
import { GenderIcon } from './GenderIcon';

/**
 * A benched monster you can switch to.
 *
 * Its own component rather than inline in the team bar because it owns a hover panel,
 * and a hook cannot be called from inside the bench's map.
 */
export function BenchMonsterButton({
  monster,
  disabled,
  onSwitch,
}: {
  monster: BattleMonster;
  disabled: boolean;
  onSwitch: () => void;
}) {
  const { anchorProps, panel } = useMonsterHoverPanel(monster);
  const pct = monster.maxHp > 0 ? Math.max(0, (monster.currentHp / monster.maxHp) * 100) : 0;

  return (
    <>
      <button
        {...anchorProps}
        className={`battle-bench-monster ${monster.isFainted ? 'fainted' : ''}`}
        disabled={disabled}
        onClick={onSwitch}
      >
        <img src={monster.imgLink || '/images/default_mon.png'} alt={monster.name} onError={handleMonImgError} />
        <span className="battle-bench-monster__name">
          {monster.name}
          <GenderIcon gender={monster.gender} />
        </span>
        <span className="battle-bench-monster__hp">
          <span
            className={`battle-bench-monster__hp-fill battle-hp__fill--${hpBarTier(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </span>
      </button>
      {panel}
    </>
  );
}
