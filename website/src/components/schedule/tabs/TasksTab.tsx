import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorMessage } from '../../common/ErrorMessage';
import { ConfirmModal } from '../../common/ConfirmModal';
import { TaskModal } from '../modals/TaskModal';
import { Task, Trainer, TaskStatus, capitalize } from '../types';

interface TasksTabProps {
  trainers: Trainer[];
  onRefresh: () => void;
}

type FilterType = 'all' | TaskStatus;

export const TasksTab = ({ trainers, onRefresh }: TasksTabProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { status?: string } = {};
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/schedule/tasks', { params });
      setTasks(response.data.data);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

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

  const getFilteredTasks = (): Task[] => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => task.status === filter);
  };

  const getTaskCount = (status?: TaskStatus): number => {
    if (!status) return tasks.length;
    return tasks.filter(task => task.status === status).length;
  };

  if (loading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadTasks} />;
  }

  const filteredTasks = getFilteredTasks();

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

      <div className="tab-filters">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({getTaskCount()})
        </button>
        <button
          className={`filter-button ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({getTaskCount('pending')})
        </button>
        <button
          className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({getTaskCount('completed')})
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="schedule-empty">
          <i className="fas fa-tasks"></i>
          <h3>No tasks found</h3>
          <p>
            {filter === 'all'
              ? "You haven't created any tasks yet. Create your first task to get started!"
              : `No ${filter} tasks found.`
            }
          </p>
          <button
            className="button primary"
            onClick={() => setShowCreateForm(true)}
          >
            <i className="fas fa-plus"></i>
            Create Your First Task
          </button>
        </div>
      ) : (
        <div className="item-list">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`item-card item-card--${task.status}`}
            >
              <div className="item-card__header">
                <h3 className="item-card__title">{task.title}</h3>
                <span className={`item-status item-status--${task.status}`}>
                  {task.status}
                </span>
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
                {task.status === 'pending' && (
                  <button
                    className="button primary sm"
                    onClick={() => handleCompleteTask(task.id)}
                  >
                    <i className="fas fa-check"></i>
                    Complete
                  </button>
                )}
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
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
};

export default TasksTab;
