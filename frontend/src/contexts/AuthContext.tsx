import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../services/api';
import api from '../services/api';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (minRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'nexops_token';
const USER_KEY = 'nexops_user';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  operator: 2,
  developer: 3,
  admin: 4,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up axios interceptor for auth token
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        setUser(response.data);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      } catch (err) {
        // Token is invalid, clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login(username, password);
      const { access_token, user: userData } = response.data;

      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback((_permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    // Add more permission checks based on role
    return false;
  }, [user]);

  const hasRole = useCallback((minRole: UserRole): boolean => {
    if (!user) return false;
    const userLevel = ROLE_HIERARCHY[user.role];
    const requiredLevel = ROLE_HIERARCHY[minRole];
    return userLevel >= requiredLevel;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading,
      error,
      login,
      logout,
      hasPermission,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
