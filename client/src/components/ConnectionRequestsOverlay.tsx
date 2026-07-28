import React, { useState, useEffect } from 'react';
import { useNearbySocket } from '../hooks/useNearbySocket';
import { useRespondToRequest } from '../hooks/useNearbyUsers';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ConnectionRequestsOverlay() {
  const { socket } = useNearbySocket();
  const { user } = useAuth();
  const { mutate: respondToRequest, isPending } = useRespondToRequest();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;
    
    // When a request arrives, open the dialog and add to queue
    const handleRequest = (data: any) => {
      setRequests(prev => [...prev, data]);
      setIsOpen(true);
    };

    socket.on('CONNECTION_REQUESTED', handleRequest);
    return () => { socket.off('CONNECTION_REQUESTED', handleRequest); };
  }, [socket]);

  const handleRespond = (senderId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!user) return;
    
    respondToRequest({ responderId: user.id.toString(), senderId, status }, {
      onSuccess: () => {
        setRequests(prev => prev.filter(r => r.senderId !== senderId));
        if (requests.length <= 1) setIsOpen(false);
      }
    });
  };

  if (!isOpen || requests.length === 0) return null;

  const currentReq = requests[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && requests.length === 0) setIsOpen(false);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Connection Request</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4 space-y-4">
          <div className="text-center">
            User <strong>{currentReq.senderId}</strong> wants to connect with you.
            <br/><br/>
            <span className="text-sm text-gray-500">
              If you accept, they will be able to see your exact location on the map in real-time.
            </span>
          </div>
          
          <div className="flex gap-4 w-full">
            <Button variant="outline" className="flex-1" disabled={isPending} onClick={() => handleRespond(currentReq.senderId, 'REJECTED')}>
              Decline
            </Button>
            <Button className="flex-1" disabled={isPending} onClick={() => handleRespond(currentReq.senderId, 'ACCEPTED')}>
              Approve Sharing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
