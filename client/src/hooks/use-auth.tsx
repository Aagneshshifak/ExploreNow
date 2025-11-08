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
      console.log('[AUTH] Fetching user from /api/auth/me...');
      
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        console.log('[AUTH] /api/auth/me response:', {
          status: response.status,
          ok: response.ok,
          headers: {
            'content-type': response.headers.get('content-type')
          }
        });
        
        if (!response.ok) {
          console.error('[AUTH] /api/auth/me failed with status:', response.status);
          // Clear memory store on auth failure
          userMemoryStore.clear();
          throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        console.log('[AUTH] /api/auth/me data:', {
          success: data.success,
          hasData: !!data.data,
          userId: data.data?.id,
          userEmail: data.data?.email
        });
        
        if (data.success && data.data) {
          // Update memory store
          userMemoryStore.setUser(data.data);
          console.log('[AUTH] User data updated in memory store');
          return data.data as User;
        }
        
        console.warn('[AUTH] /api/auth/me returned no user data');
        userMemoryStore.clear();
        return null;
      } catch (error) {
        console.error('[AUTH] Error fetching user:', error);
        userMemoryStore.clear();
        throw error;
      }
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
    console.log('[AUTH] Login attempt started for:', email);
    
    try {
      console.log('[AUTH] Sending login request to /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('[AUTH] Login response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          'content-type': response.headers.get('content-type'),
          'set-cookie': response.headers.get('set-cookie') ? 'present' : 'missing'
        }
      });

      // Check content-type before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Get response text first (can only read body once)
      const responseText = await response.text();
      console.log('[AUTH] Response text length:', responseText.length);
      
      // Check if response is OK before parsing
      if (!response.ok) {
        console.error('[AUTH] Login failed with status:', response.status);
        // Try to parse error response, but handle non-JSON gracefully
        let errorMessage = `Login failed: ${response.status} ${response.statusText}`;
        if (isJson && responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error('[AUTH] Error response data:', errorData);
          } catch (parseError) {
            console.error('[AUTH] Failed to parse error JSON:', parseError);
            console.error('[AUTH] Response text:', responseText);
          }
        } else if (responseText) {
          console.error('[AUTH] Non-JSON error response:', responseText);
        }
        throw new Error(errorMessage);
      }

      // Validate response is not empty
      if (!responseText || responseText.trim() === '') {
        console.error('[AUTH] Empty response received');
        throw new Error('Server returned empty response');
      }

      // Validate content-type for successful responses
      if (!isJson) {
        console.error('[AUTH] Non-JSON response received:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[AUTH] Parsed response data:', {
          success: data.success,
          hasData: !!data.data,
          hasUser: !!data.data?.user,
          hasToken: !!data.data?.token,
          message: data.message
        });
      } catch (jsonError) {
        console.error('[AUTH] Failed to parse JSON response:', jsonError);
        console.error('[AUTH] Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }
      
      if (data.success && data.data?.user) {
        const loggedInUser = data.data.user;
        console.log('[AUTH] Login successful, user data:', {
          id: loggedInUser.id,
          email: loggedInUser.email,
          role: loggedInUser.role
        });
        
        // Store in memory store
        userMemoryStore.setUser(loggedInUser);
        console.log('[AUTH] User stored in memory store');
        
        // Update React Query cache
        queryClient.setQueryData(['/api/auth/me'], loggedInUser);
        console.log('[AUTH] React Query cache updated');
        
        // Refetch to ensure consistency
        console.log('[AUTH] Refetching user data for consistency');
        await refetchUser();
        console.log('[AUTH] User refetch completed');
      } else {
        console.error('[AUTH] Login response missing user data:', data);
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('[AUTH] Login error:', errorMessage);
      console.error('[AUTH] Error details:', error);
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