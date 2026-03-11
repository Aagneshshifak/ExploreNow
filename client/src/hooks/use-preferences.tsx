import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';

interface UserPreferences {
  id?: number;
  userId: number;
  currency: string;
  language: string;
  theme: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function usePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch preferences
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['/api/user/preferences'],
    queryFn: async () => {
      const response = await fetch('/api/user/preferences', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    },
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update preferences');
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: (data) => {
      // Update cache with new preferences
      queryClient.setQueryData(['/api/user/preferences'], data);
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
