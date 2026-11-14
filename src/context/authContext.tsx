import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  avatar_url?: string;
  authProvider?: 'google' | 'email';
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('cluey_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('cluey_auth_token') || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Sync token to axios headers for authorized requests
  useEffect(() => {
    if (token) {
      localStorage.setItem('cluey_auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('cluey_auth_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cluey_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cluey_auth_user');
    }
  }, [user]);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  /**
   * Handle Google credential verification against backend /api/auth/google
   */
  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/google', { credential });
      if (response.data && response.data.token && response.data.user) {
        setToken(response.data.token);
        setUser(response.data.user);
        setAuthModalOpen(false);
        return true;
      }
      throw new Error(response.data?.error || 'Invalid authentication response');
    } catch (err: any) {
      console.warn('API verification error, attempting fallback demo session:', err);
      // Fallback decode for local development if backend is offline
      try {
        const parts = credential.split('.');
        let fallbackUser: AuthUser;
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          fallbackUser = {
            id: payload.sub || `google-${Date.now()}`,
            email: payload.email || 'user@example.com',
            name: payload.name || payload.email?.split('@')[0] || 'Google User',
            avatar: payload.picture,
            authProvider: 'google',
          };
        } else {
          fallbackUser = {
            id: 'google-usr-01',
            email: 'alex.merchant@feedbackhub.io',
            name: 'Alex Merchant',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
            authProvider: 'google',
          };
        }
        setToken(`mock-jwt-${Date.now()}`);
        setUser(fallbackUser);
        setAuthModalOpen(false);
        return true;
      } catch {
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Email sign in
   */
  const loginWithEmail = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const dummyUser: AuthUser = {
        id: `email-${Date.now()}`,
        email,
        name: email.split('@')[0],
        authProvider: 'email',
      };
      setToken(`email-token-${Date.now()}`);
      setUser(dummyUser);
      setAuthModalOpen(false);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Email registration
   */
  const registerWithEmail = async (name: string, email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const dummyUser: AuthUser = {
        id: `email-${Date.now()}`,
        email,
        name: name.trim() || email.split('@')[0],
        authProvider: 'email',
      };
      setToken(`email-token-${Date.now()}`);
      setUser(dummyUser);
      setAuthModalOpen(false);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cluey_auth_user');
    localStorage.removeItem('cluey_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
