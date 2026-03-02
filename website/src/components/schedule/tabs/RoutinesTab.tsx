import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '@contexts/useAuth';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorMessage } from '../../common/ErrorMessage';
import { ConfirmModal } from '../../common/ConfirmModal';
import { RoutineModal } from '../modals/RoutineModal';
import { Routine, Trainer, capitalize } from '../types';

interface RoutinesTabProps {
  trainers: Trainer[];
  onRefresh: () => void;
}

type ViewType = 'today' | 'all';

export const RoutinesTab = ({ trainers, onRefresh }: RoutinesTabProps) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.is_admin ?? false;
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [todaysRoutines, setTodaysRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('today');
  const [deleteConfirm, setDeleteConfirm] = useState<Routine | null>(null);

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
    } catch (err) {
      console.error('Error loading routines:', err);
      setError('Failed to load routines');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysRoutines = async () => {
    try {
      const response = await api.get('/schedule/routines/today');
      setTodaysRoutines(response.data.data);
    } catch (err) {
      console.error("Error loading today's routines:", err);
    }
  };

  const handleCompleteRoutineItem = async (itemId: number) => {
    // Optimistic update - mark item as completed immediately
    setTodaysRoutines(prev =>
      prev.map(routine => ({
        ...routine,
        items: routine.items?.map(item =>
          item.id === itemId ? { ...item, completedToday: true } : item
        ),
      }))
    );

    try {
      await api.post(`/schedule/routines/items/${itemId}/complete`);
      onRefresh();
    } catch (err) {
      console.error('Error completing routine item:', err);
      // Revert optimistic update on failure
      setTodaysRoutines(prev =>
        prev.map(routine => ({
          ...routine,
          items: routine.items?.map(item =>
            item.id === itemId ? { ...item, completedToday: false } : item
          ),
        }))
      );
      alert('Failed to complete routine item');
    }
  };

  const handleDeleteRoutine = async () => {
    if (!deleteConfirm) return;

    try {
      await api.delete(`/schedule/routines/${deleteConfirm.id}`);
      loadRoutines();
      onRefresh();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting routine:', err);
      alert('Failed to delete routine');
    }
  };

  const handleRemindNow = async (type: string, id: number) => {
    try {
      await api.post(`/schedule/admin/remind-now/${type}/${id}`);
      alert('Reminder sent!');
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert('Failed to send reminder');
    }
  };

  const handleEditRoutine = (routine: Routine) => {
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

  const calculateCompletionRate = (routine: Routine): number => {
    if (!routine.items || routine.items.length === 0) return 0;
    const completed = routine.items.filter(item => item.completedToday).length;
    return Math.round((completed / routine.items.length) * 100);
  };

  if (loading) {
    return <LoadingSpinner message="Loading routines..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadRoutines} />;
  }

  return (
    <div className="schedule-tab">
      <div className="schedule-tab__header">
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
          className={`filter-button ${activeView === 'today' ? 'active' : ''}`}
          onClick={() => setActiveView('today')}
        >
          Today's Routines ({todaysRoutines.length})
        </button>
        <button
          className={`filter-button ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => setActiveView('all')}
        >
          All Routines ({routines.length})
        </button>
      </div>

      {activeView === 'today' ? (
        // Today's Routines View
        todaysRoutines.length === 0 ? (
          <div className="schedule-empty">
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
              <div key={routine.id} className="item-card item-card--active">
                <div className="item-card__header">
                  <h3 className="item-card__title">{routine.name}</h3>
                  <span className="completion-badge">
                    {calculateCompletionRate(routine)}% complete
                  </span>
                </div>

                {routine.description && (
                  <p className="schedule-item-description">{routine.description}</p>
                )}

                <div className="routine-items">
                  <h4>
                    Items ({routine.items?.filter(i => i.completedToday).length || 0}/{routine.items?.length || 0})
                  </h4>
                  {routine.items && routine.items.length > 0 ? (
                    <ul className="routine-item-list">
                      {routine.items.map(item => (
                        <li
                          key={item.id}
                          className={`routine-item ${item.completedToday ? 'completed' : ''}`}
                        >
                          <div className="routine-item__content">
                            <span className="routine-item__title">{item.title}</span>
                            {item.scheduledTime && (
                              <span className="routine-item__time">{item.scheduledTime}</span>
                            )}
                          </div>
                          <div className="routine-item__actions">
                            {!item.completedToday && (
                              <button
                                className="routine-item__complete"
                                onClick={() => handleCompleteRoutineItem(item.id!)}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                className="routine-item__complete"
                                onClick={() => handleRemindNow('routine_item', item.id!)}
                                title="Send a test reminder DM"
                              >
                                <i className="fas fa-bell"></i>
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="schedule-item-description">No items in this routine</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // All Routines View
        routines.length === 0 ? (
          <div className="schedule-empty">
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
              <div
                key={routine.id}
                className={`item-card ${routine.isActive ? 'item-card--active' : 'item-card--inactive'}`}
              >
                <div className="item-card__header">
                  <h3 className="item-card__title">{routine.name}</h3>
                  <span className={`item-status ${routine.isActive ? 'item-status--active' : 'item-status--inactive'}`}>
                    {routine.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {routine.description && (
                  <p className="schedule-item-description">{routine.description}</p>
                )}

                <div className="item-meta">
                  <span>Pattern: {capitalize(routine.patternType)}</span>
                  <span>Items: {routine.items?.length || 0}</span>
                  {routine.patternDays && routine.patternDays.length > 0 && (
                    <span>Days: {routine.patternDays.map(capitalize).join(', ')}</span>
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
                    onClick={() => setDeleteConfirm(routine)}
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                  {isAdmin && routine.items && routine.items.length > 0 && (
                    <button
                      className="button secondary sm"
                      onClick={() => handleRemindNow('routine_item', routine.items![0]!.id!)}
                      title="Send a test reminder DM for the first routine item"
                    >
                      <i className="fas fa-bell"></i>
                      Remind Now
                    </button>
                  )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteRoutine}
        title="Delete Routine"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"?`}
        warning="This will also delete all routine items. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        confirmIcon="fas fa-trash"
      />
    </div>
  );
};

export default RoutinesTab;
