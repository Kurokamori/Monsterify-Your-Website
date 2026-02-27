import type { Monster } from '@services/monsterService';
import { getFriendshipMessage } from '../useMonsterDetail';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T|\s)/;

function formatDateString(value: string): string {
  if (!ISO_DATE_REGEX.test(value)) return value;
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

interface ProfileTabProps {
  monster: Monster;
}

export const ProfileTab = ({ monster }: ProfileTabProps) => {
  const hasAdditionalInfo = !!(
    monster.gender ||
    monster.pronouns ||
    monster.age ||
    monster.nature ||
    monster.characteristic ||
    monster.ability ||
    monster.friendship !== undefined
  );

  const hasOrigin = !!(
    monster.where_met || monster.date_met || monster.acquired || monster.ball
  );

  const hasPhysical = !!(monster.height || monster.weight);

  const hasSpecialFeatures = !!(
    monster.shiny || monster.alpha || monster.shadow || monster.paradox || monster.pokerus
  );

  return (
    <div className="town-square">
      {/* Additional Information */}
      {hasAdditionalInfo && (
        <div className="trainer-detail__stats-section">
          <h2>Additional Information</h2>
          <div className="personal-info-row">
            {!!monster.gender && (
              <div className="inventory-item">
                <span className="detail-label">Gender</span>
                <span className="detail-value">{String(monster.gender)}</span>
              </div>
            )}
            {!!monster.pronouns && (
              <div className="inventory-item">
                <span className="detail-label">Pronouns</span>
                <span className="detail-value">{String(monster.pronouns)}</span>
              </div>
            )}
            {!!monster.age && (
              <div className="inventory-item">
                <span className="detail-label">Age</span>
                <span className="detail-value">{String(monster.age)}</span>
              </div>
            )}
            {!!monster.nature && (
              <div className="inventory-item">
                <span className="detail-label">Nature</span>
                <span className="detail-value">{String(monster.nature)}</span>
              </div>
            )}
            {!!monster.characteristic && (
              <div className="inventory-item">
                <span className="detail-label">Characteristic</span>
                <span className="detail-value">{String(monster.characteristic)}</span>
              </div>
            )}
            {!!monster.ability && (
              <div className="inventory-item">
                <span className="detail-label">Ability</span>
                <span className="detail-value">{String(monster.ability)}</span>
              </div>
            )}
          </div>

          {/* Friendship */}
          {monster.friendship != null && Number(monster.friendship) > 0 && (
            <div className="monster-friendship-panel">
              <div className="monster-friendship-header">
                <i className="fas fa-handshake"></i>
                <span>Trainer Bond</span>
              </div>
              <div className="monster-friendship-content">
                <div className="monster-friendship-meter">
                  <div className="monster-friendship-bar">
                    <div
                      className="monster-friendship-fill"
                      style={{ width: `${(Number(monster.friendship) / 255) * 100}%` }}
                    ></div>
                  </div>
                  <div className="monster-friendship-value">
                    {String(monster.friendship)}/255
                  </div>
                </div>
                <div className="monster-friendship-message">
                  {getFriendshipMessage(monster.friendship as number)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Origin Story */}
      {hasOrigin && (
        <div className="trainer-detail__stats-section">
          <h2>Origin Story</h2>
          <div className="personal-info-row">
            {!!monster.where_met && (
              <div className="inventory-item">
                <span className="detail-label">Where Met</span>
                <span className="detail-value">{String(monster.where_met)}</span>
              </div>
            )}
            {!!monster.date_met && (
              <div className="inventory-item">
                <span className="detail-label">Date Met</span>
                <span className="detail-value">{formatDateString(String(monster.date_met))}</span>
              </div>
            )}
            {!!monster.acquired && (
              <div className="inventory-item">
                <span className="detail-label">How Acquired</span>
                <span className="detail-value">{String(monster.acquired)}</span>
              </div>
            )}
            {!!monster.ball && (
              <div className="inventory-item">
                <span className="detail-label">Ball</span>
                <span className="detail-value">{String(monster.ball)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Physical Characteristics */}
      {hasPhysical && (
        <div className="trainer-detail__stats-section">
          <h2>Physical Characteristics</h2>
          <div className="personal-info-row">
            {!!monster.height && (
              <div className="inventory-item">
                <span className="detail-label">Height</span>
                <span className="detail-value">{String(monster.height)}</span>
              </div>
            )}
            {!!monster.weight && (
              <div className="inventory-item">
                <span className="detail-label">Weight</span>
                <span className="detail-value">{String(monster.weight)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {!!monster.tldr && (
        <div className="trainer-detail__stats-section">
          <h2>Summary</h2>
          <div className="trainer-quote-section">
            <div className="quote-content">
              <p>{String(monster.tldr)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lore */}
      {!!monster.lore && (
        <div className="trainer-detail__stats-section">
          <h2>Lore &amp; Legends</h2>
          <div className="trainer-bio">
            <p>{String(monster.lore)}</p>
          </div>
        </div>
      )}

      {/* Special Features */}
      {hasSpecialFeatures && (
        <div className="trainer-detail__stats-section">
          <h2>Special Features</h2>
          <div className="monster-special-features-grid">
            {!!monster.shiny && (
              <div className="monster-special-card monster-special--shiny">
                <i className="fas fa-sparkles"></i>
                <div>
                  <strong>Shiny</strong>
                  <p>This monster has rare coloration!</p>
                </div>
              </div>
            )}
            {!!monster.alpha && (
              <div className="monster-special-card monster-special--alpha">
                <i className="fas fa-crown"></i>
                <div>
                  <strong>Alpha</strong>
                  <p>Larger and more powerful than normal</p>
                </div>
              </div>
            )}
            {!!monster.shadow && (
              <div className="monster-special-card monster-special--shadow">
                <i className="fas fa-ghost"></i>
                <div>
                  <strong>Shadow</strong>
                  <p>Touched by dark energy</p>
                </div>
              </div>
            )}
            {!!monster.paradox && (
              <div className="monster-special-card monster-special--paradox">
                <i className="fas fa-infinity"></i>
                <div>
                  <strong>Paradox</strong>
                  <p>From another time or dimension</p>
                </div>
              </div>
            )}
            {!!monster.pokerus && (
              <div className="monster-special-card monster-special--pokerus">
                <i className="fas fa-virus"></i>
                <div>
                  <strong>Pokerus</strong>
                  <p>Beneficial virus enhancing growth</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
