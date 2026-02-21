import { useState, useEffect } from 'react';
import { RewardConfigurator, RewardConfig } from './RewardConfigurator';
import itemsService, { Item } from '../../services/itemsService';
import api from '../../services/api';

interface PromptFormData {
  title: string;
  description: string;
  prompt_text: string;
  type: string;
  difficulty: string;
  is_active: boolean;
  priority: number;
  max_submissions: number | null;
  max_submissions_per_trainer: number | null;
  target_type: string;
  min_trainer_level: number;
  max_trainer_level: number | null;
  active_months: string;
  start_date: string;
  end_date: string;
  event_name: string;
  image_url: string;
  tags: string[];
  prerequisites: string;
  rewards: RewardConfig;
}

interface PromptFormProps {
  prompt?: Record<string, unknown> | null;
  onSuccess: (prompt: Record<string, unknown>) => void;
  onCancel: () => void;
}

const DEFAULT_FORM_DATA: PromptFormData = {
  title: '',
  description: '',
  prompt_text: '',
  type: 'general',
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
    monster_roll: { enabled: false, parameters: {} as never }
  }
};

export function PromptForm({ prompt, onSuccess, onCancel }: PromptFormProps) {
  const [formData, setFormData] = useState<PromptFormData>({ ...DEFAULT_FORM_DATA });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);

  // Initialize form data when editing
  useEffect(() => {
    if (prompt) {
      const rewards = typeof prompt.rewards === 'string'
        ? JSON.parse(prompt.rewards as unknown as string)
        : prompt.rewards || {};

      setFormData({
        ...DEFAULT_FORM_DATA,
        ...prompt,
        rewards: {
          levels: 0, coins: 0, items: [],
          monster_roll: { enabled: false, parameters: {} as never },
          ...rewards
        },
        tags: prompt.tags
          ? (Array.isArray(prompt.tags) ? prompt.tags : JSON.parse(prompt.tags as unknown as string))
          : [],
        active_months: (prompt.active_months as string) || '',
        start_date: prompt.start_date && typeof prompt.start_date === 'string' ? prompt.start_date.split('T')[0] : '',
        end_date: prompt.end_date && typeof prompt.end_date === 'string' ? prompt.end_date.split('T')[0] : ''
      });
    }
  }, [prompt]);

  // Fetch items for rewards
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await itemsService.getItems({ limit: 1000 });
        if (response.success) {
          setAvailableItems(response.data || []);
        }
      } catch {
        console.error('Error fetching items');
      }
    };
    fetchItems();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRewardsChange = (newRewards: RewardConfig) => {
    setFormData(prev => ({ ...prev, rewards: newRewards }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        max_submissions: formData.max_submissions || null,
        max_submissions_per_trainer: formData.max_submissions_per_trainer || null,
        max_trainer_level: formData.max_trainer_level || null,
        is_active: Boolean(formData.is_active)
      };

      const response = prompt?.id
        ? await api.put(`/prompts/${prompt.id}`, submitData)
        : await api.post('/prompts', submitData);

      if (response.data.success) {
        onSuccess(response.data.prompt);
      } else {
        setError(response.data.message || 'Failed to save prompt');
      }
    } catch {
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
              <input id="title" name="title" type="text" value={formData.title}
                onChange={handleInputChange} required className="form-input" placeholder="Enter prompt title" />
            </div>
            <div className="form-group">
              <label htmlFor="type">Type *</label>
              <select id="type" name="type" value={formData.type} onChange={handleInputChange} required className="form-input">
                <option value="general">General</option>
                <option value="monthly">Monthly</option>
                <option value="progress">Progress</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="difficulty">Difficulty *</label>
            <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleInputChange} required className="form-input">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea id="description" name="description" value={formData.description}
              onChange={handleInputChange} required rows={3} className="form-input" placeholder="Brief description of the prompt" />
          </div>
          <div className="form-group">
            <label htmlFor="prompt_text">Detailed Prompt Instructions</label>
            <textarea id="prompt_text" name="prompt_text" value={formData.prompt_text}
              onChange={handleInputChange} rows={5} className="form-input" placeholder="Detailed instructions for participants" />
          </div>
        </div>

        {/* Monthly Configuration */}
        {formData.type === 'monthly' && (
          <div className="form-section">
            <h3>Monthly Configuration</h3>
            <div className="form-group">
              <label htmlFor="active_months">Active Months</label>
              <input id="active_months" name="active_months" type="text" value={formData.active_months}
                onChange={handleInputChange} className="form-input" placeholder="e.g., 1,2,12 for Jan, Feb, Dec" />
              <small className="form-help-text">Comma-separated month numbers (1-12). Leave empty for all months.</small>
            </div>
          </div>
        )}

        {/* Event Configuration */}
        {formData.type === 'event' && (
          <div className="form-section">
            <h3>Event Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event_name">Event Name</label>
                <input id="event_name" name="event_name" type="text" value={formData.event_name}
                  onChange={handleInputChange} className="form-input" placeholder="Name of the event" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input id="start_date" name="start_date" type="date" value={formData.start_date}
                  onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="end_date">End Date</label>
                <input id="end_date" name="end_date" type="date" value={formData.end_date}
                  onChange={handleInputChange} className="form-input" />
              </div>
            </div>
          </div>
        )}

        {/* Status and Availability */}
        <div className="form-section">
          <h3>Status and Availability</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="is_active">Status</label>
              <select id="is_active" name="is_active" value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })} className="form-input">
                <option value="active">Active (Available Now)</option>
                <option value="inactive">Inactive (Hidden from Users)</option>
              </select>
              <small className="form-help-text">Active prompts are immediately available to users. Inactive prompts are hidden until activated.</small>
            </div>
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <input id="priority" name="priority" type="number" min="0" max="100"
                value={formData.priority || 0} onChange={handleInputChange} className="form-input" />
              <small className="form-help-text">Higher priority prompts appear first in lists (0-100)</small>
            </div>
          </div>
          <div className="status-info">
            <div className="info-item"><strong>General Prompts:</strong> Always available when active</div>
            <div className="info-item"><strong>Monthly Prompts:</strong> Available during specified months (or all months if none specified)</div>
            <div className="info-item"><strong>Progress Prompts:</strong> One-time completion prompts that track user progress</div>
            <div className="info-item"><strong>Event Prompts:</strong> Automatically available during their date range</div>
          </div>
        </div>

        {/* Submission Configuration */}
        <div className="form-section">
          <h3>Submission Configuration</h3>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.max_submissions_per_trainer === 1}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    max_submissions_per_trainer: e.target.checked ? 1 : null,
                    max_submissions: null
                  });
                }} />
              Limited to 1 submission per trainer
            </label>
            <small className="form-help-text">When enabled, each trainer can only submit once. When disabled, trainers can submit unlimited times.</small>
          </div>
        </div>

        {/* Rewards Configuration */}
        <div className="form-section">
          <h3>Rewards Configuration</h3>
          <RewardConfigurator rewards={formData.rewards} onChange={handleRewardsChange} availableItems={availableItems} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert error"><p>{error}</p></div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="button secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? 'Saving...' : (prompt ? 'Update Prompt' : 'Create Prompt')}
          </button>
        </div>
      </form>
    </div>
  );
}

