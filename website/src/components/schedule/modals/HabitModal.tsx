import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Modal } from '../../common/Modal';
import { ActionButtonGroup } from '../../common/ActionButtonGroup';
import api from '../../../services/api';
import {
  Habit,
  HabitFormData,
  Trainer,
  FREQUENCIES,
  WEEK_DAYS,
  capitalize
} from '../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainers: Trainer[];
  habit: Habit | null;
}

const INITIAL_FORM_DATA: HabitFormData = {
  title: '',
  description: '',
  frequency: 'daily',
  reward_levels: 0,
  reward_coins: 0,
  reward_trainer_id: '',
  reminder_enabled: 0,
  reminder_time: '',
  reminder_days: []
};

export const HabitModal = ({
  isOpen,
  onClose,
  onSuccess,
  trainers,
  habit
}: HabitModalProps) => {
  const [formData, setFormData] = useState<HabitFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (habit) {
      setFormData({
        title: habit.title,
        description: habit.description || '',
        frequency: habit.frequency,
        reward_levels: habit.reward_levels || 0,
        reward_coins: habit.reward_coins || 0,
        reward_trainer_id: habit.reward_trainer_id?.toString() || '',
        reminder_enabled: habit.reminder_enabled || 0,
        reminder_time: habit.reminder_time || '',
        reminder_days: habit.reminder_days || []
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setError('');
  }, [habit, isOpen]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleArrayToggle = (field: keyof HabitFormData, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        reward_trainer_id: formData.reward_trainer_id || null
      };

      let response;
      if (habit) {
        response = await api.put(`/schedule/habits/${habit.id}`, submitData);
      } else {
        response = await api.post('/schedule/habits', submitData);
      }

      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to save habit');
      }
    } catch (err) {
      console.error('Error saving habit:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'An error occurred while saving the habit';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <ActionButtonGroup align="end" gap="sm">
      <button type="button" onClick={onClose} className="button secondary">
        Cancel
      </button>
      <button
        type="submit"
        form="habit-form"
        disabled={loading}
        className="button primary"
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            {habit ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          <>
            <i className="fas fa-save"></i>
            {habit ? 'Update Habit' : 'Create Habit'}
          </>
        )}
      </button>
    </ActionButtonGroup>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit ? 'Edit Habit' : 'Create New Habit'}
      size="medium"
      footer={footer}
    >
      <form id="habit-form" onSubmit={handleSubmit} className="schedule-form">
        {error && (
          <div className="schedule-alert schedule-alert--error">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="schedule-form__section">
          <h4>Basic Information</h4>

          <div className="form-group">
            <label className="form-label" htmlFor="habit-title">
              Title <span className="required-indicator">*</span>
            </label>
            <input
              type="text"
              id="habit-title"
              name="title"
              className="input"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter habit title"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="habit-description">Description</label>
            <textarea
              id="habit-description"
              name="description"
              className="input textarea"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe your habit and what you want to achieve"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="habit-frequency">Frequency</label>
            <select
              id="habit-frequency"
              name="frequency"
              className="input"
              value={formData.frequency}
              onChange={handleInputChange}
            >
              {FREQUENCIES.map(frequency => (
                <option key={frequency} value={frequency}>
                  {capitalize(frequency)}
                </option>
              ))}
            </select>
            <span className="schedule-form__help">
              {formData.frequency === 'daily'
                ? 'Streak resets if not completed within 48 hours'
                : 'Streak resets if not completed within 7 days'
              }
            </span>
          </div>
        </div>

        {/* Rewards */}
        <div className="schedule-form__section">
          <h4>Rewards</h4>
          <p className="schedule-form__help">
            Rewards are given each time you track this habit
          </p>

          <div className="schedule-form__row">
            <div className="form-group">
              <label className="form-label" htmlFor="habit-reward_levels">Levels</label>
              <input
                type="number"
                id="habit-reward_levels"
                name="reward_levels"
                className="input"
                value={formData.reward_levels}
                onChange={handleNumberChange}
                min={0}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="habit-reward_coins">Coins</label>
              <input
                type="number"
                id="habit-reward_coins"
                name="reward_coins"
                className="input"
                value={formData.reward_coins}
                onChange={handleNumberChange}
                min={0}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="habit-reward_trainer_id">Trainer</label>
              <select
                id="habit-reward_trainer_id"
                name="reward_trainer_id"
                className="input"
                value={formData.reward_trainer_id}
                onChange={handleInputChange}
              >
                <option value="">Select Trainer</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="schedule-form__section">
          <h4>Reminders</h4>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="reminder_enabled"
              className="checkbox"
              checked={formData.reminder_enabled === 1}
              onChange={handleInputChange}
            />
            Enable Discord Reminders
          </label>
          <span className="schedule-form__help">
            Get reminded via Discord DM to track your habit
          </span>

          {formData.reminder_enabled === 1 && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="habit-reminder_time">Reminder Time</label>
                <input
                  type="time"
                  id="habit-reminder_time"
                  name="reminder_time"
                  className="input"
                  value={formData.reminder_time}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reminder Days</label>
                <div className="day-selection">
                  {WEEK_DAYS.map(day => (
                    <label key={day} className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.reminder_days.includes(day)}
                        onChange={() => handleArrayToggle('reminder_days', day)}
                      />
                      <span>{capitalize(day)}</span>
                    </label>
                  ))}
                </div>
                <span className="schedule-form__help">
                  Leave empty to get reminders every day
                </span>
              </div>
            </>
          )}
        </div>

        {/* Habit Tips */}
        <div className="schedule-form__section">
          <h4>Habit Building Tips</h4>
          <div className="tips-list">
            <div className="tip-item">
              <i className="fas fa-lightbulb"></i>
              <span>Start small - make it so easy you can't say no</span>
            </div>
            <div className="tip-item">
              <i className="fas fa-link"></i>
              <span>Stack habits - attach new habits to existing routines</span>
            </div>
            <div className="tip-item">
              <i className="fas fa-chart-line"></i>
              <span>Track consistently - focus on the streak, not perfection</span>
            </div>
            <div className="tip-item">
              <i className="fas fa-trophy"></i>
              <span>Celebrate wins - acknowledge your progress</span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default HabitModal;
