import { useState } from 'react';

export interface PromptData {
  id: number;
  title: string;
  description?: string;
  type: string;
  is_active: boolean;
  is_currently_available?: boolean;
  end_date?: string;
  rewards?: string | Record<string, unknown>;
  submission_count?: number;
  approved_count?: number;
  created_at: string;
  [key: string]: unknown;
}

export interface PromptFilters {
  type: string;
  status: string;
  [key: string]: string;
}

interface AdminPromptListProps {
  prompts: PromptData[];
  loading: boolean;
  filters: PromptFilters;
  onFiltersChange: (filters: PromptFilters) => void;
  onEdit: (prompt: PromptData) => void;
  onDelete: (promptId: number) => Promise<void>;
  onRefresh: () => void;
}

function formatRewards(rewards: string | Record<string, unknown> | undefined): string {
  if (!rewards) return 'No rewards';
  const rewardObj = typeof rewards === 'string' ? JSON.parse(rewards) : rewards;
  const parts: string[] = [];
  if (rewardObj.levels) parts.push(`${rewardObj.levels}L`);
  if (rewardObj.coins) parts.push(`${rewardObj.coins}C`);
  if (rewardObj.items && Array.isArray(rewardObj.items) && rewardObj.items.length > 0) parts.push(`${rewardObj.items.length}I`);
  if (rewardObj.monster_roll?.enabled) parts.push('MR');
  return parts.length > 0 ? parts.join(' + ') : 'Custom';
}

function getStatusBadge(prompt: PromptData): { text: string; className: string } {
  if (!prompt.is_active) return { text: 'Inactive', className: 'inactive' };
  if (prompt.type === 'event' && prompt.end_date) {
    if (new Date(prompt.end_date) < new Date()) return { text: 'Expired', className: 'expired' };
  }
  if (prompt.is_currently_available) return { text: 'Active', className: 'active' };
  return { text: 'Scheduled', className: 'scheduled' };
}

export function AdminPromptList({ prompts, loading, filters, onFiltersChange, onEdit, onDelete, onRefresh }: AdminPromptListProps) {
  const [selectedPrompts, setSelectedPrompts] = useState<number[]>([]);

  const handleFilterChange = (key: keyof PromptFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleSelectPrompt = (promptId: number) => {
    setSelectedPrompts(prev =>
      prev.includes(promptId) ? prev.filter(id => id !== promptId) : [...prev, promptId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPrompts(selectedPrompts.length === prompts.length ? [] : prompts.map(p => p.id));
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPrompts.length === 0) return;
    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedPrompts.length} prompt(s)?`)) return;
      for (const promptId of selectedPrompts) {
        await onDelete(promptId);
      }
      setSelectedPrompts([]);
    }
  };

  if (loading) {
    return <div className="admin-prompt-list loading"><p>Loading prompts...</p></div>;
  }

  return (
    <div className="admin-prompt-list">
      {/* Filters */}
      <div className="list-filters">
        <div className="form-row">
          <div className="set-item">
            <label htmlFor="type-filter">Type:</label>
            <select id="type-filter" value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)} className="filter-input">
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="monthly">Monthly</option>
              <option value="progress">Progress</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div className="set-item">
            <label htmlFor="status-filter">Status:</label>
            <select id="status-filter" value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)} className="filter-input">
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <button onClick={onRefresh} className="button secondary">Refresh</button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPrompts.length > 0 && (
        <div className="bulk-actions">
          <span className="selection-count">{selectedPrompts.length} prompt(s) selected</span>
          <div className="bulk-buttons">
            <button onClick={() => handleBulkAction('activate')} className="button success sm">Activate</button>
            <button onClick={() => handleBulkAction('deactivate')} className="button warning sm">Deactivate</button>
            <button onClick={() => handleBulkAction('delete')} className="button danger sm">Delete</button>
          </div>
        </div>
      )}

      {/* Prompts Table */}
      <div className="prompts-table-container">
        <table className="prompts-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={selectedPrompts.length === prompts.length && prompts.length > 0} onChange={handleSelectAll} /></th>
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
              <tr><td colSpan={10} className="no-prompts">No prompts found matching your criteria.</td></tr>
            ) : (
              prompts.map(prompt => {
                const status = getStatusBadge(prompt);
                return (
                  <tr key={prompt.id} className={selectedPrompts.includes(prompt.id) ? 'selected' : ''}>
                    <td><input type="checkbox" checked={selectedPrompts.includes(prompt.id)} onChange={() => handleSelectPrompt(prompt.id)} /></td>
                    <td className="title-cell">
                      <div className="prompt-title">{prompt.title}</div>
                      {prompt.description && <div className="admin-prompt__description">{prompt.description}</div>}
                    </td>
                    <td><span className={`badge type-${prompt.type}`}>{prompt.type}</span></td>
                    <td><span className={`badge ${status.className}`}>{status.text}</span></td>
                    <td className="rewards-cell">{formatRewards(prompt.rewards)}</td>
                    <td className="submissions-cell">
                      <div className="submission-stats">
                        <span className="total">{prompt.submission_count || 0}</span>
                        {prompt.approved_count !== undefined && <span className="approved">({prompt.approved_count} approved)</span>}
                      </div>
                    </td>
                    <td className="date-cell">{new Date(prompt.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <div className="admin-prompt__actions">
                        <button onClick={() => onEdit(prompt)} className="button primary" title="Edit prompt">Edit</button>
                        <button onClick={() => onDelete(prompt.id)} className="button danger" title="Delete prompt">Delete</button>
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
      <div className="item-config">
        <div className="summary-stats">
          <div className="stat-item"><span className="admin-prompt__stat-label">Total Prompts:</span> <span className="stat-value">{prompts.length}</span></div>
          <div className="stat-item"><span className="admin-prompt__stat-label">Active:</span> <span className="stat-value">{prompts.filter(p => p.is_active).length}</span></div>
          <div className="stat-item"><span className="admin-prompt__stat-label">Total Submissions:</span> <span className="stat-value">{prompts.reduce((sum, p) => sum + (p.submission_count || 0), 0)}</span></div>
        </div>
      </div>
    </div>
  );
}

