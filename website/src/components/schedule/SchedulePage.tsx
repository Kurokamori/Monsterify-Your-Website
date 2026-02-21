import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { TasksTab } from './tabs/TasksTab';
import { HabitsTab } from './tabs/HabitsTab';
import { RoutinesTab } from './tabs/RoutinesTab';
import { DashboardTab } from './tabs/DashboardTab';
import { DashboardData } from './types';

type TabType = 'dashboard' | 'tasks' | 'habits' | 'routines';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { id: 'tasks', label: 'Tasks', icon: 'fas fa-tasks' },
  { id: 'habits', label: 'Habits', icon: 'fas fa-chart-line' },
  { id: 'routines', label: 'Routines', icon: 'fas fa-calendar-day' }
];

export const SchedulePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/schedule/dashboard');
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return <LoadingSpinner message="Loading schedule..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="schedule-page">
      <div className="schedule-page__header">
        <h1>Manage Schedule</h1>
        <p>Organize your tasks, track habits, and manage daily routines with optional Discord reminders and in-game rewards</p>
      </div>

      <div className="schedule-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <i className={tab.icon}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="schedule-content">
        {activeTab === 'dashboard' && (
          <DashboardTab
            data={dashboardData}
            onRefresh={refreshData}
            onTabChange={handleTabChange}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            trainers={dashboardData?.trainers || []}
            onRefresh={refreshData}
          />
        )}
        {activeTab === 'habits' && (
          <HabitsTab
            trainers={dashboardData?.trainers || []}
            onRefresh={refreshData}
          />
        )}
        {activeTab === 'routines' && (
          <RoutinesTab
            trainers={dashboardData?.trainers || []}
            onRefresh={refreshData}
          />
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
