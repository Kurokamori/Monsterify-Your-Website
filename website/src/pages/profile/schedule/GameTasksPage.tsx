import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import gameTaskService from '../../../services/gameTaskService';
import type { GameTask } from '../../../services/gameTaskService';
import trainerService from '../../../services/trainerService';
import { TaskCard } from './TaskCard';
import { CompleteTaskModal } from './CompleteTaskModal';
import type { TaskTab } from './types';
import { calculateProgress } from './types';

interface TrainerOption {
  id: number;
  name: string;
}

const GameTasksPage = () => {
  useDocumentTitle('Tasks');

  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyTasks, setDailyTasks] = useState<GameTask[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<GameTask[]>([]);
  const [activeTab, setActiveTab] = useState<TaskTab>('daily');
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [selectedTask, setSelectedTask] = useState<GameTask | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const [dailyResult, weeklyResult, trainersResult] = await Promise.allSettled([
        gameTaskService.getDailyTasks(),
        gameTaskService.getWeeklyTasks(),
        trainerService.getUserTrainers(currentUser.discord_id),
      ]);

      if (dailyResult.status === 'fulfilled') setDailyTasks(dailyResult.value);
      if (weeklyResult.status === 'fulfilled') setWeeklyTasks(weeklyResult.value);
      if (trainersResult.status === 'fulfilled') {
        const trainerData = trainersResult.value.trainers || [];
        setTrainers(trainerData.map((t) => ({ id: t.id, name: t.name })));
      }

      if (dailyResult.status === 'rejected' && weeklyResult.status === 'rejected') {
        setError('Failed to load tasks. Please try again later.');
      }
    } catch {
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Background refresh after task completion (no loading spinner)
  const refreshTasks = useCallback(async () => {
    try {
      const [dailyResult, weeklyResult] = await Promise.allSettled([
        gameTaskService.getDailyTasks(),
        gameTaskService.getWeeklyTasks(),
      ]);
      if (dailyResult.status === 'fulfilled') setDailyTasks(dailyResult.value);
      if (weeklyResult.status === 'fulfilled') setWeeklyTasks(weeklyResult.value);
    } catch {
      // Silent refresh - user can manually retry if needed
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dailyProgress = calculateProgress(dailyTasks);
  const weeklyProgress = calculateProgress(weeklyTasks);
  const activeTasks = activeTab === 'daily' ? dailyTasks : weeklyTasks;
  const isEmpty = dailyTasks.length === 0 && weeklyTasks.length === 0;

  return (
    <div className="game-tasks">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        onRetry={fetchData}
        loadingMessage="Loading tasks..."
        emptyMessage="No tasks available right now. Check back later!"
        emptyIcon="fas fa-clipboard-check"
      >
        <div className="game-tasks__header">
          <h1>Tasks</h1>
          <p>Complete daily and weekly tasks to earn rewards</p>
        </div>

        <div className="game-tasks__progress">
          <div className="game-tasks__progress-card">
            <div className="game-tasks__progress-header">
              <h2>Daily Tasks</h2>
              <span className="game-tasks__progress-percent">{dailyProgress}%</span>
            </div>
            <div className="progress">
              <div
                className={`progress-fill ${dailyProgress === 100 ? 'success' : 'primary'}`}
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
          </div>

          <div className="game-tasks__progress-card">
            <div className="game-tasks__progress-header">
              <h2>Weekly Tasks</h2>
              <span className="game-tasks__progress-percent">{weeklyProgress}%</span>
            </div>
            <div className="progress">
              <div
                className={`progress-fill ${weeklyProgress === 100 ? 'success' : 'primary'}`}
                style={{ width: `${weeklyProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="game-tasks__tabs">
          <button
            className={`button tab${activeTab === 'daily' ? ' active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            Daily Tasks
          </button>
          <button
            className={`button tab${activeTab === 'weekly' ? ' active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            Weekly Tasks
          </button>
        </div>

        <div className="game-tasks__list">
          {activeTasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={setSelectedTask} />
          ))}
          {activeTasks.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-clipboard-check" />
              <h3>No {activeTab} tasks</h3>
              <p>Check back later for new tasks!</p>
            </div>
          )}
        </div>

        <CompleteTaskModal
          task={selectedTask}
          trainers={trainers}
          onClose={() => setSelectedTask(null)}
          onCompleted={refreshTasks}
        />
      </AutoStateContainer>
    </div>
  );
};

export default GameTasksPage;
