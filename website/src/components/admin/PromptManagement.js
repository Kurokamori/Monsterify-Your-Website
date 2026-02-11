import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PromptList from './AdminPromptList';
import PromptForm from './PromptForm';

const PromptManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    status: 'all'
  });

  // Fetch prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status !== 'all') {
        queryParams.append('active_only', filters.status === 'active' ? 'true' : 'false');
      }
      
      const response = await api.get(`/prompts?${queryParams.toString()}`);
      const data = response.data;

      if (data.success) {
        setPrompts(data.prompts || []);
      } else {
        setError(data.message || 'Failed to fetch prompts');
      }
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [filters]);

  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    setActiveTab('form');
  };

  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt);
    setActiveTab('form');
  };

  const handleDeletePrompt = async (promptId) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) {
      return;
    }

    try {
      const response = await api.delete(`/prompts/${promptId}`);
      const data = response.data;

      if (data.success) {
        setPrompts(prompts.filter(p => p.id !== promptId));
      } else {
        setError(data.message || 'Failed to delete prompt');
      }
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError('Failed to delete prompt');
    }
  };

  const handleFormSuccess = (savedPrompt) => {
    if (editingPrompt) {
      // Update existing prompt
      setPrompts(prompts.map(p => p.id === savedPrompt.id ? savedPrompt : p));
    } else {
      // Add new prompt
      setPrompts([savedPrompt, ...prompts]);
    }
    setActiveTab('list');
    setEditingPrompt(null);
  };

  const handleFormCancel = () => {
    setActiveTab('list');
    setEditingPrompt(null);
  };

  return (
    <div className="prompt-management">
      <div className="item-header">
        <h2>Prompt Management</h2>
        <div className="header-actions">
          <button
            onClick={handleCreatePrompt}
            className="button primary"
          >
            Create New Prompt
          </button>
        </div>
      </div>

      <div className="prompt-management-tabs">
        <button
          className={`button tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Prompt List
        </button>
        <button
          className={`button tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          {editingPrompt ? 'Edit Prompt' : 'Create Prompt'}
        </button>
      </div>

      <div className="prompt-management-content">
        {error && (
          <div className="alert error">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="button secondary">
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'list' && (
          <PromptList
            prompts={prompts}
            loading={loading}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={handleEditPrompt}
            onDelete={handleDeletePrompt}
            onRefresh={fetchPrompts}
          />
        )}

        {activeTab === 'form' && (
          <PromptForm
            prompt={editingPrompt}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </div>
    </div>
  );
};

export default PromptManagement;
