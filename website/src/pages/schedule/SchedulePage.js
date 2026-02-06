import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import TasksTab from '../../components/schedule/TasksTab';
import HabitsTab from '../../components/schedule/HabitsTab';
import RoutinesTab from '../../components/schedule/RoutinesTab';
import DashboardTab from '../../components/schedule/DashboardTab';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SchedulePage = () => {
  useDocumentTitle('Schedule');
  
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/schedule/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
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
      <div className="schedule-header">
        <h1>Manage Schedule</h1>
        <p>Organize your tasks, track habits, and manage daily routines with optional Discord reminders and in-game rewards</p>
      </div>

      <div className="schedule-tabs">
        <button
          className={`button tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          <i className="fas fa-tachometer-alt"></i>
          Dashboard
        </button>
        <button
          className={`button tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => handleTabChange('tasks')}
        >
          <i className="fas fa-tasks"></i>
          Tasks
        </button>
        <button
          className={`button tab ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => handleTabChange('habits')}
        >
          <i className="fas fa-chart-line"></i>
          Habits
        </button>
        <button
          className={`button tab ${activeTab === 'routines' ? 'active' : ''}`}
          onClick={() => handleTabChange('routines')}
        >
          <i className="fas fa-calendar-day"></i>
          Routines
        </button>
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
