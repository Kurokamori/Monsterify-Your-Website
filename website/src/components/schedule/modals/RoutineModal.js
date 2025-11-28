import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const RoutineModal = ({ isOpen, onClose, onSuccess, trainers = [], routine = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pattern_type: 'daily',
    pattern_days: [],
    is_active: 1,
    items: []
  });

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    scheduled_time: '',
    reward_levels: 0,
    reward_coins: 0,
    reward_trainer_id: '',
    reminder_enabled: 0,
    reminder_offset: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);

  const patternTypes = [
    { value: 'daily', label: 'Daily', description: 'Every day' },
    { value: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
    { value: 'weekends', label: 'Weekends', description: 'Saturday and Sunday' },
    { value: 'custom', label: 'Custom Days', description: 'Select specific days' }
  ];

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    if (routine) {
      setFormData({
        ...routine,
        pattern_days: routine.pattern_days || [],
        items: routine.items || []
      });
    } else {
      // Reset form for new routine
      setFormData({
        name: '',
        description: '',
        pattern_type: 'daily',
        pattern_days: [],
        is_active: 1,
        items: []
      });
    }
  }, [routine, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleItemInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewItem(prev => ({
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

  const addItem = () => {
    if (newItem.title.trim()) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem, order_index: prev.items.length }]
      }));
      setNewItem({
        title: '',
        description: '',
        scheduled_time: '',
        reward_levels: 0,
        reward_coins: 0,
        reward_trainer_id: '',
        reminder_enabled: 0,
        reminder_offset: 0
      });
      setShowAddItem(false);
    }
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const moveItem = (index, direction) => {
    setFormData(prev => {
      const items = [...prev.items];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex >= 0 && newIndex < items.length) {
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        // Update order_index
        items.forEach((item, i) => {
          item.order_index = i;
        });
      }
      
      return { ...prev, items };
    });
  };

  const handleSubmit = async (e) => {
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
        
        // Add items to the routine
        for (const item of formData.items) {
          if (!item.id) { // Only add new items
            await api.post(`/schedule/routines/${routineId}/items`, item);
          }
        }

        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to save routine');
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      setError(error.response?.data?.message || 'An error occurred while saving the routine');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{routine ? 'Edit Routine' : 'Create New Routine'}</h3>
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
              <label htmlFor="name">Routine Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter routine name"
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
                placeholder="Describe your routine and its purpose"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active === 1}
                  onChange={handleInputChange}
                />
                Active Routine
              </label>
              <small className="form-help">
                Only active routines will appear in today's schedule
              </small>
            </div>
          </div>

          {/* Schedule Pattern */}
          <div className="form-section">
            <h4>Schedule Pattern</h4>
            
            <div className="pattern-options">
              {patternTypes.map(pattern => (
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
                <label>Select Days</label>
                <div className="checkbox-group">
                  {weekDays.map(day => (
                    <label key={day} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.pattern_days.includes(day)}
                        onChange={() => handleArrayChange('pattern_days', day)}
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Routine Items */}
          <div className="form-section">
            <h4>Routine Items</h4>
            
            {formData.items.length > 0 && (
              <div className="routine-items-list">
                {formData.items.map((item, index) => (
                  <div key={index} className="routine-item-card">
                    <div className="item-header">
                      <div className="item-order">
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="order-btn"
                        >
                          <i className="fas fa-chevron-up"></i>
                        </button>
                        <span className="order-number">{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === formData.items.length - 1}
                          className="order-btn"
                        >
                          <i className="fas fa-chevron-down"></i>
                        </button>
                      </div>
                      
                      <div className="item-content">
                        <h5>{item.title}</h5>
                        {item.description && <p>{item.description}</p>}
                        <div className="item-meta">
                          {item.scheduled_time && <span>Time: {item.scheduled_time}</span>}
                          {(item.reward_levels > 0 || item.reward_coins > 0) && (
                            <span>Reward: {item.reward_levels} levels, {item.reward_coins} coins</span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="remove-btn"
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
                className="btn-secondary add-item-btn"
              >
                <i className="fas fa-plus"></i>
                Add Routine Item
              </button>
            ) : (
              <div className="add-item-form">
                <h5>Add New Item</h5>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="item_title">Title *</label>
                    <input
                      type="text"
                      id="item_title"
                      name="title"
                      value={newItem.title}
                      onChange={handleItemInputChange}
                      placeholder="Item title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="item_time">Time</label>
                    <input
                      type="time"
                      id="item_time"
                      name="scheduled_time"
                      value={newItem.scheduled_time}
                      onChange={handleItemInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="item_description">Description</label>
                  <input
                    type="text"
                    id="item_description"
                    name="description"
                    value={newItem.description}
                    onChange={handleItemInputChange}
                    placeholder="Optional description"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="item_levels">Levels</label>
                    <input
                      type="number"
                      id="item_levels"
                      name="reward_levels"
                      value={newItem.reward_levels}
                      onChange={handleItemInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="item_coins">Coins</label>
                    <input
                      type="number"
                      id="item_coins"
                      name="reward_coins"
                      value={newItem.reward_coins}
                      onChange={handleItemInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="item_trainer">Trainer</label>
                    <select
                      id="item_trainer"
                      name="reward_trainer_id"
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
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-primary"
                  >
                    <i className="fas fa-plus"></i>
                    Add Item
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoutineModal;
