import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { AdminPromptList, PromptData, PromptFilters } from './AdminPromptList';
import { PromptForm } from './PromptForm';

export function PromptManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptData | null>(null);
  const [filters, setFilters] = useState<PromptFilters>({ type: '', category: '', status: 'all' });

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status !== 'all') {
        queryParams.append('active_only', filters.status === 'active' ? 'true' : 'false');
      }
      const response = await api.get(`/prompts?${queryParams.toString()}`);
      if (response.data.success) {
        setPrompts(response.data.prompts || []);
      } else {
        setError(response.data.message || 'Failed to fetch prompts');
      }
    } catch {
      setError('Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  const handleCreatePrompt = () => { setEditingPrompt(null); setActiveTab('form'); };

  const handleEditPrompt = (prompt: PromptData) => { setEditingPrompt(prompt); setActiveTab('form'); };

  const handleDeletePrompt = async (promptId: number) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) return;
    try {
      const response = await api.delete(`/prompts/${promptId}`);
      if (response.data.success) {
        setPrompts(prompts.filter(p => p.id !== promptId));
      } else {
        setError(response.data.message || 'Failed to delete prompt');
      }
    } catch {
      setError('Failed to delete prompt');
    }
  };

  const handleFormSuccess = (savedPrompt: Record<string, unknown>) => {
    const promptData = savedPrompt as unknown as PromptData;
    if (editingPrompt) {
      setPrompts(prompts.map(p => p.id === promptData.id ? promptData : p));
    } else {
      setPrompts([promptData, ...prompts]);
    }
    setActiveTab('list');
    setEditingPrompt(null);
  };

  const handleFormCancel = () => { setActiveTab('list'); setEditingPrompt(null); };

  return (
    <div className="prompt-management">
      <div className="item-header">
        <h2>Prompt Management</h2>
        <div className="header-actions">
          <button onClick={handleCreatePrompt} className="button primary">Create New Prompt</button>
        </div>
      </div>

      <div className="prompt-management-tabs">
        <button className={`button tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}>Prompt List</button>
        <button className={`button tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}>{editingPrompt ? 'Edit Prompt' : 'Create Prompt'}</button>
      </div>

      <div className="prompt-management-content">
        {error && (
          <div className="alert error">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="button secondary">Dismiss</button>
          </div>
        )}

        {activeTab === 'list' && (
          <AdminPromptList prompts={prompts} loading={loading}
            filters={filters} onFiltersChange={setFilters}
            onEdit={handleEditPrompt} onDelete={handleDeletePrompt} onRefresh={fetchPrompts} />
        )}

        {activeTab === 'form' && (
          <PromptForm prompt={editingPrompt} onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
        )}
      </div>
    </div>
  );
}

