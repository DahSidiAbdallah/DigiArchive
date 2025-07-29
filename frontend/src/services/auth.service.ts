/**
 * Authentication service for handling user authentication.
 */
import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    department?: string;
    position?: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
}

/**
 * Log in a user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/token/', credentials);
  return response.data;
};

/**
 * Register a new user
 */
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register/', credentials);
  return response.data;
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    await api.post('/auth/logout/', { refresh: refreshToken });
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

/**
 * Get the current user's profile
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    console.log('Fetching current user profile...');
    const response = await api.get<User>('/auth/profile/');
    console.log('Current user profile fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to get current user profile:', error);
    throw new Error('Failed to authenticate user');
  }
};

/**
 * Update the current user's profile
 */
export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.patch<User>('/auth/profile/', userData);
  return response.data;
};
