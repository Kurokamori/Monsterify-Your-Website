import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { AdminPromptList, PromptData, PromptFilters } from './AdminPromptList';
import { PromptGridView } from './PromptGridView';
import type { PromptDraftEntry } from './PromptGridView';
import { PromptForm } from './PromptForm';

type PromptManagementTab = 'list' | 'grid' | 'form';

const DEFAULT_PER_PAGE: number = 25;
const PER_PAGE_OPTIONS: number[] = [10, 25, 50, 100];

export function PromptManagement() {
  const [activeTab, setActiveTab] = useState<PromptManagementTab>('list');
  const [lastBrowseTab, setLastBrowseTab] = useState<'list' | 'grid'>('list');
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptData | null>(null);
  const [filters, setFilters] = useState<PromptFilters>({ type: '', category: '', status: 'all' });
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPrompts, setTotalPrompts] = useState<number>(0);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', String(perPage));
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.category) queryParams.append('category', filters.category);
      queryParams.append(
        'active_only',
        filters.status === 'all' ? 'all' : filters.status === 'active' ? 'true' : 'false'
      );
      const response = await api.get(`/prompts?${queryParams.toString()}`);
      if (response.data.success) {
        const pages: number = response.data.pagination?.totalPages ?? 1;
        setPrompts(response.data.prompts || []);
        setTotalPages(pages);
        setTotalPrompts(response.data.pagination?.total ?? 0);
        if (page > pages) setPage(pages);
      } else {
        setError(response.data.message || 'Failed to fetch prompts');
      }
    } catch {
      setError('Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  }, [filters, page, perPage]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  const handleFiltersChange = (nextFilters: PromptFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handlePerPageChange = (nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);
  };

  const handleCreatePrompt = () => { setEditingPrompt(null); setActiveTab('form'); };

  const handleEditPrompt = (prompt: PromptData) => { setEditingPrompt(prompt); setActiveTab('form'); };

  const handleDeletePrompt = async (promptId: number) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) return;
    try {
      const response = await api.delete(`/prompts/${promptId}`);
      if (response.data.success) {
        await fetchPrompts();
      } else {
        setError(response.data.message || 'Failed to delete prompt');
      }
    } catch {
      setError('Failed to delete prompt');
    }
  };

  const handleInlineSave = async (entries: PromptDraftEntry[]): Promise<boolean> => {
    const failures: number[] = [];
    for (const entry of entries) {
      try {
        const response = await api.put(`/prompts/${entry.id}`, {
          title: entry.draft.title,
          description: entry.draft.description,
          category: entry.draft.category,
          difficulty: entry.draft.difficulty,
          priority: entry.draft.priority,
          is_active: entry.draft.is_active,
          event_name: entry.draft.event_name || null,
        });
        if (!response.data.success) { failures.push(entry.id); }
      } catch {
        failures.push(entry.id);
      }
    }

    if (failures.length > 0) {
      setError(`Failed to update prompt(s): ${failures.join(', ')}`);
    }
    await fetchPrompts();
    return failures.length === 0;
  };

  const handleFormSuccess = () => {
    setActiveTab(lastBrowseTab);
    setEditingPrompt(null);
    fetchPrompts();
  };

  const handleFormCancel = () => { setActiveTab(lastBrowseTab); setEditingPrompt(null); };

  const handleBrowseTabChange = (tab: 'list' | 'grid') => {
    setLastBrowseTab(tab);
    setActiveTab(tab);
  };

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
          onClick={() => handleBrowseTabChange('list')}>Prompt List</button>
        <button className={`button tab ${activeTab === 'grid' ? 'active' : ''}`}
          onClick={() => handleBrowseTabChange('grid')}>Grid View</button>
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
            filters={filters} onFiltersChange={handleFiltersChange}
            onEdit={handleEditPrompt} onDelete={handleDeletePrompt} onRefresh={fetchPrompts}
            currentPage={page} totalPages={totalPages} totalPrompts={totalPrompts}
            perPage={perPage} perPageOptions={PER_PAGE_OPTIONS}
            onPageChange={setPage} onPerPageChange={handlePerPageChange} />
        )}

        {activeTab === 'grid' && (
          <PromptGridView prompts={prompts} loading={loading}
            filters={filters} onFiltersChange={handleFiltersChange}
            onEdit={handleEditPrompt} onDelete={handleDeletePrompt}
            onInlineSave={handleInlineSave} onRefresh={fetchPrompts}
            currentPage={page} totalPages={totalPages} totalPrompts={totalPrompts}
            perPage={perPage} perPageOptions={PER_PAGE_OPTIONS}
            onPageChange={setPage} onPerPageChange={handlePerPageChange} />
        )}

        {activeTab === 'form' && (
          <PromptForm prompt={editingPrompt} onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
        )}
      </div>
    </div>
  );
}

