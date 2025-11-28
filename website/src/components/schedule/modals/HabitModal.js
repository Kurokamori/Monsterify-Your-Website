import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const HabitModal = ({ isOpen, onClose, onSuccess, trainers = [], habit = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    reward_levels: 0,
    reward_coins: 0,
    reward_trainer_id: '',
    reminder_enabled: 0,
    reminder_time: '',
    reminder_days: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const frequencies = ['daily', 'weekly'];
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    if (habit) {
      setFormData({
        ...habit,
        reward_trainer_id: habit.reward_trainer_id || '',
        reminder_days: habit.reminder_days || []
      });
    } else {
      // Reset form for new habit
      setFormData({
        title: '',
        description: '',
        frequency: 'daily',
        reward_levels: 0,
        reward_coins: 0,
        reward_trainer_id: '',
        reminder_enabled: 0,
        reminder_time: '',
        reminder_days: []
      });
    }
  }, [habit, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];

      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async (e) => {
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
    } catch (error) {
      console.error('Error saving habit:', error);
      setError(error.response?.data?.message || 'An error occurred while saving the habit');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{habit ? 'Edit Habit' : 'Create New Habit'}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="form-section">
            <h4>Basic Information</h4>
            
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter habit title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Describe your habit and what you want to achieve"
              />
            </div>

            <div className="form-group">
              <label htmlFor="frequency">Frequency</label>
              <select
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
              >
                {frequencies.map(frequency => (
                  <option key={frequency} value={frequency}>
                    {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                  </option>
                ))}
              </select>
              <small className="form-help">
                {formData.frequency === 'daily' 
                  ? 'Streak resets if not completed within 48 hours'
                  : 'Streak resets if not completed within 7 days'
                }
              </small>
            </div>
          </div>

          {/* Rewards */}
          <div className="form-section">
            <h4>Rewards</h4>
            <p className="section-description">
              Rewards are given each time you track this habit
            </p>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reward_levels">Levels</label>
                <input
                  type="number"
                  id="reward_levels"
                  name="reward_levels"
                  value={formData.reward_levels}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reward_coins">Coins</label>
                <input
                  type="number"
                  id="reward_coins"
                  name="reward_coins"
                  value={formData.reward_coins}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reward_trainer_id">Trainer</label>
                <select
                  id="reward_trainer_id"
                  name="reward_trainer_id"
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
          <div className="form-section">
            <h4>Reminders</h4>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="reminder_enabled"
                  checked={formData.reminder_enabled === 1}
                  onChange={handleInputChange}
                />
                Enable Discord Reminders
              </label>
              <small className="form-help">
                Get reminded via Discord DM to track your habit
              </small>
            </div>

            {formData.reminder_enabled === 1 && (
              <>
                <div className="form-group">
                  <label htmlFor="reminder_time">Reminder Time</label>
                  <input
                    type="time"
                    id="reminder_time"
                    name="reminder_time"
                    value={formData.reminder_time}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Reminder Days</label>
                  <div className="checkbox-group">
                    {weekDays.map(day => (
                      <label key={day} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.reminder_days.includes(day)}
                          onChange={() => handleArrayChange('reminder_days', day)}
                        />
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </label>
                    ))}
                  </div>
                  <small className="form-help">
                    Leave empty to get reminders every day
                  </small>
                </div>
              </>
            )}
          </div>

          {/* Habit Tips */}
          <div className="form-section">
            <h4>💡 Habit Building Tips</h4>
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

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitModal;
