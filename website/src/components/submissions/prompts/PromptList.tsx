import { useState, useEffect, useCallback } from 'react';
import { PromptCard } from './PromptCard';
import { PromptSubmissionModal } from './PromptSubmissionModal';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { Pagination } from '../../common/Pagination';
import submissionService from '../../../services/submissionService';
import type { Prompt } from './PromptCard';

interface Category {
  category: string;
  prompt_count: number;
}

interface Filters {
  type: string;
  category: string;
  difficulty: string;
  search: string;
  availableOnly: boolean;
}

interface PromptListProps {
  trainerId?: string | number;
  showFilters?: boolean;
  showSubmissionButton?: boolean;
  initialFilters?: Partial<Filters>;
  title?: string;
}

export function PromptList({
  trainerId,
  showFilters = true,
  showSubmissionButton = true,
  initialFilters = {},
  title = 'Available Prompts',
}: PromptListProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    type: '',
    category: '',
    difficulty: '',
    search: '',
    availableOnly: true,
    ...initialFilters,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.availableOnly) params.available_only = 'true';
      if (trainerId) params.trainer_id = trainerId;
      if (filters.search) params.search = filters.search;

      const data = await submissionService.getPrompts(params);

      if (data.success) {
        setPrompts(data.prompts || []);
        if (data.pagination) {
          setTotal(data.pagination.total);
        }
      } else {
        setError(data.message || 'Failed to fetch prompts');
      }
    } catch (err) {
      console.error('Error fetching prompts:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  }, [filters, page, trainerId]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await submissionService.getPromptCategories();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    if (showFilters) {
      fetchCategories();
    }
  }, [showFilters, fetchCategories]);

  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSubmit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setShowSubmissionModal(true);
  };

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false);
    setSelectedPrompt(null);
    fetchPrompts();
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && prompts.length === 0) {
    return (
      <div className="main-container">
        <LoadingSpinner message="Loading prompts..." />
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="item-header">
        <h2>{title}</h2>
        {prompts.length > 0 && (
          <p>
            Showing {prompts.length} of {total} prompts
          </p>
        )}
      </div>

      {showFilters && (
        <div className="prompt-filters">
          <div className="form-row">
            <div className="set-item">
              <label htmlFor="search">Search:</label>
              <input
                id="search"
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search prompts..."

              />
            </div>

            <div className="set-item">
              <label htmlFor="type">Type:</label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}

              >
                <option value="">All Types</option>
                <option value="general">General</option>
                <option value="monthly">Monthly</option>
                <option value="progress">Progress</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div className="set-item">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}

              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.prompt_count})
                  </option>
                ))}
              </select>
            </div>

            <div className="set-item">
              <label htmlFor="difficulty">Difficulty:</label>
              <select
                id="difficulty"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}

              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="set-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.availableOnly}
                  onChange={(e) => handleFilterChange('availableOnly', e.target.checked)}
                />
                Available only
              </label>
            </div>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
        title="Prompts Error"
        onRetry={fetchPrompts}
      />

      {prompts.length === 0 && !loading ? (
        <div className="no-prompts">
          <p>No prompts found matching your criteria.</p>
          {(filters.search || filters.type || filters.category || filters.difficulty) && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, search: '', type: '', category: '', difficulty: '' }))}
              className="button danger"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="form-row">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                showSubmissionButton={showSubmissionButton}
                onSubmit={handleSubmit}
                trainerId={trainerId}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {loading && prompts.length > 0 && (
        <div className="loading-overlay">
          <LoadingSpinner />
        </div>
      )}

      <PromptSubmissionModal
        isOpen={showSubmissionModal && selectedPrompt !== null}
        prompt={selectedPrompt}
        trainerId={trainerId}
        onClose={() => setShowSubmissionModal(false)}
        onSuccess={handleSubmissionSuccess}
      />
    </div>
  );
}

