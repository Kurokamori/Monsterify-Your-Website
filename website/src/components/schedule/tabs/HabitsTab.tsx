import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorMessage } from '../../common/ErrorMessage';
import { ConfirmModal } from '../../common/ConfirmModal';
import { HabitModal } from '../modals/HabitModal';
import { Habit, Trainer, HabitStatus, StreakStatus, capitalize } from '../types';

interface HabitsTabProps {
  trainers: Trainer[];
  onRefresh: () => void;
}

type FilterType = 'all' | HabitStatus;

export const HabitsTab = ({ trainers, onRefresh }: HabitsTabProps) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<Habit | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { status?: string } = {};
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/schedule/habits', { params });
      setHabits(response.data.data);
    } catch (err) {
      console.error('Error loading habits:', err);
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleTrackHabit = async (habitId: number) => {
    try {
      await api.post(`/schedule/habits/${habitId}/track`);
      loadHabits();
      onRefresh();
    } catch (err) {
      console.error('Error tracking habit:', err);
      alert('Failed to track habit');
    }
  };

  const handleDeleteHabit = async () => {
    if (!deleteConfirm) return;

    try {
      await api.delete(`/schedule/habits/${deleteConfirm.id}`);
      loadHabits();
      onRefresh();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting habit:', err);
      alert('Failed to delete habit');
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
  };

  const handleModalSuccess = () => {
    loadHabits();
    onRefresh();
    setShowCreateForm(false);
    setEditingHabit(null);
  };

  const handleModalClose = () => {
    setShowCreateForm(false);
    setEditingHabit(null);
  };

  const getStreakStatusClass = (status: StreakStatus): string => {
    switch (status) {
      case 'active': return 'active';
      case 'at_risk': return 'at_risk';
      case 'broken': return 'broken';
      default: return 'muted';
    }
  };

  const getFilteredHabits = (): Habit[] => {
    if (filter === 'all') return habits;
    return habits.filter(habit => habit.status === filter);
  };

  const getHabitCount = (status?: HabitStatus): number => {
    if (!status) return habits.length;
    return habits.filter(habit => habit.status === status).length;
  };

  if (loading) {
    return <LoadingSpinner message="Loading habits..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadHabits} />;
  }

  const filteredHabits = getFilteredHabits();

  return (
    <div className="schedule-tab">
      <div className="schedule-tab__header">
        <h2>Habits</h2>
        <button
          className="button primary"
          onClick={() => setShowCreateForm(true)}
        >
          <i className="fas fa-plus"></i>
          Create Habit
        </button>
      </div>

      <div className="tab-filters">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({getHabitCount()})
        </button>
        <button
          className={`filter-button ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({getHabitCount('active')})
        </button>
        <button
          className={`filter-button ${filter === 'paused' ? 'active' : ''}`}
          onClick={() => setFilter('paused')}
        >
          Paused ({getHabitCount('paused')})
        </button>
      </div>

      {filteredHabits.length === 0 ? (
        <div className="schedule-empty">
          <i className="fas fa-chart-line"></i>
          <h3>No habits found</h3>
          <p>
            {filter === 'all'
              ? "You haven't created any habits yet. Create your first habit to start building positive routines!"
              : `No ${filter} habits found.`
            }
          </p>
          <button
            className="button primary"
            onClick={() => setShowCreateForm(true)}
          >
            <i className="fas fa-plus"></i>
            Create Your First Habit
          </button>
        </div>
      ) : (
        <div className="item-list">
          {filteredHabits.map(habit => (
            <div
              key={habit.id}
              className={`item-card item-card--${habit.status}`}
            >
              <div className="item-card__header">
                <h3 className="item-card__title">{habit.title}</h3>
                <span className={`streak-badge streak-badge--${getStreakStatusClass(habit.streak_status)}`}>
                  <i className="fas fa-fire"></i>
                  {habit.streak || 0} day streak
                </span>
              </div>

              {habit.description && (
                <p className="schedule-item-description">{habit.description}</p>
              )}

              <div className="item-meta">
                <span>Frequency: {capitalize(habit.frequency)}</span>
                <span>Status: {capitalize(habit.streak_status)}</span>
                <span>Best streak: {habit.best_streak || 0} days</span>
                {habit.trainer_name && (
                  <span>Trainer: {habit.trainer_name}</span>
                )}
                {(habit.reward_levels > 0 || habit.reward_coins > 0) && (
                  <span>Reward: {habit.reward_levels} levels, {habit.reward_coins} coins</span>
                )}
              </div>

              {habit.last_completed_at && (
                <div className="item-meta">
                  <span>
                    Last completed: {new Date(habit.last_completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="item-actions">
                {habit.status === 'active' && (
                  <button
                    className="button primary sm"
                    onClick={() => handleTrackHabit(habit.id)}
                  >
                    <i className="fas fa-check"></i>
                    Track Today
                  </button>
                )}
                <button
                  className="button secondary sm"
                  onClick={() => handleEditHabit(habit)}
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button
                  className="button danger sm"
                  onClick={() => setDeleteConfirm(habit)}
                >
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Habit Modal */}
      <HabitModal
        isOpen={showCreateForm || editingHabit !== null}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        trainers={trainers}
        habit={editingHabit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteHabit}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"?`}
        warning="This will also delete all streak history. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        confirmIcon="fas fa-trash"
      />
    </div>
  );
};

export default HabitsTab;
