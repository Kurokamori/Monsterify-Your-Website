import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useAuth } from '../../../contexts/AuthContext';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import { Pagination } from '../../../components/common/Pagination';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import '../../../styles/guides/available-prompts.css';

interface PromptRewards {
  levels?: number;
  coins?: number;
  items?: { item_name?: string; quantity?: number; category?: string; chance?: number }[];
  monsters?: unknown[];
  monster_roll?: { enabled: boolean };
  static_monsters?: { species?: string }[];
  semi_random_monsters?: unknown[];
  bonus_conditions?: {
    quality_threshold?: number;
    bonus_levels?: number;
    bonus_coins?: number;
  };
  [key: string]: unknown;
}

interface Prompt {
  id: number;
  title: string;
  description: string | null;
  type: string;
  category: string;
  difficulty: string;
  isActive: boolean;
  priority: number;
  maxSubmissions: number | null;
  maxSubmissionsPerTrainer: number | null;
  requiresApproval: boolean;
  activeMonths: string | null;
  startDate: string | null;
  endDate: string | null;
  rewards: PromptRewards | null;
  requirements: Record<string, unknown> | null;
  tags: string[] | null;
  minTrainerLevel: number | null;
  maxTrainerLevel: number | null;
  requiredFactions: string[] | null;
  eventName: string | null;
  submissionCount: number;
  approvedCount: number;
  pendingCount: number;
  isCurrentlyAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Trainer {
  id: number;
  name: string;
  level?: number;
  faction?: string;
}

type PromptTypeFilter = 'all' | 'general' | 'progress' | 'monthly' | 'event';

const PROMPT_TYPES: { value: PromptTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'general', label: 'General' },
  { value: 'progress', label: 'Progression' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'event', label: 'Event' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'var(--success-color)',
  medium: 'var(--warning-color)',
  hard: 'var(--error-light)',
  expert: 'var(--poison-type)',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const AvailablePromptsPage = () => {
  useDocumentTitle('Available Prompts - Tools');

  const { currentUser, isAuthenticated } = useAuth();

  // Data
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<PromptTypeFilter>('all');
  const [trainerId, setTrainerId] = useState<string>('');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);

  // Expanded cards
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

  // Fetch user trainers
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const fetchTrainers = async () => {
      try {
        const result = await trainerService.getUserTrainers();
        setTrainers(result.trainers || []);
      } catch {
        // Non-critical - trainer filter just won't be available
      }
    };

    fetchTrainers();
  }, [isAuthenticated, currentUser]);

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        limit: 200,
        page: 1,
      };

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (!showUnavailable) {
        params.available_only = 'true';
      }
      // When showUnavailable is true, don't set available_only so we get all prompts (both available and unavailable)

      if (trainerId) {
        params.trainer_id = trainerId;
      }

      const result = await submissionService.getPrompts(params);
      setPrompts(result.prompts || []);
    } catch {
      setError('Failed to load prompts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, showUnavailable, trainerId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPrompts();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchPrompts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, trainerId, showUnavailable, searchTerm]);

  // Filter and group prompts
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    return filtered;
  }, [prompts, searchTerm]);

  // Group prompts for monthly and event views
  const groupedPrompts = useMemo(() => {
    if (typeFilter === 'monthly') {
      const groups: Record<string, Prompt[]> = {};
      const currentMonth = new Date().getMonth() + 1;

      filteredPrompts.forEach(p => {
        if (p.activeMonths) {
          const months = p.activeMonths.split(',').map(m => m.trim());
          months.forEach(m => {
            const monthNum = parseInt(m, 10);
            if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
              const key = MONTH_NAMES[monthNum - 1];
              if (!groups[key]) groups[key] = [];
              if (!groups[key].some(gp => gp.id === p.id)) {
                groups[key].push(p);
              }
            }
          });
        } else {
          if (!groups['Unspecified']) groups['Unspecified'] = [];
          groups['Unspecified'].push(p);
        }
      });

      // Sort: current month first, then chronologically
      const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
        const aIdx = MONTH_NAMES.indexOf(a);
        const bIdx = MONTH_NAMES.indexOf(b);
        if (a === 'Unspecified') return 1;
        if (b === 'Unspecified') return -1;
        // Rotate so current month is first
        const aRot = ((aIdx - currentMonth + 1) + 12) % 12;
        const bRot = ((bIdx - currentMonth + 1) + 12) % 12;
        return aRot - bRot;
      });

      return sortedEntries;
    }

    if (typeFilter === 'event') {
      const groups: Record<string, Prompt[]> = {};

      filteredPrompts.forEach(p => {
        const key = p.eventName || 'Other Events';
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      });

      // Sort: active events first
      const sortedEntries = Object.entries(groups).sort(([, a], [, b]) => {
        const aActive = a.some(p => p.isCurrentlyAvailable);
        const bActive = b.some(p => p.isCurrentlyAvailable);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return 0;
      });

      return sortedEntries;
    }

    return null;
  }, [filteredPrompts, typeFilter]);

  // Paginated prompts for non-grouped views
  const paginatedPrompts = useMemo(() => {
    if (groupedPrompts) return null;
    const start = (page - 1) * limit;
    return filteredPrompts.slice(start, start + limit);
  }, [filteredPrompts, page, groupedPrompts, limit]);

  const totalPages = groupedPrompts ? 0 : Math.ceil(filteredPrompts.length / limit);

  const toggleExpanded = (id: number) => {
    setExpandedPrompt(prev => (prev === id ? null : id));
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setTrainerId('');
    setShowUnavailable(false);
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = typeFilter !== 'all' || trainerId !== '' || showUnavailable || searchTerm !== '';

  // Format rewards for display
  const formatRewards = (rewards: PromptRewards | null) => {
    if (!rewards) return [];
    const parts: { icon: string; text: string; className: string }[] = [];

    if (rewards.levels) {
      parts.push({ icon: 'fa-arrow-up', text: `${rewards.levels} level${rewards.levels > 1 ? 's' : ''}`, className: 'reward--level' });
    }
    if (rewards.coins) {
      parts.push({ icon: 'fa-coins', text: `${rewards.coins} coin${rewards.coins > 1 ? 's' : ''}`, className: 'reward--coin' });
    }
    if (rewards.items && rewards.items.length > 0) {
      parts.push({ icon: 'fa-gift', text: `${rewards.items.length} item${rewards.items.length > 1 ? 's' : ''}`, className: 'reward--item' });
    }
    if (rewards.static_monsters && rewards.static_monsters.length > 0) {
      parts.push({ icon: 'fa-dragon', text: `${rewards.static_monsters.length} monster${rewards.static_monsters.length > 1 ? 's' : ''}`, className: 'reward--monster' });
    }
    if (rewards.semi_random_monsters && (rewards.semi_random_monsters as unknown[]).length > 0) {
      parts.push({ icon: 'fa-dice', text: 'Random monster roll', className: 'reward--monster' });
    }
    if (rewards.monster_roll?.enabled) {
      parts.push({ icon: 'fa-dice', text: 'Monster roll', className: 'reward--monster' });
    }
    if (rewards.bonus_conditions) {
      parts.push({ icon: 'fa-star', text: 'Bonus rewards available', className: 'reward--bonus' });
    }

    return parts;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getActiveMonthNames = (activeMonths: string | null) => {
    if (!activeMonths) return [];
    return activeMonths
      .split(',')
      .map(m => {
        const num = parseInt(m.trim(), 10);
        return num >= 1 && num <= 12 ? MONTH_NAMES[num - 1] : null;
      })
      .filter(Boolean) as string[];
  };

  // Render a single prompt card
  const renderPromptCard = (prompt: Prompt) => {
    const isExpanded = expandedPrompt === prompt.id;
    const rewards = formatRewards(prompt.rewards);
    const isAvailable = prompt.isCurrentlyAvailable;

    return (
      <div
        key={prompt.id}
        className={`prompt-browse-card ${isExpanded ? 'prompt-browse-card--expanded' : ''} ${!isAvailable ? 'prompt-browse-card--unavailable' : ''}`}
        onClick={() => toggleExpanded(prompt.id)}
      >
        {/* Status indicator */}
        <div className={`prompt-browse-card__status ${isAvailable ? 'prompt-browse-card__status--active' : 'prompt-browse-card__status--inactive'}`}>
          <i className={`fas ${isAvailable ? 'fa-check-circle' : 'fa-clock'}`} />
          {isAvailable ? 'Available' : 'Unavailable'}
        </div>

        {/* Header */}
        <div className="prompt-browse-card__header">
          <h3 className="prompt-browse-card__title">{prompt.title}</h3>
          <div className="prompt-browse-card__badges">
            <span className={`prompt-browse-card__type-badge prompt-browse-card__type-badge--${prompt.type}`}>
              {prompt.type === 'progress' ? 'progression' : prompt.type}
            </span>
            {prompt.difficulty && (
              <span
                className="prompt-browse-card__difficulty-badge"
                style={{ '--node-accent': DIFFICULTY_COLORS[prompt.difficulty] || 'var(--text-color-muted)' } as React.CSSProperties}
              >
                {prompt.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Description preview */}
        {prompt.description && (
          <p className={`prompt-browse-card__description ${isExpanded ? 'prompt-browse-card__description--full' : ''}`}>
            {prompt.description}
          </p>
        )}

        {/* Rewards preview */}
        {rewards.length > 0 && (
          <div className="prompt-browse-card__rewards">
            {rewards.map((r, i) => (
              <span key={i} className={`prompt-browse-card__reward ${r.className}`}>
                <i className={`fas ${r.icon}`} />
                {r.text}
              </span>
            ))}
          </div>
        )}

        {/* Expanded details */}
        {isExpanded && (
          <div className="prompt-browse-card__details">
            {/* Requirements */}
            {(prompt.minTrainerLevel || prompt.maxTrainerLevel || (prompt.requiredFactions && prompt.requiredFactions.length > 0)) && (
              <div className="prompt-browse-card__detail-section">
                <h4 className="prompt-browse-card__detail-label">
                  <i className="fas fa-lock" /> Requirements
                </h4>
                <div className="prompt-browse-card__detail-content">
                  {prompt.minTrainerLevel != null && (
                    <span className="prompt-browse-card__detail-item">
                      <i className="fas fa-level-up-alt" /> Min Level: {prompt.minTrainerLevel}
                    </span>
                  )}
                  {prompt.maxTrainerLevel != null && (
                    <span className="prompt-browse-card__detail-item">
                      <i className="fas fa-level-down-alt" /> Max Level: {prompt.maxTrainerLevel}
                    </span>
                  )}
                  {prompt.requiredFactions && prompt.requiredFactions.length > 0 && (
                    <span className="prompt-browse-card__detail-item">
                      <i className="fas fa-users" /> Factions: {prompt.requiredFactions.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Time frame */}
            {(prompt.type === 'event' || prompt.type === 'monthly') && (
              <div className="prompt-browse-card__detail-section">
                <h4 className="prompt-browse-card__detail-label">
                  <i className="fas fa-calendar-alt" /> Time Frame
                </h4>
                <div className="prompt-browse-card__detail-content">
                  {prompt.type === 'event' && (
                    <>
                      {prompt.startDate && (
                        <span className="prompt-browse-card__detail-item">
                          <i className="fas fa-play" /> Start: {formatDate(prompt.startDate)}
                        </span>
                      )}
                      {prompt.endDate && (
                        <span className="prompt-browse-card__detail-item">
                          <i className="fas fa-stop" /> End: {formatDate(prompt.endDate)}
                        </span>
                      )}
                    </>
                  )}
                  {prompt.type === 'monthly' && prompt.activeMonths && (
                    <span className="prompt-browse-card__detail-item">
                      <i className="fas fa-calendar" /> Active: {getActiveMonthNames(prompt.activeMonths).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submission limits */}
            {(prompt.maxSubmissions || prompt.maxSubmissionsPerTrainer) && (
              <div className="prompt-browse-card__detail-section">
                <h4 className="prompt-browse-card__detail-label">
                  <i className="fas fa-exclamation-triangle" /> Limits
                </h4>
                <div className="prompt-browse-card__detail-content">
                  {prompt.maxSubmissionsPerTrainer != null && (
                    <span className="prompt-browse-card__detail-item">
                      <i className="fas fa-user" /> Max {prompt.maxSubmissionsPerTrainer} per trainer
                    </span>
                  )}
                  {prompt.maxSubmissions != null && (
                    <span className="prompt-browse-card__detail-item">
                      <i className="fas fa-globe" /> Max {prompt.maxSubmissions} total
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Detailed rewards */}
            {prompt.rewards && (
              <div className="prompt-browse-card__detail-section">
                <h4 className="prompt-browse-card__detail-label">
                  <i className="fas fa-trophy" /> Reward Details
                </h4>
                <div className="prompt-browse-card__detail-content">
                  {prompt.rewards.levels != null && prompt.rewards.levels > 0 && (
                    <span className="prompt-browse-card__detail-item">
                      <i className="fas fa-arrow-up" /> {prompt.rewards.levels} level{prompt.rewards.levels > 1 ? 's' : ''}
                    </span>
                  )}
                  {prompt.rewards.coins != null && prompt.rewards.coins > 0 && (
                    <span className="prompt-browse-card__detail-item">
                      <i className="fas fa-coins" /> {prompt.rewards.coins} coin{prompt.rewards.coins > 1 ? 's' : ''}
                    </span>
                  )}
                  {prompt.rewards.items && prompt.rewards.items.length > 0 && (
                    <div className="prompt-browse-card__item-list">
                      {prompt.rewards.items.map((item, i) => (
                        <span key={i} className="prompt-browse-card__detail-item">
                          <i className="fas fa-gift" />
                          {item.item_name || item.category || 'Item'}
                          {item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ''}
                          {item.chance && item.chance < 100 ? ` (${item.chance}% chance)` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {prompt.rewards.bonus_conditions && (
                    <span className="prompt-browse-card__detail-item prompt-browse-card__detail-item--bonus">
                      <i className="fas fa-star" /> Quality bonus:
                      {prompt.rewards.bonus_conditions.bonus_levels ? ` +${prompt.rewards.bonus_conditions.bonus_levels} levels` : ''}
                      {prompt.rewards.bonus_conditions.bonus_coins ? ` +${prompt.rewards.bonus_conditions.bonus_coins} coins` : ''}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="prompt-browse-card__tags">
                {prompt.tags.map((tag, i) => (
                  <span key={i} className="prompt-browse-card__tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expand indicator */}
        <div className="prompt-browse-card__expand-indicator">
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} />
        </div>
      </div>
    );
  };

  // Render grouped prompts
  const renderGroupedPrompts = () => {
    if (!groupedPrompts || groupedPrompts.length === 0) {
      return (
        <div className="available-prompts__no-results">
          <i className="fas fa-scroll" />
          <h3>No prompts found</h3>
          <p>Try adjusting your filters or check back later</p>
        </div>
      );
    }

    const currentMonth = MONTH_NAMES[new Date().getMonth()];

    return (
      <div className="available-prompts__grouped">
        {groupedPrompts.map(([groupName, groupPrompts]) => {
          const isCurrentMonth = typeFilter === 'monthly' && groupName === currentMonth;
          const hasActive = groupPrompts.some(p => p.isCurrentlyAvailable);

          return (
            <div key={groupName} className="available-prompts__group">
              <div className={`available-prompts__group-header ${isCurrentMonth ? 'available-prompts__group-header--current' : ''}`}>
                <h2>
                  {typeFilter === 'monthly' && <i className="fas fa-calendar-alt" />}
                  {typeFilter === 'event' && <i className="fas fa-star" />}
                  {groupName}
                  {isCurrentMonth && <span className="available-prompts__current-badge">Current Month</span>}
                </h2>
                {hasActive && (
                  <span className="available-prompts__group-active-count">
                    {groupPrompts.filter(p => p.isCurrentlyAvailable).length} active
                  </span>
                )}
              </div>
              <div className="available-prompts__grid">
                {groupPrompts.map(renderPromptCard)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="available-prompts">
      <div className="guide-page__header">
        <h1>Available Prompts</h1>
        <p>Browse all submission prompts, filter by type or trainer, and see what rewards await</p>
      </div>

      {/* Filter section */}
      <div className="available-prompts__filter-section">
        <div className="available-prompts__filter-header">
          <h2>Filters</h2>
          {hasActiveFilters && (
            <button className="button danger sm no-flex" onClick={clearFilters}>
              <i className="fas fa-times" /> Clear Filters
            </button>
          )}
        </div>

        <div className="available-prompts__filter-row">
          {/* Type filter */}
          <div className="available-prompts__filter-group">
            <label htmlFor="prompt-type-filter">
              <i className="fas fa-tag" /> Prompt Type
            </label>
            <div className="available-prompts__type-buttons">
              {PROMPT_TYPES.map(pt => (
                <button
                  key={pt.value}
                  className={`available-prompts__type-button ${typeFilter === pt.value ? 'available-prompts__type-button--selected' : ''}`}
                  onClick={() => setTypeFilter(pt.value)}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trainer filter */}
          {isAuthenticated && trainers.length > 0 && (
            <div className="available-prompts__filter-group">
              <label htmlFor="trainer-filter">
                <i className="fas fa-user" /> Filter by Trainer
              </label>
              <select
                id="trainer-filter"
                className="input"
                value={trainerId}
                onChange={e => setTrainerId(e.target.value)}
              >
                <option value="">All Prompts</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="available-prompts__filter-group">
            <label htmlFor="prompt-search">
              <i className="fas fa-search" /> Search
            </label>
            <input
              id="prompt-search"
              type="text"
              className="input"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Show unavailable toggle */}
        <div className="available-prompts__toggle-row">
          <label className="available-prompts__toggle" htmlFor="show-unavailable">
            <input
              id="show-unavailable"
              type="checkbox"
              checked={showUnavailable}
              onChange={e => setShowUnavailable(e.target.checked)}
            />
            <span className="available-prompts__toggle-slider" />
            <span className="available-prompts__toggle-label">Show unavailable prompts</span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="available-prompts__results">
        <div className="available-prompts__results-header">
          <div className="available-prompts__results-count">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <span>Found <strong>{filteredPrompts.length}</strong> prompt{filteredPrompts.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {error && (
          <div className="available-prompts__error">
            <i className="fas fa-exclamation-circle" /> {error}
            <button className="button sm" onClick={fetchPrompts}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="available-prompts__loading">
            <LoadingSpinner />
            <p>Loading prompts...</p>
          </div>
        ) : groupedPrompts ? (
          renderGroupedPrompts()
        ) : paginatedPrompts && paginatedPrompts.length > 0 ? (
          <>
            <div className="available-prompts__grid">
              {paginatedPrompts.map(renderPromptCard)}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              perPage={limit}
              onPerPageChange={(val) => { setLimit(val); setPage(1); }}
            />
          </>
        ) : (
          <div className="available-prompts__no-results">
            <i className="fas fa-scroll" />
            <h3>No prompts found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailablePromptsPage;
