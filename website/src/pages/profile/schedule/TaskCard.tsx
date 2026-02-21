import type { GameTask } from '../../../services/gameTaskService';
import { getRewardIcon } from './types';

interface TaskCardProps {
  task: GameTask;
  onComplete: (task: GameTask) => void;
}

export const TaskCard = ({ task, onComplete }: TaskCardProps) => {
  const progressPercent = task.total > 0 ? (task.progress / task.total) * 100 : 0;
  const isReady = task.progress >= task.total && !task.completed;

  return (
    <div className={`task-card${task.completed ? ' task-card--completed' : ''}`}>
      <div className="task-card__info">
        <h3 className="task-card__title">{task.title}</h3>
        <p className="task-card__description">{task.description}</p>

        <div className="task-card__progress">
          <div className="task-card__progress-text">
            <span>Progress</span>
            <span>
              {task.progress} / {task.total}
            </span>
          </div>
          <div className="progress sm">
            <div
              className={`progress-fill ${task.completed ? 'success' : 'primary'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="task-card__rewards">
          <span className="task-card__rewards-label">Rewards:</span>
          <div className="task-card__reward-list">
            {task.rewards.map((reward, index) => (
              <span key={index} className="task-card__reward">
                <i className={getRewardIcon(reward.type)} />
                {reward.quantity} {reward.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="task-card__action">
        {task.completed ? (
          <button className="button secondary" disabled>
            <i className="fas fa-check-circle" /> Completed
          </button>
        ) : (
          <button
            className="button primary"
            onClick={() => onComplete(task)}
            disabled={!isReady}
          >
            {isReady ? (
              <>
                <i className="fas fa-check" /> Complete
              </>
            ) : (
              <>
                <i className="fas fa-hourglass-half" /> In Progress
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
