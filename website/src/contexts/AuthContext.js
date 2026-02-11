import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode'; // Note: You'll need to install this package

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Token refresh settings
const TOKEN_REFRESH_THRESHOLD = 5 * 60; // 5 minutes in seconds
const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Check if token is expired or about to expire
  const isTokenExpiredOrClose = useCallback((token) => {
    if (!token) return true;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // If token is expired or about to expire in the next 5 minutes
      return decoded.exp < currentTime + TOKEN_REFRESH_THRESHOLD;
    } catch (err) {
      console.error('Error decoding token:', err);
      return true;
    }
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    setRefreshing(true);

    try {
      const response = await api.post('/auth/refresh', { refreshToken });

      // Check if the response is successful
      if (!response.data.success) {
        throw new Error(response.data.message || 'Token refresh failed');
      }

      const { token } = response.data;

      localStorage.setItem(TOKEN_STORAGE_KEY, token);

      // Set the token in the API headers
      if (api.defaults) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return token;
    } catch (err) {
      console.error('Token refresh error:', err);
      // If refresh fails, log the user out
      logout();
      throw err;
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        const userData = localStorage.getItem(USER_STORAGE_KEY);

        if (token && userData) {
          // Check if token is expired or about to expire
          if (isTokenExpiredOrClose(token)) {
            try {
              // Try to refresh the token
              await refreshToken();
            } catch (refreshErr) {
              // If refresh fails, clear storage and continue as logged out
              localStorage.removeItem(TOKEN_STORAGE_KEY);
              localStorage.removeItem(USER_STORAGE_KEY);
              localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
              setCurrentUser(null);
              setLoading(false);
              return;
            }
          } else {
            // Token is still valid
            // Set the token in the API headers
            if (api.defaults) {
              api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setCurrentUser(JSON.parse(userData));
          }
        }
      } catch (err) {
        console.error('Error checking authentication status:', err);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, [isTokenExpiredOrClose, refreshToken]);

  // Set up token refresh interval
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    // Check token every minute
    const intervalId = setInterval(async () => {
      if (isTokenExpiredOrClose(token) && !refreshing) {
        try {
          await refreshToken();
        } catch (err) {
          // Error is already handled in refreshToken
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [currentUser, isTokenExpiredOrClose, refreshToken, refreshing]);

  // Login function
  const login = async (username, password, rememberMe = false) => {
    try {
      setError('');
      setLoading(true);

      const response = await api.post('/auth/login', { username, password, rememberMe });

      // Check if the response is successful
      if (!response.data.success) {
        setError(response.data.message || 'Login failed');
        return false;
      }

      // Store the token and user data
      const { token, refreshToken: newRefreshToken, user } = response.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      // Always store refresh token
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefreshToken);
      }

      // Set the token in the API headers
      if (api.defaults) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      setCurrentUser(user);
      navigate('/');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);

      const response = await api.post('/auth/register', userData);

      // Check if the response is successful
      if (!response.data.success) {
        setError(response.data.message || 'Registration failed');
        return false;
      }

      // Store the token and user data
      const { token, refreshToken: newRefreshToken, user } = response.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      // Store refresh token
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefreshToken);
      }

      // Set the token in the API headers
      if (api.defaults) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      setCurrentUser(user);
      navigate('/');
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError('');
      setLoading(true);

      const response = await api.patch('/auth/profile', userData);

      // Update user data in localStorage
      const updatedUser = response.data.user;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

      setCurrentUser(updatedUser);
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user's monster roller settings
  const updateMonsterRollerSettings = async (settings) => {
    try {
      setError('');
      setLoading(true);

      const response = await api.put('/auth/roller-settings', settings);

      if (response.data.success) {
        // Update user data in localStorage with new settings
        // Use functional setState to get the latest currentUser value (avoids stale closure)
        setCurrentUser(prevUser => {
          const updatedUser = { ...prevUser, monster_roller_settings: response.data.settings };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

      return true;
    } catch (err) {
      console.error('Monster roller settings update error:', err);
      setError(err.response?.data?.message || 'Failed to update monster roller settings. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user's theme preference
  const updateTheme = async (theme) => {
    try {
      const response = await api.put('/auth/theme', { theme });

      if (response.data.success) {
        setCurrentUser(prevUser => {
          const updatedUser = { ...prevUser, theme: response.data.theme };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

      return true;
    } catch (err) {
      console.error('Theme update error:', err);
      return false;
    }
  };

  // Update user's content settings
  const updateContentSettings = async (settings) => {
    try {
      const response = await api.put('/auth/content-settings', settings);

      if (response.data.success) {
        setCurrentUser(prevUser => {
          const updatedUser = { ...prevUser, content_settings: response.data.content_settings };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

      return true;
    } catch (err) {
      console.error('Content settings update error:', err);
      return false;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError('');
      setLoading(true);

      await api.post('/auth/change-password', { currentPassword, newPassword });

      return true;
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      setError('');
      setLoading(true);

      await api.post('/auth/request-reset', { email });

      return true;
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.response?.data?.message || 'Failed to request password reset. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      setError('');
      setLoading(true);

      await api.post('/auth/reset-password', { token, newPassword });

      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

    if (api.defaults) {
      delete api.defaults.headers.common['Authorization'];
    }

    setCurrentUser(null);
    navigate('/login');
  };

  // Clear error
  const clearError = () => {
    setError('');
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    updateMonsterRollerSettings,
    updateTheme,
    updateContentSettings,
    changePassword,
    requestPasswordReset,
    resetPassword,
    refreshToken,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
