import { TypeBadge } from '@components/common/TypeBadge';
import type { MonsterMove } from '../useMonsterDetail';

interface MovesTabProps {
  moves: MonsterMove[];
}

export const MovesTab = ({ moves }: MovesTabProps) => {
  if (moves.length === 0) {
    return (
      <div className="town-square">
        <div className="trainer-detail__stats-section">
          <h2>Move Arsenal</h2>
          <div className="state-container__empty">
            <i className="fas fa-slash state-container__empty-icon"></i>
            <p className="state-container__empty-message">
              No moves have been recorded for this monster yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="town-square">
      <div className="trainer-detail__stats-section">
        <h2>Move Arsenal</h2>
        <div className="monster-moves-grid">
          {moves.map((move, index) => (
            <div className="monster-move-card" key={index}>
              <div className="monster-move-header">
                <h4 className="monster-move-name">{move.move_name}</h4>
                {move.move_type && <TypeBadge type={move.move_type} size="xs" />}
              </div>

              <div className="monster-move-stats">
                <div className="monster-move-stat">
                  <span className="detail-label">PP</span>
                  <span className="detail-value">{move.pp}</span>
                </div>
                {move.power !== null && move.power !== undefined && (
                  <div className="monster-move-stat">
                    <span className="detail-label">Power</span>
                    <span className="detail-value">{move.power}</span>
                  </div>
                )}
                {move.accuracy !== null && move.accuracy !== undefined && (
                  <div className="monster-move-stat">
                    <span className="detail-label">Accuracy</span>
                    <span className="detail-value">{move.accuracy}</span>
                  </div>
                )}
              </div>

              {move.description && (
                <div className="monster-move-description">
                  <p>{move.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
