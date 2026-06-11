'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'staff' | 'super_admin';
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshBackendToken: () => Promise<string | null>;
}

interface RegisterData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount (client-side only)
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }

    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && !e.newValue) {
        setUser(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      await verifyWithBackend();
    } catch {
      setUser(null);
      setIsLoading(false);
    }
  };

  const verifyWithBackend = async () => {
    try {
      const response = await authFetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
        // Clear any stale localStorage data
        localStorage.removeItem('user');
      }
    } catch {
      // Network error — don't clear user (may be offline), but don't persist stale state
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // backend_token and refresh_token are stored as HttpOnly cookies by the login BFF route — no localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);

        // Redirect based on role
        if (data.user.role === 'super_admin' || data.user.role === 'staff') {
          router.push('/admin/dashboard');
        } else {
          router.push('/orders');
        }

        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after successful registration
        return await login(userData.phone, userData.password);
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBackendToken = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok ? 'refreshed' : null;
    } catch {
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    router.push('/');
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
    refreshBackendToken,
  };

  return (
    <AuthContext.Provider value={value}>
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
