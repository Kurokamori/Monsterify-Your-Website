import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import RoutineModal from './modals/RoutineModal';

const RoutinesTab = ({ trainers, onRefresh }) => {
  const [routines, setRoutines] = useState([]);
  const [todaysRoutines, setTodaysRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [activeView, setActiveView] = useState('today');

  useEffect(() => {
    loadRoutines();
    loadTodaysRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/schedule/routines');
      setRoutines(response.data.data);
    } catch (error) {
      console.error('Error loading routines:', error);
      setError('Failed to load routines');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysRoutines = async () => {
    try {
      const response = await api.get('/schedule/routines/today');
      setTodaysRoutines(response.data.data);
    } catch (error) {
      console.error('Error loading today\'s routines:', error);
    }
  };

  const handleCompleteRoutineItem = async (itemId) => {
    try {
      await api.post(`/schedule/routines/items/${itemId}/complete`);
      loadTodaysRoutines();
      onRefresh();
    } catch (error) {
      console.error('Error completing routine item:', error);
      alert('Failed to complete routine item');
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    if (!window.confirm('Are you sure you want to delete this routine?')) {
      return;
    }

    try {
      await api.delete(`/schedule/routines/${routineId}`);
      loadRoutines();
      onRefresh();
    } catch (error) {
      console.error('Error deleting routine:', error);
      alert('Failed to delete routine');
    }
  };

  const handleEditRoutine = (routine) => {
    setEditingRoutine(routine);
  };

  const handleModalSuccess = () => {
    loadRoutines();
    loadTodaysRoutines();
    onRefresh();
    setShowCreateForm(false);
    setEditingRoutine(null);
  };

  const handleModalClose = () => {
    setShowCreateForm(false);
    setEditingRoutine(null);
  };

  const calculateCompletionRate = (routine) => {
    if (!routine.items || routine.items.length === 0) return 0;
    const completed = routine.items.filter(item => item.completed_today).length;
    return Math.round((completed / routine.items.length) * 100);
  };

  if (loading) {
    return <LoadingSpinner message="Loading routines..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadRoutines} />;
  }

  return (
    <div className="routines-tab">
      <div className="tab-header">
        <h2>Daily Routines</h2>
        <button
          className="button primary"
          onClick={() => setShowCreateForm(true)}
        >
          <i className="fas fa-plus"></i>
          Create Routine
        </button>
      </div>

      <div className="tab-filters">
        <button
          className={`button filter ${activeView === 'today' ? 'active' : ''}`}
          onClick={() => setActiveView('today')}
        >
          Today's Routines ({todaysRoutines.length})
        </button>
        <button
          className={`button filter ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => setActiveView('all')}
        >
          All Routines ({routines.length})
        </button>
      </div>

      {activeView === 'today' ? (
        // Today's Routines View
        todaysRoutines.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-day"></i>
            <h3>No routines for today</h3>
            <p>You don't have any active routines scheduled for today.</p>
            <button
              className="button primary"
              onClick={() => setShowCreateForm(true)}
            >
              <i className="fas fa-plus"></i>
              Create Your First Routine
            </button>
          </div>
        ) : (
          <div className="item-list">
            {todaysRoutines.map(routine => (
              <div key={routine.id} className="item-card">
                <div className="item-header">
                  <h3 className="item-title">{routine.name}</h3>
                  <span className="completion-badge">
                    {calculateCompletionRate(routine)}% complete
                  </span>
                </div>

                {routine.description && (
                  <p className="item-description">{routine.description}</p>
                )}

                <div className="routine-items">
                  <h4>Items ({routine.items?.filter(i => i.completed_today).length || 0}/{routine.items?.length || 0})</h4>
                  {routine.items && routine.items.length > 0 ? (
                    <ul className="routine-item-list">
                      {routine.items.map(item => (
                        <li
                          key={item.id}
                          className={`routine-item ${item.completed_today ? 'completed' : ''}`}
                        >
                          <div className="routine-item-content">
                            <span className="routine-item-title">{item.title}</span>
                            {item.scheduled_time && (
                              <span className="routine-item-time">{item.scheduled_time}</span>
                            )}
                          </div>
                          {!item.completed_today && (
                            <button
                              className="routine-item-complete"
                              onClick={() => handleCompleteRoutineItem(item.id)}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">No items in this routine</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // All Routines View
        routines.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-alt"></i>
            <h3>No routines found</h3>
            <p>You haven't created any routines yet. Create your first routine to organize your daily activities!</p>
            <button
              className="button primary"
              onClick={() => setShowCreateForm(true)}
            >
              <i className="fas fa-plus"></i>
              Create Your First Routine
            </button>
          </div>
        ) : (
          <div className="item-list">
            {routines.map(routine => (
              <div key={routine.id} className="item-card">
                <div className="item-header">
                  <h3 className="item-title">{routine.name}</h3>
                  <span className={`item-status ${routine.is_active ? 'active' : 'inactive'}`}>
                    {routine.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {routine.description && (
                  <p className="item-description">{routine.description}</p>
                )}

                <div className="item-meta">
                  <span>Pattern: {routine.pattern_type}</span>
                  <span>Items: {routine.items?.length || 0}</span>
                  {routine.pattern_days && routine.pattern_days.length > 0 && (
                    <span>Days: {routine.pattern_days.join(', ')}</span>
                  )}
                </div>

                <div className="item-actions">
                  <button
                    className="button secondary sm"
                    onClick={() => handleEditRoutine(routine)}
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  <button
                    className="button danger sm"
                    onClick={() => handleDeleteRoutine(routine.id)}
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Routine Modal */}
      <RoutineModal
        isOpen={showCreateForm || editingRoutine !== null}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        trainers={trainers}
        routine={editingRoutine}
      />
    </div>
  );
};

export default RoutinesTab;
