import React, { useState } from 'react';
import './AdminPromptList.css';

const AdminPromptList = ({ 
  prompts, 
  loading, 
  filters, 
  onFiltersChange, 
  onEdit, 
  onDelete, 
  onRefresh 
}) => {
  const [selectedPrompts, setSelectedPrompts] = useState([]);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleSelectPrompt = (promptId) => {
    setSelectedPrompts(prev => 
      prev.includes(promptId)
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPrompts.length === prompts.length) {
      setSelectedPrompts([]);
    } else {
      setSelectedPrompts(prompts.map(p => p.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedPrompts.length === 0) return;

    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedPrompts.length} prompt(s)?`)) {
        return;
      }
      
      for (const promptId of selectedPrompts) {
        await onDelete(promptId);
      }
      setSelectedPrompts([]);
    } else if (action === 'activate' || action === 'deactivate') {
      // Bulk activate/deactivate logic would go here
      console.log(`${action} prompts:`, selectedPrompts);
    }
  };

  const formatRewards = (rewards) => {
    if (!rewards) return 'No rewards';
    
    const rewardObj = typeof rewards === 'string' ? JSON.parse(rewards) : rewards;
    const parts = [];
    
    if (rewardObj.levels) parts.push(`${rewardObj.levels}L`);
    if (rewardObj.coins) parts.push(`${rewardObj.coins}C`);
    if (rewardObj.items && rewardObj.items.length > 0) parts.push(`${rewardObj.items.length}I`);
    if (rewardObj.monster_roll && rewardObj.monster_roll.enabled) parts.push('MR');
    
    return parts.length > 0 ? parts.join(' + ') : 'Custom';
  };

  const getStatusBadge = (prompt) => {
    if (!prompt.is_active) return { text: 'Inactive', class: 'inactive' };
    
    if (prompt.type === 'event') {
      const now = new Date();
      const endDate = new Date(prompt.end_date);
      if (endDate < now) return { text: 'Expired', class: 'expired' };
    }
    
    if (prompt.is_currently_available) {
      return { text: 'Active', class: 'active' };
    } else {
      return { text: 'Scheduled', class: 'scheduled' };
    }
  };

  if (loading) {
    return (
      <div className="admin-prompt-list loading">
        <p>Loading prompts...</p>
      </div>
    );
  }

  return (
    <div className="admin-prompt-list">
      {/* Filters */}
      <div className="list-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="type-filter">Type:</label>
            <select
              id="type-filter"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="monthly">Monthly</option>
              <option value="progress">Progress</option>
              <option value="event">Event</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <button onClick={onRefresh} className="btn btn-secondary">
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPrompts.length > 0 && (
        <div className="bulk-actions">
          <span className="selection-count">
            {selectedPrompts.length} prompt(s) selected
          </span>
          <div className="bulk-buttons">
            <button
              onClick={() => handleBulkAction('activate')}
              className="btn btn-sm btn-success"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="btn btn-sm btn-warning"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="btn btn-sm btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Prompts Table */}
      <div className="prompts-table-container">
        <table className="prompts-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedPrompts.length === prompts.length && prompts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Rewards</th>
              <th>Submissions</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-prompts">
                  No prompts found matching your criteria.
                </td>
              </tr>
            ) : (
              prompts.map(prompt => {
                const status = getStatusBadge(prompt);
                return (
                  <tr key={prompt.id} className={selectedPrompts.includes(prompt.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPrompts.includes(prompt.id)}
                        onChange={() => handleSelectPrompt(prompt.id)}
                      />
                    </td>
                    <td className="title-cell">
                      <div className="prompt-title">{prompt.title}</div>
                      {prompt.description && (
                        <div className="prompt-description">{prompt.description}</div>
                      )}
                    </td>
                    <td>
                      <span className={`type-badge type-${prompt.type}`}>
                        {prompt.type}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="rewards-cell">
                      {formatRewards(prompt.rewards)}
                    </td>
                    <td className="submissions-cell">
                      <div className="submission-stats">
                        <span className="total">{prompt.submission_count || 0}</span>
                        {prompt.approved_count !== undefined && (
                          <span className="approved">({prompt.approved_count} approved)</span>
                        )}
                      </div>
                    </td>
                    <td className="date-cell">
                      {new Date(prompt.created_at).toLocaleDateString()}
                    </td>
                    <td className="actions-cell">
                      <div className="admin-action-buttons">
                        <button
                          onClick={() => onEdit(prompt)}
                          className="btn btn-primary"
                          title="Edit prompt"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(prompt.id)}
                          className="btn btn-danger"
                          title="Delete prompt"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="list-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Prompts:</span>
            <span className="stat-value">{prompts.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active:</span>
            <span className="stat-value">
              {prompts.filter(p => p.is_active).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Submissions:</span>
            <span className="stat-value">
              {prompts.reduce((sum, p) => sum + (p.submission_count || 0), 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPromptList;
