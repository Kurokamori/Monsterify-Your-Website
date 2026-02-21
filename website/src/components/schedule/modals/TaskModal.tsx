import { useState, useEffect, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { Modal } from '../../common/Modal';
import { ActionButtonGroup } from '../../common/ActionButtonGroup';
import api from '../../../services/api';
import {
  Task,
  TaskFormData,
  Trainer,
  PRIORITIES,
  DIFFICULTIES,
  REPEAT_TYPES,
  WEEK_DAYS,
  capitalize
} from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainers: Trainer[];
  task: Task | null;
}

const INITIAL_FORM_DATA: TaskFormData = {
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
};

export const TaskModal = ({
  isOpen,
  onClose,
  onSuccess,
  trainers,
  task
}: TaskModalProps) => {
  const [formData, setFormData] = useState<TaskFormData>(INITIAL_FORM_DATA);
  const [newTag, setNewTag] = useState('');
  const [newStep, setNewStep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        priority: task.priority,
        difficulty: task.difficulty,
        category: task.category || '',
        tags: task.tags || [],
        steps: task.steps || [],
        repeat_type: task.repeat_type || '',
        repeat_interval: task.repeat_interval || 1,
        repeat_days: task.repeat_days || [],
        reward_levels: task.reward_levels || 0,
        reward_coins: task.reward_coins || 0,
        reward_trainer_id: task.reward_trainer_id?.toString() || '',
        reminder_enabled: task.reminder_enabled || 0,
        reminder_time: task.reminder_time || '',
        reminder_days: task.reminder_days || []
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setError('');
  }, [task, isOpen]);

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

  const handleArrayToggle = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addStep = () => {
    if (newStep.trim()) {
      setFormData(prev => ({
        ...prev,
        steps: [...prev.steps, newStep.trim()]
      }));
      setNewStep('');
    }
  };

  const removeStep = (step: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s !== step)
    }));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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
    } catch (err) {
      console.error('Error saving task:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'An error occurred while saving the task';
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
        form="task-form"
        disabled={loading}
        className="button primary"
      >
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
    </ActionButtonGroup>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      size="large"
      footer={footer}
    >
      <form id="task-form" onSubmit={handleSubmit} className="schedule-form">
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
            <label className="form-label" htmlFor="title">
              Title <span className="required-indicator">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="input"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter task title"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="input textarea"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter task description"
            />
          </div>

          <div className="schedule-form__row">
            <div className="form-group">
              <label className="form-label" htmlFor="due_date">Due Date</label>
              <input
                type="datetime-local"
                id="due_date"
                name="due_date"
                className="input"
                value={formData.due_date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                className="input"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Art, Writing, Personal"
              />
            </div>
          </div>

          <div className="schedule-form__row">
            <div className="form-group">
              <label className="form-label" htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                className="input"
                value={formData.priority}
                onChange={handleInputChange}
              >
                {PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>
                    {capitalize(priority)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                className="input"
                value={formData.difficulty}
                onChange={handleInputChange}
              >
                {DIFFICULTIES.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {capitalize(difficulty)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="schedule-form__section">
          <h4>Tags</h4>
          <div className="tag-input">
            <input
              type="text"
              className="input"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => handleKeyPress(e, addTag)}
            />
            <button type="button" onClick={addTag} className="button secondary">
              <i className="fas fa-plus"></i>
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="tag-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="schedule-form__section">
          <h4>Steps</h4>
          <div className="step-input">
            <input
              type="text"
              className="input"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              placeholder="Add a step"
              onKeyPress={(e) => handleKeyPress(e, addStep)}
            />
            <button type="button" onClick={addStep} className="button secondary">
              <i className="fas fa-plus"></i>
            </button>
          </div>
          {formData.steps.length > 0 && (
            <div className="step-list">
              {formData.steps.map((step, index) => (
                <div key={index} className="step-item">
                  <span className="schedule-step-number">{index + 1}.</span>
                  <span className="step-text">{step}</span>
                  <button
                    type="button"
                    onClick={() => removeStep(step)}
                    className="step-remove"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repeat Settings */}
        <div className="schedule-form__section">
          <h4>Repeat Settings</h4>
          <div className="schedule-form__row">
            <div className="form-group">
              <label className="form-label" htmlFor="repeat_type">Repeat Type</label>
              <select
                id="repeat_type"
                name="repeat_type"
                className="input"
                value={formData.repeat_type}
                onChange={handleInputChange}
              >
                <option value="">No Repeat</option>
                {REPEAT_TYPES.slice(1).map(type => (
                  <option key={type} value={type}>
                    {capitalize(type)}
                  </option>
                ))}
              </select>
            </div>

            {formData.repeat_type && (
              <div className="form-group">
                <label className="form-label" htmlFor="repeat_interval">Interval</label>
                <input
                  type="number"
                  id="repeat_interval"
                  name="repeat_interval"
                  className="input"
                  value={formData.repeat_interval}
                  onChange={handleNumberChange}
                  min={1}
                />
                <span className="schedule-form__help">
                  Every {formData.repeat_interval} {formData.repeat_type}(s)
                </span>
              </div>
            )}
          </div>

          {formData.repeat_type === 'weekly' && (
            <div className="form-group">
              <label className="form-label">Repeat on Days</label>
              <div className="day-selection">
                {WEEK_DAYS.map(day => (
                  <label key={day} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.repeat_days.includes(day)}
                      onChange={() => handleArrayToggle('repeat_days', day)}
                    />
                    <span>{capitalize(day)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rewards */}
        <div className="schedule-form__section">
          <h4>Rewards</h4>
          <div className="schedule-form__row">
            <div className="form-group">
              <label className="form-label" htmlFor="reward_levels">Levels</label>
              <input
                type="number"
                id="reward_levels"
                name="reward_levels"
                className="input"
                value={formData.reward_levels}
                onChange={handleNumberChange}
                min={0}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reward_coins">Coins</label>
              <input
                type="number"
                id="reward_coins"
                name="reward_coins"
                className="input"
                value={formData.reward_coins}
                onChange={handleNumberChange}
                min={0}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reward_trainer_id">Trainer</label>
              <select
                id="reward_trainer_id"
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

          {formData.reminder_enabled === 1 && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reminder_time">Reminder Time</label>
                <input
                  type="time"
                  id="reminder_time"
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
              </div>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
