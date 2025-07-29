/**
 * API configuration for the application.
 */
import axios from 'axios';

// Get base URL from environment or use default
const getApiBaseUrl = () => {
  // Check if we have an environment variable for the API URL
  let apiUrl;
  
  try {
    // @ts-ignore - import.meta.env might not be typed correctly
    apiUrl = import.meta.env?.VITE_API_URL;
  } catch (error) {
    console.warn('Error accessing env variables');
    apiUrl = null;
  }

  // If we have an explicit API URL from env, use that
  if (apiUrl) {
    console.log('Using configured API URL:', apiUrl);
    return apiUrl;
  }
  
  // Check if API is running locally
  const isLocalHost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  // If running locally, use port 8000 (Django's default)
  // Otherwise use relative path for production deployments
  if (isLocalHost) {
    console.log('Using local development API URL');
    return 'http://localhost:8000/api';
  } else {
    console.log('Using relative API path');
    return '/api';
  }
};

// Create an axios instance with base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials to include cookies in cross-site requests
  withCredentials: true,
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`API Request to ${config.url} with auth token`);
    } else {
      console.log(`API Request to ${config.url} without auth token`);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, can't refresh
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${getApiBaseUrl()}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        // Save the new token
        localStorage.setItem('token', response.data.access);

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Failed to refresh the token, clear tokens and reject
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
