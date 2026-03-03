import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useAuth } from '@contexts/useAuth';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorMessage } from '../../common/ErrorMessage';
import { ConfirmModal } from '../../common/ConfirmModal';
import { TaskModal } from '../modals/TaskModal';
import { Task, Trainer, capitalize } from '../types';

interface TasksTabProps {
  trainers: Trainer[];
  onRefresh: () => void;
}

export const TasksTab = ({ trainers, onRefresh }: TasksTabProps) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.is_admin ?? false;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/schedule/tasks');
      setTasks(response.data.data);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.post(`/schedule/tasks/${taskId}/complete`);
      loadTasks();
      onRefresh();
    } catch (err) {
      console.error('Error completing task:', err);
      alert('Failed to complete task');
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteConfirm) return;

    try {
      await api.delete(`/schedule/tasks/${deleteConfirm.id}`);
      loadTasks();
      onRefresh();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  const handleDeleteAllCompleted = async () => {
    const completed = tasks.filter(t => t.status === 'completed');
    try {
      await Promise.all(completed.map(t => api.delete(`/schedule/tasks/${t.id}`)));
      loadTasks();
      onRefresh();
      setDeleteAllConfirm(false);
    } catch (err) {
      console.error('Error deleting completed tasks:', err);
      alert('Failed to delete some completed tasks');
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleModalSuccess = () => {
    loadTasks();
    onRefresh();
    setShowCreateForm(false);
    setEditingTask(null);
  };

  const handleModalClose = () => {
    setShowCreateForm(false);
    setEditingTask(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadTasks} />;
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="schedule-tab">
      <div className="schedule-tab__header">
        <h2>Tasks</h2>
        <button
          className="button primary"
          onClick={() => setShowCreateForm(true)}
        >
          <i className="fas fa-plus"></i>
          Create Task
        </button>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="schedule-empty">
          <i className="fas fa-tasks"></i>
          <h3>No tasks found</h3>
          <p>You haven't created any tasks yet. Create your first task to get started!</p>
          <button
            className="button primary"
            onClick={() => setShowCreateForm(true)}
          >
            <i className="fas fa-plus"></i>
            Create Your First Task
          </button>
        </div>
      ) : (
        <>
          {pendingTasks.length === 0 ? (
            <div className="schedule-empty" style={{ padding: 'var(--spacing-medium)' }}>
              <i className="fas fa-check-circle"></i>
              <h3>All caught up!</h3>
              <p>No pending tasks. Create a new task or check your completed ones below.</p>
            </div>
          ) : (
            <div className="item-list">
              {pendingTasks.map(task => (
                <div key={task.id} className="item-card item-card--pending">
                  <div className="item-card__header">
                    <h3 className="item-card__title">{task.title}</h3>
                    <span className="item-status item-status--pending">pending</span>
                  </div>

                  {task.description && (
                    <p className="schedule-item-description">{task.description}</p>
                  )}

                  <div className="item-meta">
                    <span>Priority: {capitalize(task.priority)}</span>
                    <span>Difficulty: {capitalize(task.difficulty)}</span>
                    {task.due_date && (
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    )}
                    {task.trainer_name && (
                      <span>Trainer: {task.trainer_name}</span>
                    )}
                    {(task.reward_levels > 0 || task.reward_coins > 0) && (
                      <span>Reward: {task.reward_levels} levels, {task.reward_coins} coins</span>
                    )}
                  </div>

                  {task.steps && task.steps.length > 0 && (
                    <div className="task-steps">
                      <h4>Steps ({task.current_step || 0}/{task.steps.length})</h4>
                      <ul>
                        {task.steps.map((step, index) => (
                          <li
                            key={index}
                            className={index < (task.current_step || 0) ? 'completed' : ''}
                          >
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="item-actions">
                    <button
                      className="button primary sm"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      <i className="fas fa-check"></i>
                      Complete
                    </button>
                    <button
                      className="button secondary sm"
                      onClick={() => handleEditTask(task)}
                    >
                      <i className="fas fa-edit"></i>
                      Edit
                    </button>
                    <button
                      className="button danger sm"
                      onClick={() => setDeleteConfirm(task)}
                    >
                      <i className="fas fa-trash"></i>
                      Delete
                    </button>
                    {isAdmin && (
                      <button
                        className="button secondary sm"
                        onClick={() => handleRemindNow('task', task.id)}
                        title="Send a test reminder DM to yourself"
                      >
                        <i className="fas fa-bell"></i>
                        Remind Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="completed-tasks-section">
              <div className="completed-tasks-header">
                <button
                  className="completed-tasks-toggle"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  <i className={`fas fa-chevron-${showCompleted ? 'down' : 'right'}`}></i>
                  <span>Completed ({completedTasks.length})</span>
                </button>
                {showCompleted && (
                  <button
                    className="button danger sm no-flex"
                    onClick={() => setDeleteAllConfirm(true)}
                  >
                    <i className="fas fa-trash"></i>
                    Delete All
                  </button>
                )}
              </div>

              {showCompleted && (
                <div className="completed-tasks-list">
                  {completedTasks.map(task => (
                    <div key={task.id} className="completed-task-row">
                      <div className="completed-task-row__info">
                        <i className="fas fa-check-circle completed-task-row__icon"></i>
                        <span className="completed-task-row__title">{task.title}</span>
                        {task.completed_at && (
                          <span className="completed-task-row__date">
                            {new Date(task.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="completed-task-row__actions">
                        <button
                          className="button secondary sm"
                          onClick={() => handleEditTask(task)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="button danger sm"
                          onClick={() => setDeleteConfirm(task)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={showCreateForm || editingTask !== null}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        trainers={trainers}
        task={editingTask}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"?`}
        warning="This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        confirmIcon="fas fa-trash"
      />

      {/* Delete All Completed Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteAllConfirm}
        onClose={() => setDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllCompleted}
        title="Delete All Completed Tasks"
        message={`Are you sure you want to delete all ${completedTasks.length} completed task${completedTasks.length !== 1 ? 's' : ''}?`}
        warning="This action cannot be undone."
        confirmText="Delete All"
        variant="danger"
        confirmIcon="fas fa-trash"
      />
    </div>
  );
};

export default TasksTab;
