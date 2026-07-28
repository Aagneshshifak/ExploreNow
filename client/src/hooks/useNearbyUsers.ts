import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from './use-auth';

const NEARBY_API = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api/nearby` 
  : '/api/nearby';

export interface NearbyCandidate {
  userId: string;
  username?: string;
  avatarUrl?: string;
  approximateDistanceMeters: number;
  exactLatitude?: number;
  exactLongitude?: number;
  isConnected: boolean;
}

/**
 * Pings the location backend to update spatial grid
 */
export const pingLocation = async (userId: string, lat: number, lng: number) => {
  const res = await fetch(`${NEARBY_API}/location/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, latitude: lat, longitude: lng })
  });
  if (!res.ok) throw new Error('Failed to ping location');
  return res.json();
};

/**
 * Fetches nearby candidates using the H3 grid algorithm
 */
export const getNearbyUsers = async (userId: string, lat: number, lng: number, radius = 2000): Promise<NearbyCandidate[]> => {
  const res = await fetch(`${NEARBY_API}/nearby?userId=${userId}&lat=${lat}&lng=${lng}&radius=${radius}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch nearby users');
  const json = await res.json();
  return json.data;
};

/**
 * Custom hook to poll nearby users every 30 seconds
 */
export function useNearbyUsers(latitude: number | null, longitude: number | null) {
  const { user } = useAuth();

  // Automatically ping location whenever it changes significantly (debounced in a real app)
  useMutation({
    mutationFn: () => pingLocation(user!.id.toString(), latitude!, longitude!),
  }).mutate();

  return useQuery({
    queryKey: ['nearbyUsers', user?.id, latitude, longitude],
    queryFn: () => getNearbyUsers(user!.id.toString(), latitude!, longitude!),
    enabled: !!user && latitude !== null && longitude !== null,
    refetchInterval: 30000, // Poll every 30s
  });
}

/**
 * Send Connection Request
 */
export function useSendConnectionRequest() {
  return useMutation({
    mutationFn: async ({ senderId, receiverId }: { senderId: string, receiverId: string }) => {
      const res = await fetch(`${NEARBY_API}/connections/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ senderId, receiverId })
      });
      if (!res.ok) throw new Error('Request failed');
    }
  });
}

/**
 * Respond to Connection Request
 */
export function useRespondToRequest() {
  return useMutation({
    mutationFn: async ({ responderId, senderId, status }: { responderId: string, senderId: string, status: 'ACCEPTED' | 'REJECTED' }) => {
      const res = await fetch(`${NEARBY_API}/connections/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ responderId, senderId, status })
      });
      if (!res.ok) throw new Error('Response failed');
    }
  });
}
