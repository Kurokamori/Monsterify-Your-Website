import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import HabitModal from './modals/HabitModal';

const HabitsTab = ({ trainers, onRefresh }) => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadHabits();
  }, [filter]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/schedule/habits', { params });
      setHabits(response.data.data);
    } catch (error) {
      console.error('Error loading habits:', error);
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackHabit = async (habitId) => {
    try {
      await api.post(`/schedule/habits/${habitId}/track`);
      loadHabits();
      onRefresh();
    } catch (error) {
      console.error('Error tracking habit:', error);
      alert('Failed to track habit');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) {
      return;
    }

    try {
      await api.delete(`/schedule/habits/${habitId}`);
      loadHabits();
      onRefresh();
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert('Failed to delete habit');
    }
  };

  const handleEditHabit = (habit) => {
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

  const getStreakStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'at_risk': return 'warning';
      case 'broken': return 'danger';
      default: return 'muted';
    }
  };

  const filteredHabits = habits.filter(habit => {
    if (filter === 'all') return true;
    return habit.status === filter;
  });

  if (loading) {
    return <LoadingSpinner message="Loading habits..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadHabits} />;
  }

  return (
    <div className="habits-tab">
      <div className="tab-header">
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
          className={`button filter ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({habits.length})
        </button>
        <button
          className={`button filter ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({habits.filter(h => h.status === 'active').length})
        </button>
        <button
          className={`button filter ${filter === 'paused' ? 'active' : ''}`}
          onClick={() => setFilter('paused')}
        >
          Paused ({habits.filter(h => h.status === 'paused').length})
        </button>
      </div>

      {filteredHabits.length === 0 ? (
        <div className="empty-state">
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
            <div key={habit.id} className="item-card">
              <div className="item-header">
                <h3 className="item-title">{habit.title}</h3>
                <div className="habit-streak">
                  <span className={`streak-badge ${getStreakStatusColor(habit.streak_status)}`}>
                    <i className="fas fa-fire"></i>
                    {habit.streak || 0} day streak
                  </span>
                </div>
              </div>

              {habit.description && (
                <p className="item-description">{habit.description}</p>
              )}

              <div className="item-meta">
                <span>Frequency: {habit.frequency}</span>
                <span>Status: {habit.streak_status}</span>
                <span>Best streak: {habit.best_streak || 0} days</span>
                {habit.trainer_name && (
                  <span>Trainer: {habit.trainer_name}</span>
                )}
                {habit.reward_levels > 0 && (
                  <span>Reward: {habit.reward_levels} levels, {habit.reward_coins} coins</span>
                )}
              </div>

              {habit.last_completed_at && (
                <div className="habit-progress">
                  <small>
                    Last completed: {new Date(habit.last_completed_at).toLocaleDateString()}
                  </small>
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
                  onClick={() => handleDeleteHabit(habit.id)}
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
    </div>
  );
};

export default HabitsTab;
