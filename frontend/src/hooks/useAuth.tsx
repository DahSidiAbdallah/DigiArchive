import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user.types';
import * as authService from '@/services/auth.service';

// Define types
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => void;
  recheckAuth: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkCount, setCheckCount] = useState(0) // Add a counter to force rechecks

  // Define checkAuth function outside useEffect to reuse it
  const checkAuth = async () => {
    console.log('Checking authentication state...');
    const token = localStorage.getItem('token')
    
    if (token) {
      try {
        const userData = await authService.getCurrentUser();
        console.log('Current user loaded:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Authentication error:', error)
        // Clear tokens on auth error
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        setUser(null);
      }
    } else {
      // Make sure user is null if no token exists
      console.log('No token found, user is not authenticated');
      setUser(null);
    }
    
    setIsLoading(false)
  };

  // Force recheck auth state
  const recheckAuth = () => {
    setIsLoading(true);
    setCheckCount(prev => prev + 1);
  };
  
  useEffect(() => {
    checkAuth();
  }, [checkCount])

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await authService.login({ username, password });
      } catch (error: any) {
        // Handle network errors (e.g., server down, connection refused)
        if (
          error?.message?.includes('Network') ||
          error?.message?.includes('Failed to fetch') ||
          error?.code === 'ERR_CONNECTION_REFUSED' ||
          error?.message?.includes('ECONNREFUSED') ||
          error?.toString().includes('ECONNREFUSED')
        ) {
          throw new Error('Le serveur d’authentification est injoignable. Veuillez démarrer le backend ou réessayer plus tard.');
        }
        // If backend returns a response with status
        if (error?.response?.status === 401) {
          throw new Error('Nom d\'utilisateur ou mot de passe invalide');
        }
        // If error is undefined or generic, show backend unreachable
        if (!error?.response) {
          throw new Error('Le serveur d’authentification est injoignable. Veuillez démarrer le backend ou réessayer plus tard.');
        }
        throw new Error('Erreur lors de la connexion. Veuillez réessayer.');
      }
      if (!response || !response.access || !response.refresh) {
        throw new Error('Réponse inattendue du serveur. Veuillez réessayer.');
      }
      localStorage.setItem('token', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      // Explicitly fetch user data after login
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (userError) {
        setUser(response.user || null); // Fallback to user from login response
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, password2: string) => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await authService.register({ username, email, password, password2 });
      } catch (error: any) {
        // Handle network errors (e.g., server down, connection refused)
        if (
          error?.message?.includes('Network') ||
          error?.message?.includes('Failed to fetch') ||
          error?.code === 'ERR_CONNECTION_REFUSED' ||
          error?.message?.includes('ECONNREFUSED') ||
          error?.toString().includes('ECONNREFUSED')
        ) {
          throw new Error('Le serveur d’authentification est injoignable. Veuillez démarrer le backend ou réessayer plus tard.');
        }
        // If backend returns a response with status
        if (error?.response?.status === 400 && error?.response?.data) {
          const errorData = error.response.data;
          if (typeof errorData === 'object') {
            const errorMessages: string[] = [];
            Object.entries(errorData).forEach(([field, errors]) => {
              if (Array.isArray(errors)) {
                errors.forEach(err => errorMessages.push(`${field}: ${err}`));
              } else if (typeof errors === 'string') {
                errorMessages.push(`${field}: ${errors}`);
              }
            });
            if (errorMessages.length > 0) {
              throw new Error(errorMessages.join(', '));
            }
          }
        }
        // If error is undefined or generic, show backend unreachable
        if (!error?.response) {
          throw new Error('Le serveur d’authentification est injoignable. Veuillez démarrer le backend ou réessayer plus tard.');
        }
        throw new Error('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
      if (!response || !response.access || !response.refresh) {
        throw new Error('Réponse inattendue du serveur. Veuillez réessayer.');
      }
      localStorage.setItem('token', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      setUser(response.user || null);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Erreur lors de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
    console.log('User logged out, auth state updated');
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    recheckAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
