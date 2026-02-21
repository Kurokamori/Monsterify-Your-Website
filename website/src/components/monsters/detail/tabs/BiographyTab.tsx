import { Link } from 'react-router-dom';
import { MarkdownRenderer } from '@components/common/MarkdownRenderer';
import type { Monster } from '@services/monsterService';
import type { MonsterRelation, FunFact, RelationEntity } from '../useMonsterDetail';

interface BiographyTabProps {
  monster: Monster;
  relationEntities: Record<string, RelationEntity>;
}

function parseJsonField<T>(value: unknown): T[] {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const BiographyTab = ({ monster, relationEntities }: BiographyTabProps) => {
  const funFacts = parseJsonField<FunFact>(monster.fun_facts);
  const relations = parseJsonField<MonsterRelation>(monster.relations);
  const hasLikes = !!(monster.likes || monster.dislikes);
  const hasBio = !!(monster.bio || monster.biography);
  const hasAnyContent =
    hasLikes ||
    funFacts.length > 0 ||
    relations.length > 0 ||
    !!monster.tldr ||
    hasBio;

  return (
    <div className="town-square">
      {/* Personal Preferences */}
      {hasLikes && (
        <div className="trainer-detail__stats-section">
          <h2>Personal Preferences</h2>
          <div className="personal-info-row">
            {!!monster.likes && (
              <div className="inventory-item">
                <span className="detail-label">Likes</span>
                <span className="detail-value">{String(monster.likes)}</span>
              </div>
            )}
            {!!monster.dislikes && (
              <div className="inventory-item">
                <span className="detail-label">Dislikes</span>
                <span className="detail-value">{String(monster.dislikes)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fun Facts */}
      {funFacts.length > 0 && (
        <div className="trainer-detail__stats-section">
          <h2>Fun Facts &amp; Trivia</h2>
          <div className="monster-fun-facts-grid">
            {funFacts.map((fact, index) => (
              <div className="monster-fun-fact-card" key={String(fact.id ?? index)}>
                <div className="monster-fun-fact-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="monster-fun-fact-content">
                  {fact.title && <strong>{fact.title}</strong>}
                  {fact.content && <p>{fact.content}</p>}
                </div>
                <div className="monster-fun-fact-number">#{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relations */}
      {relations.length > 0 && (
        <div className="trainer-detail__stats-section">
          <h2>Relationships &amp; Connections</h2>
          <div className="monster-relations-grid">
            {relations.map((relation, index) => {
              const entityKey = `${relation.related_type}_${relation.related_id}`;
              const entity = relationEntities[entityKey];

              return (
                <div className="monster-relation-card" key={String(relation.id ?? index)}>
                  <div className="monster-relation-header">
                    <i
                      className={`fas ${relation.related_type === 'trainer' ? 'fa-user' : 'fa-paw'}`}
                    ></i>
                    <div>
                      <h4>{relation.name || 'Unknown Relation'}</h4>
                      <span className="detail-label">
                        {relation.related_type === 'trainer' ? 'Trainer' : 'Monster'}
                      </span>
                    </div>
                  </div>

                  {relation.related_id && entity && (
                    <Link
                      to={`/${relation.related_type === 'monster' ? 'monsters' : 'trainers'}/${relation.related_id}`}
                      className="monster-relation-link"
                    >
                      <i
                        className={`fas ${relation.related_type === 'trainer' ? 'fa-user-circle' : 'fa-dragon'}`}
                      ></i>
                      <span>{entity.name}</span>
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  )}

                  {relation.elaboration && (
                    <div className="monster-relation-story">
                      <p>{relation.elaboration}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Biography Summary */}
      {!!monster.tldr && (
        <div className="trainer-detail__stats-section">
          <h2>Biography Summary</h2>
          <div className="trainer-quote-section">
            <div className="quote-content">
              <p>{String(monster.tldr)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Full Biography */}
      {hasBio && (
        <div className="trainer-detail__stats-section">
          <h2>Complete Biography</h2>
          <div className="trainer-bio">
            <MarkdownRenderer
              content={String(monster.bio || monster.biography || '')}
              disableCodeBlocks
            />
          </div>
        </div>
      )}

      {/* No Content */}
      {!hasAnyContent && (
        <div className="trainer-detail__stats-section">
          <div className="state-container__empty">
            <i className="fas fa-book-open state-container__empty-icon"></i>
            <p className="state-container__empty-message">
              No biography has been written for this monster yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
