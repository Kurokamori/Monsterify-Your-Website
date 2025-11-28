import React, { useState, useEffect } from 'react';
import RewardConfigurator from './RewardConfigurator';
import MonsterRollConfigurator from './MonsterRollConfigurator';
import api from '../../services/api';
import './PromptForm.css';

const PromptForm = ({ prompt, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt_text: '',
    type: 'general',
    category: 'art',
    difficulty: 'medium',
    is_active: true,
    priority: 0,
    max_submissions: null,
    max_submissions_per_trainer: null,
    target_type: 'trainer',
    min_trainer_level: 1,
    max_trainer_level: null,
    active_months: '',
    start_date: '',
    end_date: '',
    event_name: '',
    image_url: '',
    tags: [],
    prerequisites: '',
    rewards: {
      levels: 0,
      coins: 0,
      items: [],
      monster_roll: null
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);

  // Initialize form data when editing
  useEffect(() => {
    if (prompt) {
      const rewards = typeof prompt.rewards === 'string' 
        ? JSON.parse(prompt.rewards) 
        : prompt.rewards || {};
      
      setFormData({
        ...prompt,
        rewards: {
          levels: 0,
          coins: 0,
          items: [],
          monster_roll: null,
          ...rewards
        },
        tags: prompt.tags ? (Array.isArray(prompt.tags) ? prompt.tags : JSON.parse(prompt.tags)) : [],
        active_months: prompt.active_months || '',
        start_date: prompt.start_date ? prompt.start_date.split('T')[0] : '',
        end_date: prompt.end_date ? prompt.end_date.split('T')[0] : ''
      });
    }
  }, [prompt]);

  // Fetch categories and items
  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/prompts/meta/categories');
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/items', { params: { limit: 1000 } }); // Get more items for admin
      if (response.data.success) {
        setAvailableItems(response.data.data || []); // Use 'data' not 'items'
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRewardsChange = (newRewards) => {
    setFormData(prev => ({
      ...prev,
      rewards: newRewards
    }));
  };

  // Bonus rewards removed

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        rewards: formData.rewards, // Send as object, not string
        tags: formData.tags, // Send as array, not string  
        max_submissions: formData.max_submissions || null,
        max_submissions_per_trainer: formData.max_submissions_per_trainer || null,
        max_trainer_level: formData.max_trainer_level || null,
        is_active: Boolean(formData.is_active) // Ensure it's explicitly set as boolean
      };

      let response;
      if (prompt) {
        // Update existing prompt
        response = await api.put(`/prompts/${prompt.id}`, submitData);
      } else {
        // Create new prompt
        response = await api.post('/prompts', submitData);
      }

      const data = response.data;

      if (data.success) {
        onSuccess(data.prompt);
      } else {
        setError(data.message || 'Failed to save prompt');
      }
    } catch (err) {
      console.error('Error saving prompt:', err);
      setError('Failed to save prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prompt-form">
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter prompt title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="general">General</option>
                <option value="monthly">Monthly</option>
                <option value="progress">Progress</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="art">Art</option>
                <option value="writing">Writing</option>
                <option value="reference">Reference</option>
                <option value="activity">Activity</option>
                {categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Difficulty *</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="form-textarea"
              placeholder="Brief description of the prompt"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prompt_text">Detailed Prompt Instructions</label>
            <textarea
              id="prompt_text"
              name="prompt_text"
              value={formData.prompt_text}
              onChange={handleInputChange}
              rows={5}
              className="form-textarea"
              placeholder="Detailed instructions for participants"
            />
          </div>
        </div>

        {/* Type-specific Configuration */}
        {formData.type === 'monthly' && (
          <div className="form-section">
            <h3>Monthly Configuration</h3>
            <div className="form-group">
              <label htmlFor="active_months">Active Months</label>
              <input
                id="active_months"
                name="active_months"
                type="text"
                value={formData.active_months}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 1,2,12 for Jan, Feb, Dec"
              />
              <small className="form-help">
                Comma-separated month numbers (1-12). Leave empty for all months.
              </small>
            </div>
          </div>
        )}

        {formData.type === 'event' && (
          <div className="form-section">
            <h3>Event Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event_name">Event Name</label>
                <input
                  id="event_name"
                  name="event_name"
                  type="text"
                  value={formData.event_name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Name of the event"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="end_date">End Date</label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status and Availability Configuration */}
        <div className="form-section">
          <h3>Status and Availability</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="is_active">Status</label>
              <select
                id="is_active"
                name="is_active"
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="form-select"
              >
                <option value="active">Active (Available Now)</option>
                <option value="inactive">Inactive (Hidden from Users)</option>
              </select>
              <small className="form-help">
                Active prompts are immediately available to users. Inactive prompts are hidden until activated.
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <input
                id="priority"
                name="priority"
                type="number"
                min="0"
                max="100"
                value={formData.priority || 0}
                onChange={handleInputChange}
                className="form-input"
              />
              <small className="form-help">
                Higher priority prompts appear first in lists (0-100)
              </small>
            </div>
          </div>
          
          <div className="status-info">
            <div className="info-item">
              <strong>General Prompts:</strong> Always available when active
            </div>
            <div className="info-item">
              <strong>Monthly Prompts:</strong> Available during specified months (or all months if none specified)
            </div>
            <div className="info-item">
              <strong>Progress Prompts:</strong> One-time completion prompts that track user progress
            </div>
            <div className="info-item">
              <strong>Event Prompts:</strong> Automatically available during their date range
            </div>
          </div>
        </div>

        {/* Submission Configuration */}
        <div className="form-section">
          <h3>Submission Configuration</h3>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.max_submissions_per_trainer === 1}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    max_submissions_per_trainer: e.target.checked ? 1 : null,
                    max_submissions: null // Remove total limit when we have per-trainer limit
                  });
                }}
              />
              Limited to 1 submission per trainer
            </label>
            <small className="form-help">
              When enabled, each trainer can only submit once. When disabled, trainers can submit unlimited times.
            </small>
          </div>
        </div>

        {/* Rewards Configuration */}
        <div className="form-section">
          <h3>Rewards Configuration</h3>
          <RewardConfigurator
            rewards={formData.rewards}
            onChange={handleRewardsChange}
            availableItems={availableItems}
          />
        </div>

        {/* Bonus rewards section removed */}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (prompt ? 'Update Prompt' : 'Create Prompt')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromptForm;
