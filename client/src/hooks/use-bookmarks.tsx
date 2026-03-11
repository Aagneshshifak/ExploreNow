import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';

interface Bookmark {
  id: number;
  userId: number;
  tripId?: number;
  hotelId?: number;
  createdAt: string;
  updatedAt: string;
  trip?: {
    id: number;
    title: string;
    location: string;
    description?: string;
    price: string;
    imageUrl?: string;
    duration?: number;
  };
  hotel?: {
    id: number;
    name: string;
    location: string;
    description?: string;
    price: string;
    imageUrl?: string;
    rating?: string;
  };
}

export function useBookmarks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch bookmarks
  const { data: bookmarks = [], isLoading, error } = useQuery({
    queryKey: ['/api/user/bookmarks'],
    queryFn: async () => {
      const response = await fetch('/api/user/bookmarks', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add bookmark mutation
  const addBookmark = useMutation({
    mutationFn: async ({ tripId, hotelId }: { tripId?: number; hotelId?: number }) => {
      const response = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tripId, hotelId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add bookmark');
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      // Invalidate bookmarks query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/user/bookmarks'] });
    },
  });

  // Remove bookmark mutation
  const removeBookmark = useMutation({
    mutationFn: async (bookmarkId: number) => {
      const response = await fetch(`/api/user/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove bookmark');
      }

      return bookmarkId;
    },
    onSuccess: () => {
      // Invalidate bookmarks query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/user/bookmarks'] });
    },
  });

  // Helper function to check if an item is bookmarked
  const isBookmarked = (tripId?: number, hotelId?: number) => {
    return bookmarks.some((bookmark: Bookmark) => {
      if (tripId) return bookmark.tripId === tripId;
      if (hotelId) return bookmark.hotelId === hotelId;
      return false;
    });
  };

  // Helper function to get bookmark ID for an item
  const getBookmarkId = (tripId?: number, hotelId?: number) => {
    const bookmark = bookmarks.find((b: Bookmark) => {
      if (tripId) return b.tripId === tripId;
      if (hotelId) return b.hotelId === hotelId;
      return false;
    });
    return bookmark?.id;
  };

  return {
    bookmarks,
    isLoading,
    error,
    addBookmark: addBookmark.mutate,
    removeBookmark: removeBookmark.mutate,
    isAddingBookmark: addBookmark.isPending,
    isRemovingBookmark: removeBookmark.isPending,
    isBookmarked,
    getBookmarkId,
  };
}
