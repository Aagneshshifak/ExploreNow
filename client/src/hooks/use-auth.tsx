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
  loginWithGoogle: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Flag to prevent refetch after logout
let isLoggingOut = false;

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
      // If we're in the middle of logging out, return null immediately
      if (isLoggingOut) {
        return null;
      }

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
          // Only clear memory store on explicit auth failure (401/403)
          // Do not clear on 5xx (server sleeping/error) or network errors
          if (response.status === 401 || response.status === 403) {
            userMemoryStore.clear();
          }
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
        // Do not clear store here on generic fetch errors (e.g. network failure)
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

  // Detect Google OAuth success redirect (?oauth=success in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'success') {
      // Remove the query params without a page reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      // Refresh user data — the cookie is now set
      refetchUser();
    }
  }, [refetchUser]);

  /** Redirect the browser to Google's consent page via the backend */
  const loginWithGoogle = useCallback(() => {
    // Use the current origin so it works in both dev (Vite proxy) and production (same origin)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    window.location.href = `${backendUrl}/api/auth/google`;
  }, []);

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
      });

      // Check content-type before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Get response text first (can only read body once)
      const responseText = await response.text();
      
      // Check if response is OK before parsing
      if (!response.ok) {
        console.error('[AUTH] Login failed with status:', response.status);
        let errorMessage = `Login failed: ${response.status} ${response.statusText}`;
        if (isJson && responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            console.error('[AUTH] Failed to parse error JSON:', parseError);
          }
        }
        throw new Error(errorMessage);
      }

      // Validate response is not empty
      if (!responseText || responseText.trim() === '') {
        throw new Error('Server returned empty response');
      }

      // Validate content-type for successful responses
      if (!isJson) {
        throw new Error('Server returned non-JSON response');
      }

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error('Invalid JSON response from server');
      }
      
      if (data.success && data.data?.user) {
        const loggedInUser = data.data.user;
        console.log('[AUTH] Login successful, user:', loggedInUser.email);
        
        // Store in memory store immediately
        userMemoryStore.setUser(loggedInUser);
        
        // Update React Query cache directly — this triggers an instant UI re-render
        queryClient.setQueryData(['/api/auth/me'], loggedInUser);
        
        // Invalidate non-auth queries in the background (don't await — let navigation happen fast)
        // Exclude '/api/auth/me' so we don't refetch the user we just set
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== '/api/auth/me',
        });
        
        console.log('[AUTH] Login complete, UI should update immediately');
      } else {
        console.error('[AUTH] Login response missing user data:', data);
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('[AUTH] Login error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [queryClient]);

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
        // Update React Query cache directly
        queryClient.setQueryData(['/api/auth/me'], registeredUser);
        
        // Invalidate non-auth queries in the background
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== '/api/auth/me',
        });
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    console.log('[AUTH] Logout started');
    
    // Set flag to prevent any refetch from restoring the user
    isLoggingOut = true;
    
    // 1. Clear local state IMMEDIATELY for instant UI feedback
    userMemoryStore.clear();
    
    // 2. Cancel any in-flight queries that might restore the user
    await queryClient.cancelQueries({ queryKey: ['/api/auth/me'] });
    
    // 3. Set auth cache to null — this triggers the UI re-render to logged-out state
    queryClient.setQueryData(['/api/auth/me'], null);
    
    // 4. Call the server to clear the cookie
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('[AUTH] Server cookie cleared');
    } catch (error) {
      console.error('[AUTH] Logout API error (cookie may not be cleared):', error);
    }
    
    // 5. Remove all non-auth cached queries (trips, hotels, bookings, etc.)
    // Do NOT use queryClient.clear() — it destroys mounted observers and breaks React Query
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== '/api/auth/me',
    });
    
    // 6. Reset the flag
    isLoggingOut = false;
    
    console.log('[AUTH] Logout complete');
  }, [queryClient]);

  const value: AuthContextType = {
    user,
    login,
    loginWithGoogle,
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