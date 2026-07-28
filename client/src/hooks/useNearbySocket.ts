import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { toast } from '@/hooks/use-toast';

const NEARBY_SERVICE_URL = import.meta.env.VITE_NEARBY_SERVICE_URL || 'http://localhost:50051';

export function useNearbySocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const socket = io(NEARBY_SERVICE_URL, {
      auth: { userId: user.id.toString() }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Nearby WebSocket Gateway');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle real-time notifications
    socket.on('CONNECTION_REQUESTED', (data) => {
      toast({
        title: "New Connection Request!",
        description: `User ${data.senderId} wants to share their precise location with you.`,
        action: (
          <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
            View
          </button>
        )
      });
      // Optionally invalidate React Query cache here
    });

    socket.on('CONNECTION_ACCEPTED', (data) => {
      toast({
        title: "Connection Accepted!",
        description: `You can now see the exact location of user ${data.withUser}.`,
      });
    });

    socket.on('CONNECTION_REJECTED', (data) => {
      toast({
        title: "Connection Rejected",
        description: `User ${data.byUser} declined your request.`,
        variant: "destructive"
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return { isConnected, socket: socketRef.current };
}
