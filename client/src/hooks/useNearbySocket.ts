import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { toast } from '@/hooks/use-toast';

// Exponential backoff for reconnection
const MAX_RECONNECT_ATTEMPTS = 5;

// Dynamically determine the URL to handle cases where the env var wasn't injected during build
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const defaultUrl = isLocal ? 'http://localhost:10000' : 'https://explorenow-hhwh.onrender.com';
const NEARBY_SERVICE_URL = import.meta.env.VITE_NEARBY_SERVICE_URL || defaultUrl;

export function useNearbySocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<{from: string, to: string, text: string, timestamp: number}[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Per-instance reconnect counter (not shared across renders)
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    // Guard: disconnect any stale socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    let socket: Socket | null = null;

    const connectSocket = async () => {
      try {
        // Fetch bridged JWT token from our Gateway
        const res = await fetch('/api/auth/token');
        const data = await res.json();
        if (!data.success || !data.token) {
          console.error("Failed to fetch nearby token");
          return;
        }

        // Calculate backoff delay
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

        socket = io(NEARBY_SERVICE_URL, {
          auth: { token: data.token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: backoffDelay,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          timeout: 20000,
          withCredentials: true // Important for CORS with credentials
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('✅ Connected to Nearby WebSocket Gateway');
          setIsConnected(true);
          reconnectAttemptsRef.current = 0; // Reset on successful connection
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected from Nearby WebSocket:', reason);
          setIsConnected(false);
          
          // Don't show toast for intentional disconnects
          if (reason === 'io server disconnect' || reason === 'io client disconnect') {
            return;
          }
        });

        socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error.message);
          reconnectAttemptsRef.current++;
          
          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.error('Max reconnection attempts reached. Giving up.');
            socket?.disconnect();
            toast({
              title: "Connection Failed",
              description: "Unable to connect to nearby service. Please refresh the page.",
              variant: "destructive"
            });
          }
        });

        socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
        });

        // Handle real-time notifications
        socket.on('CONNECTION_REQUESTED', (reqData) => {
          toast({
            title: "New Connection Request!",
            description: `${reqData.senderName || 'Someone'} wants to share their precise location with you.`,
          });
        });

        socket.on('CONNECTION_ACCEPTED', (reqData) => {
          toast({
            title: "Connection Accepted!",
            description: `You can now see the exact location of ${reqData.withUserName || 'your connection'}.`,
          });
        });

        socket.on('CONNECTION_REJECTED', (reqData) => {
          toast({
            title: "Connection Rejected",
            description: `${reqData.byUserName || 'The user'} declined your request.`,
            variant: "destructive"
          });
        });

        socket.on('CHAT_MESSAGE', (msg) => {
          setMessages(prev => [...prev, msg]);
          toast({
            title: "New Message",
            description: msg.text,
          });
        });

      } catch (err) {
        console.error("❌ Socket connection failed:", err);
        reconnectAttemptsRef.current++;
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  const sendMessage = (toUserId: string, text: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('CHAT_MESSAGE', { to: toUserId, text });
      // Optimistically add to UI
      setMessages(prev => [...prev, { from: user!.id.toString(), to: toUserId, text, timestamp: Date.now() }]);
    } else {
      toast({
        title: "Not Connected",
        description: "Unable to send message. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  return { isConnected, socket: socketRef.current, messages, sendMessage };
}
