import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import TaskModal from './modals/TaskModal';

const TasksTab = ({ trainers, onRefresh }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/schedule/tasks', { params });
      setTasks(response.data.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.post(`/schedule/tasks/${taskId}/complete`);
      loadTasks();
      onRefresh();
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await api.delete(`/schedule/tasks/${taskId}`);
      loadTasks();
      onRefresh();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleEditTask = (task) => {
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

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  if (loading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadTasks} />;
  }

  return (
    <div className="tasks-tab">
      <div className="option-row">
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
          className={`button filter ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({tasks.length})
        </button>
        <button
          className={`button filter ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({tasks.filter(t => t.status === 'pending').length})
        </button>
        <button
          className={`button filter ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({tasks.filter(t => t.status === 'completed').length})
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="no-npcs">
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
            <div key={task.id} className="item-card">
              <div className="item-header">
                <h3 className="item-title">{task.title}</h3>
                <span className={`item-status${task.status}`}>
                  {task.status}
                </span>
              </div>

              {task.description && (
                <p className="item-description">{task.description}</p>
              )}

              <div className="item-meta">
                <span>Priority: {task.priority}</span>
                <span>Difficulty: {task.difficulty}</span>
                {task.due_date && (
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                )}
                {task.trainer_name && (
                  <span>Trainer: {task.trainer_name}</span>
                )}
                {task.reward_levels > 0 && (
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
                  onClick={() => handleDeleteTask(task.id)}
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
    </div>
  );
};

export default TasksTab;
