import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Memory store for user cache (in addition to React Query cache)
const userMemoryStore = {
  user: null as User | null,
  setUser: (user: User | null) => {
    userMemoryStore.user = user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },
  getUser: (): User | null => {
    if (userMemoryStore.user) {
      return userMemoryStore.user;
    }
    // Fallback to localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
        return JSON.parse(savedUser);
          } catch (e) {
            console.error('Failed to parse saved user:', e);
          }
        }
    return null;
  },
  clear: () => {
    userMemoryStore.user = null;
    localStorage.removeItem('user');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Initialize from memory store on mount
  const [initialUser] = useState(() => {
    const cachedUser = userMemoryStore.getUser();
    if (cachedUser) {
      console.log('Initializing from memory store:', cachedUser);
      return cachedUser;
    }
    return null;
  });

  // Use React Query to cache user data in memory
  const { data: userData, isLoading, refetch: refetchUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      console.log('Fetching user from /api/auth/me...');
      
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
      if (!response.ok) {
        // Clear memory store on auth failure
        userMemoryStore.clear();
        throw new Error('Authentication failed');
      }
      
          const data = await response.json();
          if (data.success && data.data) {
        // Update memory store
        userMemoryStore.setUser(data.data);
        return data.data as User;
      }
      
      userMemoryStore.clear();
      return null;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes - keep in cache
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in memory
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    initialData: initialUser || undefined, // Initialize from memory store
    enabled: true, // Always enabled
  });

  const user = userData || null;

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.user) {
        const loggedInUser = data.data.user;
        // Store in memory store
        userMemoryStore.setUser(loggedInUser);
        // Update React Query cache
        queryClient.setQueryData(['/api/auth/me'], loggedInUser);
        // Refetch to ensure consistency
        await refetchUser();
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [queryClient, refetchUser]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.user) {
        const registeredUser = data.data.user;
        // Store in memory store
        userMemoryStore.setUser(registeredUser);
        // Update React Query cache
        queryClient.setQueryData(['/api/auth/me'], registeredUser);
        // Refetch to ensure consistency
        await refetchUser();
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [queryClient, refetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear memory store
      userMemoryStore.clear();
      // Clear React Query cache
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.removeQueries({ queryKey: ['/api/auth/me'] });
      // Invalidate all queries to clear user-specific data
      queryClient.invalidateQueries();
    }
  }, [queryClient]);

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    error,
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