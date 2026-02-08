import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const TasksPage = () => {
  useDocumentTitle('Tasks');
  
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('daily');
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completeSuccess, setCompleteSuccess] = useState(false);
  const [completeError, setCompleteError] = useState(null);
  const [completeResults, setCompleteResults] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [dailyProgress, setDailyProgress] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch daily tasks
      const dailyResponse = await api.get('/tasks/daily');
      setDailyTasks(dailyResponse.data.tasks || []);
      
      // Fetch weekly tasks
      const weeklyResponse = await api.get('/tasks/weekly');
      setWeeklyTasks(weeklyResponse.data.tasks || []);
      
      // Fetch user's trainers
      const trainersResponse = await api.get('/trainers/user');
      setUserTrainers(trainersResponse.data.trainers || []);
      
      if (trainersResponse.data.trainers && trainersResponse.data.trainers.length > 0) {
        setSelectedTrainer(trainersResponse.data.trainers[0].id);
      }
      
      // Calculate progress
      calculateProgress(dailyResponse.data.tasks || [], weeklyResponse.data.tasks || []);
      
    } catch (err) {
      console.error('Error fetching tasks data:', err);
      setError('Failed to load tasks data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (daily, weekly) => {
    if (daily.length > 0) {
      const completedDaily = daily.filter(task => task.completed).length;
      setDailyProgress(Math.round((completedDaily / daily.length) * 100));
    }
    
    if (weekly.length > 0) {
      const completedWeekly = weekly.filter(task => task.completed).length;
      setWeeklyProgress(Math.round((completedWeekly / weekly.length) * 100));
    }
  };

  const handleCompleteClick = (task) => {
    setSelectedTask(task);
    setIsCompleteModalOpen(true);
    setCompleteError(null);
  };

  const handleCompleteTask = async () => {
    if (!selectedTrainer) {
      setCompleteError('Please select a trainer.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to complete task
      const response = await api.post(`/tasks/complete/${selectedTask.id}`, {
        trainer_id: selectedTrainer
      });
      
      setCompleteResults(response.data);
      setCompleteSuccess(true);
      
      // Refresh tasks
      const dailyResponse = await api.get('/tasks/daily');
      setDailyTasks(dailyResponse.data.tasks || []);
      
      const weeklyResponse = await api.get('/tasks/weekly');
      setWeeklyTasks(weeklyResponse.data.tasks || []);
      
      // Recalculate progress
      calculateProgress(dailyResponse.data.tasks || [], weeklyResponse.data.tasks || []);
      
    } catch (err) {
      console.error('Error completing task:', err);
      setCompleteError(err.response?.data?.message || 'Failed to complete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeCompleteModal = () => {
    setIsCompleteModalOpen(false);
    setSelectedTask(null);
    setCompleteSuccess(false);
    setCompleteError(null);
    setCompleteResults(null);
  };

  // Fallback data for development
  const fallbackDailyTasks = [
    {
      id: 1,
      title: 'Catch 5 Monsters',
      description: 'Catch 5 monsters of any type.',
      progress: 3,
      total: 5,
      completed: false,
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 100 },
        { type: 'exp', name: 'Experience', quantity: 50 }
      ]
    },
    {
      id: 2,
      title: 'Train a Monster',
      description: 'Train one of your monsters to increase its level.',
      progress: 1,
      total: 1,
      completed: true,
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 50 },
        { type: 'exp', name: 'Experience', quantity: 25 }
      ]
    },
    {
      id: 3,
      title: 'Visit the Shop',
      description: 'Visit the shop in Aurora Town.',
      progress: 0,
      total: 1,
      completed: false,
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 25 },
        { type: 'exp', name: 'Experience', quantity: 10 }
      ]
    }
  ];

  const fallbackWeeklyTasks = [
    {
      id: 4,
      title: 'Catch 20 Monsters',
      description: 'Catch 20 monsters of any type.',
      progress: 12,
      total: 20,
      completed: false,
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 500 },
        { type: 'exp', name: 'Experience', quantity: 200 },
        { type: 'item', name: 'Rare Candy', quantity: 1 }
      ]
    },
    {
      id: 5,
      title: 'Win 10 Battles',
      description: 'Win 10 battles against other trainers or wild monsters.',
      progress: 5,
      total: 10,
      completed: false,
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 300 },
        { type: 'exp', name: 'Experience', quantity: 150 },
        { type: 'item', name: 'Battle Token', quantity: 1 }
      ]
    },
    {
      id: 6,
      title: 'Evolve a Monster',
      description: 'Evolve one of your monsters to its next form.',
      progress: 0,
      total: 1,
      completed: false,
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 200 },
        { type: 'exp', name: 'Experience', quantity: 100 },
        { type: 'item', name: 'Evolution Stone', quantity: 1 }
      ]
    }
  ];

  const fallbackTrainers = [
    {
      id: 1,
      name: 'Ash Ketchum'
    },
    {
      id: 2,
      name: 'Misty'
    }
  ];

  const displayDailyTasks = dailyTasks.length > 0 ? dailyTasks : fallbackDailyTasks;
  const displayWeeklyTasks = weeklyTasks.length > 0 ? weeklyTasks : fallbackWeeklyTasks;
  const displayTrainers = userTrainers.length > 0 ? userTrainers : fallbackTrainers;

  if (loading && !isCompleteModalOpen) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="schedule-page">
      <div className="option-row">
        <h1>Tasks</h1>
        <p>Complete daily and weekly tasks to earn rewards</p>
      </div>

      <div className="tasks-progress">
        <div className="item-card">
          <div className="progress-header">
            <h2>Daily Tasks</h2>
            <span className="progress-percentage">{dailyProgress}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${dailyProgress}%` }}
            ></div>
          </div>
          <div className="progress-info">
            <span>Resets in: 12h 34m</span>
          </div>
        </div>
        
        <div className="item-card">
          <div className="progress-header">
            <h2>Weekly Tasks</h2>
            <span className="progress-percentage">{weeklyProgress}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${weeklyProgress}%` }}
            ></div>
          </div>
          <div className="progress-info">
            <span>Resets in: 3d 12h</span>
          </div>
        </div>
      </div>

      <div className="tasks-tabs">
        <button 
          className={`button tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          Daily Tasks
        </button>
        <button 
          className={`button tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly Tasks
        </button>
      </div>

      <div className="tasks-content">
        {activeTab === 'daily' ? (
          <div className="tasks-list">
            {displayDailyTasks.map((task) => (
              <div className={`task-card ${task.completed ? 'completed' : ''}`} key={task.id}>
                <div className="task-info">
                  <h3 className="task-title">{task.title}</h3>
                  <p className="task-description">{task.description}</p>
                  
                  <div className="task-progress">
                    <div className="task-progress-text">
                      <span>Progress:</span>
                      <span>{task.progress} / {task.total}</span>
                    </div>
                    <div className="task-progress-bar-container">
                      <div 
                        className="task-progress-bar"
                        style={{ width: `${(task.progress / task.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="task-rewards">
                    <span className="rewards-label">Rewards:</span>
                    <div className="rewards-list">
                      {task.rewards.map((reward, index) => (
                        <div className="reward-badge" key={index}>
                          <i className={`fas${
                            reward.type === 'coin' ? 'fa-coins' : 
                            reward.type === 'exp' ? 'fa-star' : 
                            'fa-box'
                          }`}></i>
                          <span>{reward.quantity} {reward.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="type-row">
                  {task.completed ? (
                    <button className="button secondary" disabled>
                      <i className="fas fa-check-circle"></i> Completed
                    </button>
                  ) : (
                    <button 
                      className="button primary"
                      onClick={() => handleCompleteClick(task)}
                      disabled={task.progress < task.total}
                    >
                      {task.progress >= task.total ? (
                        <>
                          <i className="fas fa-check"></i> Complete
                        </>
                      ) : (
                        <>
                          <i className="fas fa-hourglass-half"></i> In Progress
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tasks-list">
            {displayWeeklyTasks.map((task) => (
              <div className={`task-card ${task.completed ? 'completed' : ''}`} key={task.id}>
                <div className="task-info">
                  <h3 className="task-title">{task.title}</h3>
                  <p className="task-description">{task.description}</p>
                  
                  <div className="task-progress">
                    <div className="task-progress-text">
                      <span>Progress:</span>
                      <span>{task.progress} / {task.total}</span>
                    </div>
                    <div className="task-progress-bar-container">
                      <div 
                        className="task-progress-bar"
                        style={{ width: `${(task.progress / task.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="task-rewards">
                    <span className="rewards-label">Rewards:</span>
                    <div className="rewards-list">
                      {task.rewards.map((reward, index) => (
                        <div className="reward-badge" key={index}>
                          <i className={`fas${
                            reward.type === 'coin' ? 'fa-coins' : 
                            reward.type === 'exp' ? 'fa-star' : 
                            'fa-box'
                          }`}></i>
                          <span>{reward.quantity} {reward.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="type-row">
                  {task.completed ? (
                    <button className="button secondary" disabled>
                      <i className="fas fa-check-circle"></i> Completed
                    </button>
                  ) : (
                    <button 
                      className="button primary"
                      onClick={() => handleCompleteClick(task)}
                      disabled={task.progress < task.total}
                    >
                      {task.progress >= task.total ? (
                        <>
                          <i className="fas fa-check"></i> Complete
                        </>
                      ) : (
                        <>
                          <i className="fas fa-hourglass-half"></i> In Progress
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Task Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={closeCompleteModal}
        title={completeSuccess ? "Task Completed!" : "Complete Task"}
      >
        {completeSuccess ? (
          <div className="complete-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              You have successfully completed the task: {selectedTask?.title}!
              Here are your rewards:
            </p>
            
            <div className="complete-rewards">
              {completeResults?.rewards.map((reward, index) => (
                <div className="reward-item" key={index}>
                  <div className="reward-icon">
                    <i className={`fas${
                      reward.type === 'coin' ? 'fa-coins' : 
                      reward.type === 'exp' ? 'fa-star' : 
                      'fa-box'
                    }`}></i>
                  </div>
                  <div className="reward-info">
                    <div className="reward-name">{reward.name}</div>
                    <div className="reward-description">{reward.quantity} {reward.type}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="button primary"
              onClick={closeCompleteModal}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {selectedTask && (
              <div className="form">
                <div className="task-preview">
                  <h3>{selectedTask.title}</h3>
                  <p>{selectedTask.description}</p>
                  
                  <div className="task-preview-rewards">
                    <div className="rewards-label">Rewards:</div>
                    <div className="rewards-list">
                      {selectedTask.rewards.map((reward, index) => (
                        <div className="reward-badge" key={index}>
                          <i className={`fas${
                            reward.type === 'coin' ? 'fa-coins' : 
                            reward.type === 'exp' ? 'fa-star' : 
                            'fa-box'
                          }`}></i>
                          <span>{reward.quantity} {reward.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="missions-filters">
                  <label>Select Trainer:</label>
                  <select
                    value={selectedTrainer}
                    onChange={(e) => setSelectedTrainer(e.target.value)}
                  >
                    <option value="">Select a trainer</option>
                    {displayTrainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {completeError && (
                  <div className="complete-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{completeError}</span>
                  </div>
                )}
                
                <div className="complete-actions">
                  <button 
                    className="button secondary"
                    onClick={closeCompleteModal}
                  >
                    Cancel
                  </button>
                  <button 
                    className="button primary"
                    onClick={handleCompleteTask}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </>
                    ) : (
                      'Complete Task'
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default TasksPage;
