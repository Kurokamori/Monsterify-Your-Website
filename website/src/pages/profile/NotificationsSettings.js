import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const NotificationsSettings = () => {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notifications, setNotifications] = useState({
    email: {
      events: false,
      missions: false,
      battles: false,
      achievements: false,
      system: false
    },
    push: {
      events: false,
      missions: false,
      battles: false,
      achievements: false,
      system: false
    }
  });

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch notification settings
      const response = await api.get('/user/notifications');
      setNotifications(response.data.notifications || {
        email: {
          events: false,
          missions: false,
          battles: false,
          achievements: false,
          system: false
        },
        push: {
          events: false,
          missions: false,
          battles: false,
          achievements: false,
          system: false
        }
      });
      
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setError('Failed to load notification settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (type, category) => {
    setNotifications(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [category]: !prev[type][category]
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Update notification settings
      await api.post('/user/notifications', { notifications });
      
      setSuccess('Notification settings updated successfully!');
      
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError(err.response?.data?.message || 'Failed to update notification settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback data for development
  const fallbackNotifications = {
    email: {
      events: true,
      missions: false,
      battles: true,
      achievements: true,
      system: true
    },
    push: {
      events: true,
      missions: true,
      battles: true,
      achievements: true,
      system: false
    }
  };

  const displayNotifications = notifications || fallbackNotifications;

  if (loading && !displayNotifications) {
    return <LoadingSpinner message="Loading notification settings..." />;
  }

  if (error && !displayNotifications) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchNotificationSettings}
      />
    );
  }

  return (
    <div className="notifications-settings">
      <div className="item-card">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Email Notifications</h2>
        </div>
        
        {error && (
          <div className="form-error" style={{ marginBottom: '1rem' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}
        
        {success && (
          <div className="form-success" style={{ marginBottom: '1rem', color: '#10b981' }}>
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}
        
        <div className="notification-options">
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">Events</h3>
              <p className="notification-description">
                Receive notifications about new events, event reminders, and event results.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.email.events} 
                onChange={() => handleToggle('email', 'events')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">Missions</h3>
              <p className="notification-description">
                Receive notifications about new missions, mission progress, and mission completion.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.email.missions} 
                onChange={() => handleToggle('email', 'missions')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">Battles</h3>
              <p className="notification-description">
                Receive notifications about battle challenges, battle results, and tournament updates.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.email.battles} 
                onChange={() => handleToggle('email', 'battles')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">Achievements</h3>
              <p className="notification-description">
                Receive notifications when you earn new achievements or reach milestones.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.email.achievements} 
                onChange={() => handleToggle('email', 'achievements')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">System Updates</h3>
              <p className="notification-description">
                Receive notifications about system updates, maintenance, and important announcements.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.email.system} 
                onChange={() => handleToggle('email', 'system')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="item-card">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Push Notifications</h2>
        </div>
        <p className="settings-description">
          Manage which push notifications you receive on your devices.
        </p>
        
        <div className="notification-options">
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">Events</h3>
              <p className="notification-description">
                Receive push notifications about new events, event reminders, and event results.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.push.events} 
                onChange={() => handleToggle('push', 'events')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">Missions</h3>
              <p className="notification-description">
                Receive push notifications about new missions, mission progress, and mission completion.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.push.missions} 
                onChange={() => handleToggle('push', 'missions')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">Battles</h3>
              <p className="notification-description">
                Receive push notifications about battle challenges, battle results, and tournament updates.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.push.battles} 
                onChange={() => handleToggle('push', 'battles')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">Achievements</h3>
              <p className="notification-description">
                Receive push notifications when you earn new achievements or reach milestones.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.push.achievements} 
                onChange={() => handleToggle('push', 'achievements')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-option">
            <div className="notification-info">
              <h3 className="notification-title">System Updates</h3>
              <p className="notification-description">
                Receive push notifications about system updates, maintenance, and important announcements.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={displayNotifications.push.system} 
                onChange={() => handleToggle('push', 'system')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          className="form-button primary"
          onClick={handleSaveSettings}
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Saving...
            </>
          ) : (
            'Save Notification Settings'
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationsSettings;
