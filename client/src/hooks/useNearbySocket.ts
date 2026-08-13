import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { toast } from '@/hooks/use-toast';

// Dynamically determine the URL to handle cases where the env var wasn't injected during build
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const defaultUrl = isLocal ? 'http://localhost:10000' : 'https://explorenow-hhwh.onrender.com';
const NEARBY_SERVICE_URL = import.meta.env.VITE_NEARBY_SERVICE_URL || defaultUrl;

export function useNearbySocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<{from: string, to: string, text: string, timestamp: number}[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

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

        socket = io(NEARBY_SERVICE_URL, {
          auth: { token: data.token }
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
        console.error("Socket connection failed", err);
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const sendMessage = (toUserId: string, text: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('CHAT_MESSAGE', { to: toUserId, text });
      // Optimistically add to UI
      setMessages(prev => [...prev, { from: user!.id.toString(), to: toUserId, text, timestamp: Date.now() }]);
    }
  };

  return { isConnected, socket: socketRef.current, messages, sendMessage };
}
