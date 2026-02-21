import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Modal } from '../../common/Modal';
import { ActionButtonGroup } from '../../common/ActionButtonGroup';
import api from '../../../services/api';
import {
  Routine,
  RoutineFormData,
  RoutineItem,
  NewRoutineItem,
  Trainer,
  PATTERN_TYPES,
  WEEK_DAYS,
  capitalize
} from '../types';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainers: Trainer[];
  routine: Routine | null;
}

const INITIAL_FORM_DATA: RoutineFormData = {
  name: '',
  description: '',
  pattern_type: 'daily',
  pattern_days: [],
  is_active: 1,
  items: []
};

const INITIAL_NEW_ITEM: NewRoutineItem = {
  title: '',
  description: '',
  scheduled_time: '',
  reward_levels: 0,
  reward_coins: 0,
  reward_trainer_id: '',
  reminder_enabled: 0,
  reminder_offset: 0
};

export const RoutineModal = ({
  isOpen,
  onClose,
  onSuccess,
  trainers,
  routine
}: RoutineModalProps) => {
  const [formData, setFormData] = useState<RoutineFormData>(INITIAL_FORM_DATA);
  const [newItem, setNewItem] = useState<NewRoutineItem>(INITIAL_NEW_ITEM);
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (routine) {
      setFormData({
        name: routine.name,
        description: routine.description || '',
        pattern_type: routine.pattern_type,
        pattern_days: routine.pattern_days || [],
        is_active: routine.is_active,
        items: routine.items || []
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setNewItem(INITIAL_NEW_ITEM);
    setShowAddItem(false);
    setError('');
  }, [routine, isOpen]);

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

  const handleItemInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setNewItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleItemNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleArrayToggle = (value: string) => {
    setFormData(prev => {
      const currentArray = prev.pattern_days;
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, pattern_days: newArray };
    });
  };

  const addItem = () => {
    if (newItem.title.trim()) {
      const newRoutineItem: RoutineItem = {
        ...newItem,
        order_index: formData.items.length,
        reward_trainer_id: newItem.reward_trainer_id || ''
      };

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newRoutineItem]
      }));
      setNewItem(INITIAL_NEW_ITEM);
      setShowAddItem(false);
    }
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        order_index: i
      }))
    }));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const items = [...prev.items];
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      if (newIndex >= 0 && newIndex < items.length) {
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        items.forEach((item, i) => {
          item.order_index = i;
        });
      }

      return { ...prev, items };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (routine) {
        response = await api.put(`/schedule/routines/${routine.id}`, formData);
      } else {
        response = await api.post('/schedule/routines', formData);
      }

      if (response.data.success) {
        const routineId = routine?.id || response.data.data.id;

        // Add new items to the routine
        for (const item of formData.items) {
          if (!item.id) {
            await api.post(`/schedule/routines/${routineId}/items`, item);
          }
        }

        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to save routine');
      }
    } catch (err) {
      console.error('Error saving routine:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'An error occurred while saving the routine';
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
        form="routine-form"
        disabled={loading}
        className="button primary"
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            {routine ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          <>
            <i className="fas fa-save"></i>
            {routine ? 'Update Routine' : 'Create Routine'}
          </>
        )}
      </button>
    </ActionButtonGroup>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={routine ? 'Edit Routine' : 'Create New Routine'}
      size="large"
      footer={footer}
    >
      <form id="routine-form" onSubmit={handleSubmit} className="schedule-form">
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
            <label className="form-label" htmlFor="routine-name">
              Routine Name <span className="required-indicator">*</span>
            </label>
            <input
              type="text"
              id="routine-name"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter routine name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="routine-description">Description</label>
            <textarea
              id="routine-description"
              name="description"
              className="input textarea"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe your routine and its purpose"
            />
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_active"
              className="checkbox"
              checked={formData.is_active === 1}
              onChange={handleInputChange}
            />
            Active Routine
          </label>
          <span className="schedule-form__help">
            Only active routines will appear in today's schedule
          </span>
        </div>

        {/* Schedule Pattern */}
        <div className="schedule-form__section">
          <h4>Schedule Pattern</h4>

          <div className="pattern-options">
            {PATTERN_TYPES.map(pattern => (
              <label key={pattern.value} className="pattern-option">
                <input
                  type="radio"
                  name="pattern_type"
                  value={pattern.value}
                  checked={formData.pattern_type === pattern.value}
                  onChange={handleInputChange}
                />
                <div className="pattern-info">
                  <strong>{pattern.label}</strong>
                  <small>{pattern.description}</small>
                </div>
              </label>
            ))}
          </div>

          {formData.pattern_type === 'custom' && (
            <div className="form-group">
              <label className="form-label">Select Days</label>
              <div className="day-selection">
                {WEEK_DAYS.map(day => (
                  <label key={day} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.pattern_days.includes(day)}
                      onChange={() => handleArrayToggle(day)}
                    />
                    <span>{capitalize(day)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Routine Items */}
        <div className="schedule-form__section">
          <h4>Routine Items</h4>

          {formData.items.length > 0 && (
            <div className="routine-items-list">
              {formData.items.map((item, index) => (
                <div key={index} className="routine-item-card">
                  <div className="routine-item-card__header">
                    <div className="routine-item-card__order">
                      <button
                        type="button"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="button secondary sm"
                      >
                        <i className="fas fa-chevron-up"></i>
                      </button>
                      <span className="order-number">{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === formData.items.length - 1}
                        className="button secondary sm"
                      >
                        <i className="fas fa-chevron-down"></i>
                      </button>
                    </div>

                    <div className="routine-item-card__content">
                      <h5>{item.title}</h5>
                      {item.description && <p>{item.description}</p>}
                      <div className="routine-item-card__meta">
                        {item.scheduled_time && <span>Time: {item.scheduled_time}</span>}
                        {(item.reward_levels > 0 || item.reward_coins > 0) && (
                          <span>Reward: {item.reward_levels} levels, {item.reward_coins} coins</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="button danger sm"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showAddItem ? (
            <button
              type="button"
              onClick={() => setShowAddItem(true)}
              className="button secondary"
            >
              <i className="fas fa-plus"></i>
              Add Routine Item
            </button>
          ) : (
            <div className="add-item-form">
              <h5>Add New Item</h5>

              <div className="schedule-form__row">
                <div className="form-group">
                  <label className="form-label" htmlFor="item-title">
                    Title <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    id="item-title"
                    name="title"
                    className="input"
                    value={newItem.title}
                    onChange={handleItemInputChange}
                    placeholder="Item title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="item-time">Time</label>
                  <input
                    type="time"
                    id="item-time"
                    name="scheduled_time"
                    className="input"
                    value={newItem.scheduled_time}
                    onChange={handleItemInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="item-description">Description</label>
                <input
                  type="text"
                  id="item-description"
                  name="description"
                  className="input"
                  value={newItem.description}
                  onChange={handleItemInputChange}
                  placeholder="Optional description"
                />
              </div>

              <div className="schedule-form__row">
                <div className="form-group">
                  <label className="form-label" htmlFor="item-levels">Levels</label>
                  <input
                    type="number"
                    id="item-levels"
                    name="reward_levels"
                    className="input"
                    value={newItem.reward_levels}
                    onChange={handleItemNumberChange}
                    min={0}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="item-coins">Coins</label>
                  <input
                    type="number"
                    id="item-coins"
                    name="reward_coins"
                    className="input"
                    value={newItem.reward_coins}
                    onChange={handleItemNumberChange}
                    min={0}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="item-trainer">Trainer</label>
                  <select
                    id="item-trainer"
                    name="reward_trainer_id"
                    className="input"
                    value={newItem.reward_trainer_id}
                    onChange={handleItemInputChange}
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

              <div className="add-item-actions">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="button secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addItem}
                  className="button primary"
                >
                  <i className="fas fa-plus"></i>
                  Add Item
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default RoutineModal;
