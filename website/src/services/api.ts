import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: { timestamp: string };
    retry?: {
      retryCount: number;
      maxRetries: number;
      retryDelay: number;
    };
    _retryAfterRefresh?: boolean;
  }
}

// Track in-flight token refresh to avoid multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRetries: 3,
  retryDelay: 1000,
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Add a request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp for debugging
    const timestamp = new Date().toISOString();
    config.metadata = { timestamp };

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${timestamp} - ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const duration = response.config.metadata?.timestamp
      ? new Date().getTime() - new Date(response.config.metadata.timestamp).getTime()
      : 0;

    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} - ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    }

    return response;
  },
  async (error: AxiosError) => {
    // Calculate request duration
    const duration = error.config?.metadata?.timestamp
      ? new Date().getTime() - new Date(error.config.metadata.timestamp).getTime()
      : 0;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error.response?.status || 'Network Error'} - ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`);
    }

    const config = error.config;

    // If config doesn't exist or retry property is not set, initialize it
    if (config && !config.retry) {
      config.retry = {
        retryCount: 0,
        maxRetries: API_CONFIG.maxRetries,
        retryDelay: API_CONFIG.retryDelay,
      };
    }

    // Check if we should retry the request
    if (
      config &&
      config.retry &&
      config.retry.retryCount < config.retry.maxRetries &&
      (error.response?.status && error.response.status >= 500 || error.code === 'ECONNABORTED' || !error.response)
    ) {
      config.retry.retryCount += 1;

      // Exponential backoff
      const delay = config.retry.retryDelay * Math.pow(2, config.retry.retryCount - 1);

      console.log(`[API Retry] Attempt ${config.retry.retryCount}/${config.retry.maxRetries} after ${delay}ms`);

      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry the request
      return api(config);
    }

    // Handle 401 Unauthorized errors - attempt token refresh before logging out
    if (
      error.response?.status === 401 &&
      !config?.url?.includes('/auth/login') &&
      !config?.url?.includes('/auth/register') &&
      !config?.url?.includes('/auth/refresh') &&
      !config?._retryAfterRefresh
    ) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            const response = await axios.post(
              `${API_CONFIG.baseURL}/auth/refresh`,
              { refreshToken }
            );

            if (response.data.success && response.data.token) {
              const newToken = response.data.token;
              localStorage.setItem('token', newToken);
              isRefreshing = false;
              onRefreshed(newToken);

              // Retry the original request with the new token
              if (config) {
                config.headers.Authorization = `Bearer ${newToken}`;
                config._retryAfterRefresh = true;
                return api(config);
              }
            } else {
              throw new Error('Refresh failed');
            }
          } catch {
            isRefreshing = false;
            refreshSubscribers = [];
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(error);
          }
        } else {
          // Another request is already refreshing - queue this one
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken: string) => {
              if (config) {
                config.headers.Authorization = `Bearer ${newToken}`;
                config._retryAfterRefresh = true;
                resolve(api(config));
              }
            });
          });
        }
      } else {
        // No refresh token available - log out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
