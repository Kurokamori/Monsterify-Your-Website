import { DashboardData, capitalize } from '../types';

type TabType = 'dashboard' | 'tasks' | 'habits' | 'routines';

interface DashboardTabProps {
  data: DashboardData | null;
  onRefresh: () => void;
  onTabChange: (tab: TabType) => void;
}

export const DashboardTab = ({ data, onRefresh, onTabChange }: DashboardTabProps) => {
  if (!data) {
    return (
      <div className="schedule-empty">
        <i className="fas fa-chart-line"></i>
        <h3>Loading Dashboard...</h3>
        <p>Please wait while we load your schedule data.</p>
      </div>
    );
  }

  const {
    trainers = [],
    tasks = { pending: [], due: [] },
    habits = [],
    routines = [],
    reminders = { total: 0, active: 0, by_type: {} }
  } = data;

  const totalPendingTasks = tasks.pending.length;
  const totalDueTasks = tasks.due.length;
  const totalActiveHabits = habits.filter(h => h.status === 'active').length;
  const totalActiveRoutines = routines.filter(r => r.is_active).length;

  // Calculate habit streak stats
  const habitStreaks = habits.map(h => h.streak || 0);
  const bestStreak = Math.max(...habitStreaks, 0);
  const totalStreakDays = habitStreaks.reduce((sum, streak) => sum + streak, 0);

  // Calculate completion stats for today's routines
  const todaysRoutineItems = routines.flatMap(r => r.items || []);
  const completedRoutineItems = todaysRoutineItems.filter(item => item.completed_today).length;
  const totalRoutineItems = todaysRoutineItems.length;

  return (
    <div className="dashboard-tab">
      <div className="dashboard-header">
        <h2>Schedule Dashboard</h2>
        <button className="button primary" onClick={onRefresh}>
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      <div className="dashboard-stats">
        {/* Tasks Overview */}
        <div className="dashboard-stat-card">
          <h3>
            <i className="fas fa-tasks"></i>
            Tasks
          </h3>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Pending Tasks</span>
            <span className="dashboard-stat__value">{totalPendingTasks}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Due Today</span>
            <span className="dashboard-stat__value">{totalDueTasks}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Total Trainers</span>
            <span className="dashboard-stat__value">{trainers.length}</span>
          </div>
        </div>

        {/* Habits Overview */}
        <div className="dashboard-stat-card">
          <h3>
            <i className="fas fa-chart-line"></i>
            Habits
          </h3>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active Habits</span>
            <span className="dashboard-stat__value">{totalActiveHabits}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Best Streak</span>
            <span className="dashboard-stat__value">{bestStreak} days</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Total Streak Days</span>
            <span className="dashboard-stat__value">{totalStreakDays}</span>
          </div>
        </div>

        {/* Routines Overview */}
        <div className="dashboard-stat-card">
          <h3>
            <i className="fas fa-calendar-day"></i>
            Daily Routines
          </h3>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active Routines</span>
            <span className="dashboard-stat__value">{totalActiveRoutines}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Today's Progress</span>
            <span className="dashboard-stat__value">
              {completedRoutineItems}/{totalRoutineItems}
            </span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Completion Rate</span>
            <span className="dashboard-stat__value">
              {totalRoutineItems > 0 ? Math.round((completedRoutineItems / totalRoutineItems) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Reminders Overview */}
        <div className="dashboard-stat-card">
          <h3>
            <i className="fas fa-bell"></i>
            Reminders
          </h3>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active Reminders</span>
            <span className="dashboard-stat__value">{reminders.active}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Task Reminders</span>
            <span className="dashboard-stat__value">{reminders.by_type?.task || 0}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Habit Reminders</span>
            <span className="dashboard-stat__value">{reminders.by_type?.habit || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>

        {/* Due Tasks */}
        {totalDueTasks > 0 && (
          <div className="activity-section">
            <h4>
              <i className="fas fa-exclamation-triangle"></i>
              Tasks Due Today ({totalDueTasks})
            </h4>
            <div className="item-list">
              {tasks.due.slice(0, 3).map(task => (
                <div key={task.id} className="item-card item-card--pending">
                  <div className="item-card__header">
                    <h3 className="item-card__title">{task.title}</h3>
                    <span className="item-status item-status--due">Due</span>
                  </div>
                  {task.description && (
                    <p className="schedule-item-description">{task.description}</p>
                  )}
                  <div className="item-meta">
                    <span>Priority: {capitalize(task.priority)}</span>
                    <span>Difficulty: {capitalize(task.difficulty)}</span>
                    {task.trainer_name && <span>Trainer: {task.trainer_name}</span>}
                  </div>
                </div>
              ))}
            </div>
            {totalDueTasks > 3 && (
              <button
                className="button secondary"
                onClick={() => onTabChange('tasks')}
              >
                View All Due Tasks
              </button>
            )}
          </div>
        )}

        {/* Active Habits */}
        {totalActiveHabits > 0 && (
          <div className="activity-section">
            <h4>
              <i className="fas fa-fire"></i>
              Active Habits ({totalActiveHabits})
            </h4>
            <div className="item-list">
              {habits.filter(h => h.status === 'active').slice(0, 3).map(habit => (
                <div key={habit.id} className="item-card item-card--active">
                  <div className="item-card__header">
                    <h3 className="item-card__title">{habit.title}</h3>
                    <span className="item-status item-status--active">
                      {habit.streak || 0} day streak
                    </span>
                  </div>
                  {habit.description && (
                    <p className="schedule-item-description">{habit.description}</p>
                  )}
                  <div className="item-meta">
                    <span>Frequency: {capitalize(habit.frequency)}</span>
                    <span>Status: {capitalize(habit.streak_status)}</span>
                    {habit.trainer_name && <span>Trainer: {habit.trainer_name}</span>}
                  </div>
                </div>
              ))}
            </div>
            {totalActiveHabits > 3 && (
              <button
                className="button secondary"
                onClick={() => onTabChange('habits')}
              >
                View All Habits
              </button>
            )}
          </div>
        )}

        {/* Today's Routines */}
        {totalRoutineItems > 0 && (
          <div className="activity-section">
            <h4>
              <i className="fas fa-calendar-check"></i>
              Today's Routines ({completedRoutineItems}/{totalRoutineItems} completed)
            </h4>
            <div className="item-list">
              {routines.slice(0, 2).map(routine => (
                <div key={routine.id} className="item-card item-card--active">
                  <div className="item-card__header">
                    <h3 className="item-card__title">{routine.name}</h3>
                    <span className="item-status item-status--active">
                      {routine.items?.filter(i => i.completed_today).length || 0}/
                      {routine.items?.length || 0} completed
                    </span>
                  </div>
                  {routine.description && (
                    <p className="schedule-item-description">{routine.description}</p>
                  )}
                  <div className="item-meta">
                    <span>Pattern: {capitalize(routine.pattern_type)}</span>
                    <span>Items: {routine.items?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
            {routines.length > 2 && (
              <button
                className="button secondary"
                onClick={() => onTabChange('routines')}
              >
                View All Routines
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="schedule-quick-actions">
        <button
          className="button primary"
          onClick={() => onTabChange('tasks')}
        >
          <i className="fas fa-plus"></i>
          Create Task
        </button>
        <button
          className="button primary"
          onClick={() => onTabChange('habits')}
        >
          <i className="fas fa-plus"></i>
          Create Habit
        </button>
        <button
          className="button primary"
          onClick={() => onTabChange('routines')}
        >
          <i className="fas fa-plus"></i>
          Create Routine
        </button>
      </div>
    </div>
  );
};

export default DashboardTab;
