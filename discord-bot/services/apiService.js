const axios = require('axios');
const config = require('../config/config');

class ApiService {
  constructor() {
    this.baseURL = config.api.baseUrl;
    this.timeout = config.api.timeout;
    
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  // Handle API errors and format them consistently
  handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        status,
        message: data?.message || `HTTP ${status} Error`,
        error: data?.error || 'Unknown error',
        isApiError: true,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        status: 0,
        message: 'No response from server',
        error: 'Network error or server is down',
        isApiError: true,
      };
    } else {
      // Something else happened
      return {
        status: 0,
        message: 'Request failed',
        error: error.message,
        isApiError: true,
      };
    }
  }

  // Set authorization token for authenticated requests
  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Generic GET request
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generic POST request
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generic PUT request
  async put(endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generic PATCH request
  async patch(endpoint, data = {}) {
    try {
      const response = await this.client.patch(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generic DELETE request
  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response;
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

module.exports = apiService;
