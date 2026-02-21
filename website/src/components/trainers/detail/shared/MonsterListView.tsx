import { Link } from 'react-router-dom';
import type { TrainerMonster } from '@services/trainerService';

interface MonsterListViewProps {
  monsters: TrainerMonster[];
  title?: string;
}

export const MonsterListView = ({ monsters, title }: MonsterListViewProps) => {
  if (monsters.length === 0) {
    return (
      <div className="no-monsters-message">
        <i className="fas fa-dragon-slash"></i>
        <p>No monsters to display.</p>
      </div>
    );
  }

  return (
    <div className="monsters-detailed-list">
      {title && <h3>{title}</h3>}
      <div className="detailed-list-row">
        <span>Name</span>
        <span>Species 1</span>
        <span>Species 2</span>
        <span>Species 3</span>
        <span>Type 1</span>
        <span>Type 2</span>
        <span>Type 3</span>
        <span>Type 4</span>
        <span>Type 5</span>
      </div>
      <div className="detailed-list-body">
        {monsters.map((monster, index) => (
          <Link to={`/monsters/${monster.id}`} className="detailed-list-row" key={monster.id || index}>
            <span className="monster-name">{monster.name || 'Unknown'}</span>
            <span className="monster-species">{(monster.species1 as string) || '-'}</span>
            <span className="monster-species">{(monster.species2 as string) || '-'}</span>
            <span className="monster-species">{(monster.species3 as string) || '-'}</span>
            <span className={`monster-type type-${((monster.type1 as string) || 'normal').toLowerCase()}`}>
              {(monster.type1 as string) || '-'}
            </span>
            <span className={`monster-type${monster.type2 ? ` type-${(monster.type2 as string).toLowerCase()}` : ''}`}>
              {(monster.type2 as string) || '-'}
            </span>
            <span className={`monster-type${monster.type3 ? ` type-${(monster.type3 as string).toLowerCase()}` : ''}`}>
              {(monster.type3 as string) || '-'}
            </span>
            <span className={`monster-type${monster.type4 ? ` type-${(monster.type4 as string).toLowerCase()}` : ''}`}>
              {(monster.type4 as string) || '-'}
            </span>
            <span className={`monster-type${monster.type5 ? ` type-${(monster.type5 as string).toLowerCase()}` : ''}`}>
              {(monster.type5 as string) || '-'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
