import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const TaskModal = ({ isOpen, onClose, onSuccess, trainers = [], task = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    difficulty: 'easy',
    category: '',
    tags: [],
    steps: [],
    repeat_type: '',
    repeat_interval: 1,
    repeat_days: [],
    reward_levels: 0,
    reward_coins: 0,
    reward_trainer_id: '',
    reminder_enabled: 0,
    reminder_time: '',
    reminder_days: []
  });

  const [newTag, setNewTag] = useState('');
  const [newStep, setNewStep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const priorities = ['low', 'medium', 'high', 'urgent'];
  const difficulties = ['easy', 'medium', 'hard', 'extra difficult'];
  const repeatTypes = ['', 'daily', 'weekly', 'monthly', 'yearly'];
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        reward_trainer_id: task.reward_trainer_id || '',
        tags: task.tags || [],
        steps: task.steps || [],
        repeat_days: task.repeat_days || [],
        reminder_days: task.reminder_days || []
      });
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        difficulty: 'easy',
        category: '',
        tags: [],
        steps: [],
        repeat_type: '',
        repeat_interval: 1,
        repeat_days: [],
        reward_levels: 0,
        reward_coins: 0,
        reward_trainer_id: '',
        reminder_enabled: 0,
        reminder_time: '',
        reminder_days: []
      });
    }
  }, [task, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleArrayChange = (field, value, action = 'toggle') => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      let newArray;

      if (action === 'add' && value && !currentArray.includes(value)) {
        newArray = [...currentArray, value];
      } else if (action === 'remove') {
        newArray = currentArray.filter(item => item !== value);
      } else if (action === 'toggle') {
        newArray = currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value];
      } else {
        newArray = currentArray;
      }

      return { ...prev, [field]: newArray };
    });
  };

  const addTag = () => {
    if (newTag.trim()) {
      handleArrayChange('tags', newTag.trim(), 'add');
      setNewTag('');
    }
  };

  const addStep = () => {
    if (newStep.trim()) {
      handleArrayChange('steps', newStep.trim(), 'add');
      setNewStep('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        due_date: formData.due_date || null,
        reward_trainer_id: formData.reward_trainer_id || null
      };

      let response;
      if (task) {
        response = await api.put(`/schedule/tasks/${task.id}`, submitData);
      } else {
        response = await api.post('/schedule/tasks', submitData);
      }

      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setError(error.response?.data?.message || 'An error occurred while saving the task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="tree-header">
          <h3>{task ? 'Edit Task' : 'Create New Task'}</h3>
          <button className="button close" onClick={onClose}>
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
                placeholder="Enter task title"
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
                placeholder="Enter task description"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="due_date">Due Date</label>
                <input
                  type="datetime-local"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Art, Writing, Personal"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="form-section">
            <h4>Tags</h4>
            <div className="tag-input">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="button secondary">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="tag-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleArrayChange('tags', tag, 'remove')}
                    className="tag-remove"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="form-section">
            <h4>Steps</h4>
            <div className="step-input">
              <input
                type="text"
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Add a step"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
              />
              <button type="button" onClick={addStep} className="button secondary">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="step-list">
              {formData.steps.map((step, index) => (
                <div key={index} className="step-item">
                  <span className="step-number">{index + 1}.</span>
                  <span className="step-text">{step}</span>
                  <button
                    type="button"
                    onClick={() => handleArrayChange('steps', step, 'remove')}
                    className="step-remove"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Repeat Settings */}
          <div className="form-section">
            <h4>Repeat Settings</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="repeat_type">Repeat Type</label>
                <select
                  id="repeat_type"
                  name="repeat_type"
                  value={formData.repeat_type}
                  onChange={handleInputChange}
                >
                  <option value="">No Repeat</option>
                  {repeatTypes.slice(1).map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {formData.repeat_type && (
                <div className="form-group">
                  <label htmlFor="repeat_interval">Every</label>
                  <input
                    type="number"
                    id="repeat_interval"
                    name="repeat_interval"
                    value={formData.repeat_interval}
                    onChange={handleInputChange}
                    min="1"
                  />
                  <span className="input-suffix">{formData.repeat_type}(s)</span>
                </div>
              )}
            </div>

            {formData.repeat_type === 'weekly' && (
              <div className="form-group">
                <label>Repeat on Days</label>
                <div className="event-date">
                  {weekDays.map(day => (
                    <label key={day} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.repeat_days.includes(day)}
                        onChange={() => handleArrayChange('repeat_days', day)}
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className="form-section">
            <h4>Rewards</h4>
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
                  <div className="event-date">
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
                </div>
              </>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="button secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="button primary">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {task ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  {task ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
