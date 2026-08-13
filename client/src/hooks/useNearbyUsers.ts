import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useCallback, useState } from 'react';
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
  const res = await fetch(`${NEARBY_API}?userId=${userId}&lat=${lat}&lng=${lng}&radius=${radius}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch nearby users');
  const json = await res.json();
  return json.data;
};

// Fireball Algorithm constants
const MIN_PING_INTERVAL_MS = 10_000; // At most 1 ping every 10 seconds
const MIN_DISTANCE_CHANGE_M = 50;    // Only ping if moved > 50 meters

/** Haversine distance in meters between two GPS points */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Custom hook to poll nearby users every 30 seconds.
 * Uses the Fireball algorithm to debounce location pings.
 */
export function useNearbyUsers(latitude: number | null, longitude: number | null) {
  const { user } = useAuth();
  const lastPingRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const [hasPinged, setHasPinged] = useState(false);

  const pingMutation = useMutation({
    mutationFn: ({ userId, lat, lng }: { userId: string; lat: number; lng: number }) =>
      pingLocation(userId, lat, lng),
  });

  // Fireball: only ping when coordinates meaningfully change and enough time has passed
  const debouncedPing = useCallback(() => {
    if (!user || latitude === null || longitude === null) return;

    const now = Date.now();
    const last = lastPingRef.current;

    if (last) {
      const timeSinceLast = now - last.ts;
      const distanceMoved = haversineDistance(last.lat, last.lng, latitude, longitude);

      // Skip ping if we pinged recently AND haven't moved far enough
      if (timeSinceLast < MIN_PING_INTERVAL_MS && distanceMoved < MIN_DISTANCE_CHANGE_M) {
        return;
      }
    }

    // Fire the ping and record it
    lastPingRef.current = { lat: latitude, lng: longitude, ts: now };
    pingMutation.mutate(
      { userId: user.id.toString(), lat: latitude, lng: longitude },
      {
        onSuccess: () => {
          if (!hasPinged) setHasPinged(true);
        }
      }
    );
  }, [user, latitude, longitude, pingMutation, hasPinged]);

  useEffect(() => {
    debouncedPing();
  }, [debouncedPing]);

  // Send "going offline" beacon when the tab/window is closing
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      const payload = JSON.stringify({ userId: user.id.toString() });
      navigator.sendBeacon(`${NEARBY_API}/location/offline`, payload);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  return useQuery({
    queryKey: ['nearbyUsers', user?.id, latitude, longitude],
    queryFn: () => getNearbyUsers(user!.id.toString(), latitude!, longitude!),
    enabled: !!user && latitude !== null && longitude !== null && hasPinged,
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
