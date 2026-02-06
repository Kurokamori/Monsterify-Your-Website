import React, { useState, useEffect } from 'react';
import PromptCard from './PromptCard';
import PromptSubmissionModal from './PromptSubmissionModal';
import LoadingSpinner from '../common/LoadingSpinner';

const PromptList = ({ 
  trainerId, 
  showFilters = true, 
  showSubmissionButton = true,
  initialFilters = {},
  title = "Available Prompts"
}) => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    difficulty: '',
    search: '',
    availableOnly: true,
    ...initialFilters
  });
  const [categories, setCategories] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0
  });

  // Fetch prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters.availableOnly) queryParams.append('available_only', 'true');
      if (trainerId) queryParams.append('trainer_id', trainerId);
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);

      let url = '/api/prompts';
      if (filters.search) {
        url = `/api/prompts/search/${encodeURIComponent(filters.search)}`;
      }
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPrompts(data.prompts || []);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination.total
          }));
        }
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/prompts/meta/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [filters, pagination.page, trainerId]);

  useEffect(() => {
    if (showFilters) {
      fetchCategories();
    }
  }, [showFilters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSubmit = (prompt) => {
    setSelectedPrompt(prompt);
    setShowSubmissionModal(true);
  };

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false);
    setSelectedPrompt(null);
    fetchPrompts(); // Refresh the list
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && prompts.length === 0) {
    return (
      <div className="prompt-list-container">
        <LoadingSpinner />
        <p>Loading prompts...</p>
      </div>
    );
  }

  return (
    <div className="prompt-list-container">
      <div className="prompt-list-header">
        <h2>{title}</h2>
        {prompts.length > 0 && (
          <p className="prompt-count">
            Showing {prompts.length} of {pagination.total} prompts
          </p>
        )}
      </div>

      {showFilters && (
        <div className="prompt-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="search">Search:</label>
              <input
                id="search"
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search prompts..."
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="type">Type:</label>
              <select
                id="type"
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
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.prompt_count})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="difficulty">Difficulty:</label>
              <select
                id="difficulty"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="filter-select"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="filter-group">
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

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={fetchPrompts} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {prompts.length === 0 && !loading ? (
        <div className="no-prompts">
          <p>No prompts found matching your criteria.</p>
          {filters.search || filters.type || filters.category || filters.difficulty ? (
            <button 
              onClick={() => setFilters({ ...filters, search: '', type: '', category: '', difficulty: '' })}
              className="button danger"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="prompt-grid">
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

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="button secondary"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className="button secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {loading && prompts.length > 0 && (
        <div className="loading-overlay">
          <LoadingSpinner />
        </div>
      )}

      {showSubmissionModal && selectedPrompt && (
        <PromptSubmissionModal
          prompt={selectedPrompt}
          trainerId={trainerId}
          onClose={() => setShowSubmissionModal(false)}
          onSuccess={handleSubmissionSuccess}
        />
      )}
    </div>
  );
};

export default PromptList;
