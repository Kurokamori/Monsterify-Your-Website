import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import {
  AuthContext,
  type AuthContextType,
  type User,
  type MonsterRollerSettings,
  type ContentSettings,
  type NotificationSettings,
  type RegisterData
} from './authContextDef';

// Re-export types for consumers
export type { AuthContextType, User, MonsterRollerSettings, ContentSettings, NotificationSettings, RegisterData };

interface JwtPayload {
  exp: number;
  [key: string]: unknown;
}

// Token refresh settings
const TOKEN_REFRESH_THRESHOLD = 5 * 60; // 5 minutes in seconds
const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Check if token is expired or about to expire
  const isTokenExpiredOrClose = useCallback((token: string): boolean => {
    if (!token) return true;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;

      // If token is expired or about to expire in the next 5 minutes
      return decoded.exp < currentTime + TOKEN_REFRESH_THRESHOLD;
    } catch (err) {
      console.error('Error decoding token:', err);
      return true;
    }
  }, []);

  // Logout function - defined early so it can be used by refreshTokenFn
  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

    setCurrentUser(null);
    navigate('/login');
  }, [navigate]);

  // Refresh token function
  const refreshTokenFn = useCallback(async (): Promise<string> => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    setRefreshing(true);

    try {
      const response = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Token refresh failed');
      }

      const { token } = response.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);

      return token;
    } catch (err) {
      console.error('Token refresh error:', err);
      logout();
      throw err;
    } finally {
      setRefreshing(false);
    }
  }, [logout]);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        const userData = localStorage.getItem(USER_STORAGE_KEY);

        if (token && userData) {
          if (isTokenExpiredOrClose(token)) {
            try {
              await refreshTokenFn();
            } catch {
              localStorage.removeItem(TOKEN_STORAGE_KEY);
              localStorage.removeItem(USER_STORAGE_KEY);
              localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
              setCurrentUser(null);
              setLoading(false);
              return;
            }
          }
          setCurrentUser(JSON.parse(userData));
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
  }, [isTokenExpiredOrClose, refreshTokenFn]);

  // Set up token refresh interval
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    const intervalId = setInterval(async () => {
      if (token && isTokenExpiredOrClose(token) && !refreshing) {
        try {
          await refreshTokenFn();
        } catch {
          // Error is already handled in refreshTokenFn
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [currentUser, isTokenExpiredOrClose, refreshTokenFn, refreshing]);

  // Login function
  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      const response = await api.post('/auth/login', { username, password, rememberMe });

      if (!response.data.success) {
        setError(response.data.message || 'Login failed');
        return false;
      }

      const { token, refreshToken: newRefreshToken, user } = response.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefreshToken);
      }

      setCurrentUser(user);
      navigate('/');
      return true;
    } catch (err: unknown) {
      console.error('Login error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to login. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      const response = await api.post('/auth/register', userData);

      if (!response.data.success) {
        setError(response.data.message || 'Registration failed');
        return false;
      }

      const { token, refreshToken: newRefreshToken, user } = response.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefreshToken);
      }

      setCurrentUser(user);
      navigate('/');
      return true;
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to register. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      const response = await api.patch('/auth/profile', userData);
      const serverUser = response.data.user;

      setCurrentUser(prevUser => {
        if (!prevUser) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(serverUser));
          return serverUser;
        }
        // Only apply fields that were sent in this request to avoid overwriting
        // concurrent settings updates (content, notification, roller settings)
        const merged = { ...prevUser };
        for (const key of Object.keys(userData)) {
          (merged as Record<string, unknown>)[key] = (serverUser as Record<string, unknown>)[key];
        }
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
      return true;
    } catch (err: unknown) {
      console.error('Profile update error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update profile. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user's monster roller settings
  const updateMonsterRollerSettings = async (settings: MonsterRollerSettings): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      const response = await api.put('/auth/roller-settings', settings);

      if (response.data.success) {
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const updatedUser = { ...prevUser, monster_roller_settings: response.data.settings };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

      return true;
    } catch (err: unknown) {
      console.error('Monster roller settings update error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update monster roller settings. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user's content settings
  const updateContentSettings = async (settings: ContentSettings): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      const response = await api.put('/auth/content-settings', settings);

      if (response.data.success) {
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const updatedUser = { ...prevUser, content_settings: response.data.settings };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

      return true;
    } catch (err: unknown) {
      console.error('Content settings update error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update content settings. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user's notification settings
  const updateNotificationSettings = async (settings: NotificationSettings): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      const response = await api.put('/auth/notification-settings', settings);

      if (response.data.success) {
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const updatedUser = { ...prevUser, notification_settings: response.data.notification_settings };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

      return true;
    } catch (err: unknown) {
      console.error('Notification settings update error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update notification settings. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user's theme preference
  const updateTheme = async (theme: string): Promise<boolean> => {
    try {
      const response = await api.put('/auth/theme', { theme });

      if (response.data.success) {
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
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

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      await api.post('/auth/change-password', { currentPassword, newPassword });

      return true;
    } catch (err: unknown) {
      console.error('Password change error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to change password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      await api.post('/auth/request-reset', { email });

      return true;
    } catch (err: unknown) {
      console.error('Password reset request error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to request password reset. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      setError('');
      setLoading(true);

      await api.post('/auth/reset-password', { token, newPassword });

      return true;
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to reset password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = useCallback((): void => {
    setError('');
  }, []);

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    updateMonsterRollerSettings,
    updateContentSettings,
    updateNotificationSettings,
    updateTheme,
    changePassword,
    requestPasswordReset,
    resetPassword,
    refreshToken: refreshTokenFn,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Re-export hook for convenience (import from useAuth.ts for better Fast Refresh)
// eslint-disable-next-line react-refresh/only-export-components
export { useAuth } from './useAuth';
