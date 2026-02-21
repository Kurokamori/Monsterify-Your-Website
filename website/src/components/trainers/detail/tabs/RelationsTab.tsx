import { Link } from 'react-router-dom';
import type { Trainer, TrainerRelation } from '@components/trainers/types/Trainer';

interface RelationsTabProps {
  trainer: Trainer;
  relatedTrainers: Record<string, Trainer>;
  relatedMonsters: Record<string, unknown>;
}

export const RelationsTab = ({ trainer, relatedTrainers, relatedMonsters }: RelationsTabProps) => {
  let relations: TrainerRelation[] = [];
  try {
    relations = typeof trainer.relations === 'string'
      ? JSON.parse(trainer.relations)
      : trainer.relations || [];
    if (!Array.isArray(relations)) relations = [];
  } catch {
    relations = [];
  }

  if (relations.length === 0) {
    return (
      <div className="trainer-relations-tab">
        <h2>Relations</h2>
        <div className="no-relations-message">
          <i className="fas fa-users"></i>
          <p>This trainer doesn't have any documented relations yet.</p>
        </div>
      </div>
    );
  }

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_trainer.png';
  };

  return (
    <div className="trainer-relations-tab">
      <h2>Relations</h2>
      <div className="relations-grid">
        {relations.map((relation, index) => {
          const isTrainer = relation.type === 'trainer';
          const targetId = String(relation.target_id);
          const relatedTrainer = isTrainer ? relatedTrainers[targetId] : null;
          const relatedMonster = !isTrainer ? (relatedMonsters[targetId] as Record<string, unknown> | undefined) : null;

          const name = relation.target_name ||
            relatedTrainer?.name ||
            (relatedMonster?.name as string) ||
            'Unknown';

          const imgSrc = isTrainer
            ? (relatedTrainer?.main_ref || '/images/default_trainer.png')
            : ((relatedMonster?.img_link as string) || '/images/default_mon.png');

          const linkPath = isTrainer
            ? `/trainers/${relation.target_id}`
            : `/monsters/${relation.target_id}`;

          return (
            <div className="relation-card" key={relation.id || index}>
              <Link to={linkPath} className="relation-link">
                <div className="relation-image-container">
                  <img
                    src={imgSrc}
                    alt={name}
                    className="relation-image"
                    onError={handleImgError}
                  />
                </div>
                <div className="relation-info">
                  <h3 className="relation-name">{name}</h3>
                  <span className={`badge ${isTrainer ? 'info' : 'secondary'} sm`}>
                    {isTrainer ? 'Trainer' : 'Monster'}
                  </span>
                  <p className="relation-type">{relation.relationship}</p>
                  {relation.elaboration && (
                    <p className="relation-elaboration">{relation.elaboration}</p>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
