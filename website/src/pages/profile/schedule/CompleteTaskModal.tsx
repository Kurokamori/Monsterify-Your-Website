import { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { FormSelect } from '../../../components/common/FormSelect';
import gameTaskService from '../../../services/gameTaskService';
import type { GameTask, TaskReward } from '../../../services/gameTaskService';
import { getRewardIcon } from './types';

interface TrainerOption {
  id: number;
  name: string;
}

interface CompleteTaskModalProps {
  task: GameTask | null;
  trainers: TrainerOption[];
  onClose: () => void;
  onCompleted: () => void;
}

export const CompleteTaskModal = ({
  task,
  trainers,
  onClose,
  onCompleted,
}: CompleteTaskModalProps) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rewardResults, setRewardResults] = useState<TaskReward[]>([]);

  const handleComplete = async () => {
    if (!task || !selectedTrainerId) {
      setError('Please select a trainer.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const result = await gameTaskService.completeTask(task.id, Number(selectedTrainerId));
      setRewardResults(result.rewards || []);
      setSuccess(true);
      onCompleted();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to complete task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTrainerId('');
    setSubmitting(false);
    setError(null);
    setSuccess(false);
    setRewardResults([]);
    onClose();
  };

  const trainerOptions = trainers.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <Modal
      isOpen={!!task}
      onClose={handleClose}
      title={success ? 'Task Completed!' : 'Complete Task'}
    >
      {success ? (
        <div className="complete-modal__success">
          <div className="complete-modal__success-icon">
            <i className="fas fa-check-circle" />
          </div>
          <p>
            You have successfully completed <strong>{task?.title}</strong>!
            Here are your rewards:
          </p>
          <div className="complete-modal__rewards">
            {rewardResults.map((reward, index) => (
              <div key={index} className="complete-modal__reward">
                <div className="complete-modal__reward-icon">
                  <i className={getRewardIcon(reward.type)} />
                </div>
                <div className="complete-modal__reward-info">
                  <span className="complete-modal__reward-name">{reward.name}</span>
                  <span className="complete-modal__reward-amount">
                    {reward.quantity} {reward.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="button primary" onClick={handleClose}>
            Close
          </button>
        </div>
      ) : (
        task && (
          <div className="complete-modal__form">
            <div className="complete-modal__preview">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
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

            <FormSelect
              label="Select Trainer"
              name="trainer-select"
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              options={trainerOptions}
              placeholder="Select a trainer..."
              required
            />

            {error && (
              <div className="alert error">
                <i className="fas fa-exclamation-circle" />
                <span>{error}</span>
              </div>
            )}

            <div className="complete-modal__actions">
              <button className="button secondary" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="button primary"
                onClick={handleComplete}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Processing...
                  </>
                ) : (
                  'Complete Task'
                )}
              </button>
            </div>
          </div>
        )
      )}
    </Modal>
  );
};
