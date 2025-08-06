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
      // IMPORTANT: Format depends on backend authentication method
      // For Simple JWT, use 'Bearer'
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`API Request to ${config.url} with auth token`);
    } else {
      console.log(`API Request to ${config.url} without auth token`);
    }
    
    // Log request details for PATCH/PUT/POST requests
    if (['patch', 'put', 'post'].includes(config.method?.toLowerCase() || '')) {
      console.log(`${config.method?.toUpperCase()} request to ${config.url}`);
      console.log('Request headers:', config.headers);
      
      // Log the request data - be careful with sensitive data
      if (config.data) {
        if (config.data instanceof FormData) {
          console.log('Request contains FormData');
        } else {
          console.log('Request data:', config.data);
        }
      }
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
    // Log successful response details
    console.log(`API Response from ${response.config.url}: ${response.status}`);
    if (response.data) {
      console.log('Response data:', response.data);
    }
    return response;
  },
  async (error) => {
    // Log detailed error information
    console.error('API Error:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      console.error('Error data:', error.response.data);
      
      // Additional logging for specific status codes
      if (error.response.status === 400) {
        console.error('Bad Request (400) Details:', JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    const originalRequest = error.config;

    // If error is 401 and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
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
