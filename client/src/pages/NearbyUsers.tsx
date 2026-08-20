import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNearbyUsers, useSendConnectionRequest, NearbyCandidate } from '../hooks/useNearbyUsers';
import { useNearbySocket } from '../hooks/useNearbySocket';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../hooks/use-auth';
import MapRouting from '../components/MapRouting';
import { X, Send, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Robust inline SVG icons to prevent broken image links
const exactIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px; filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.3));"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`,
  className: 'bg-transparent border-0',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const strangerIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#94a3b8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px; filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.3));"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`,
  className: 'bg-transparent border-0',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export default function NearbyUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Real-time WS connection
  const { isConnected, sendMessage, messages } = useNearbySocket();
  const [activeChatUser, setActiveChatUser] = useState<NearbyCandidate | null>(null);
  const [chatInput, setChatInput] = useState('');
  
  // Initialize from sessionStorage cache for instant render on reload
  const [position, setPosition] = useState<[number, number] | null>(() => {
    const cached = sessionStorage.getItem('lastKnownPosition');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch { /* ignore */ }
    }
    return null;
  });
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // Data fetching
  const { data: nearbyUsers, isLoading } = useNearbyUsers(position?.[0] ?? null, position?.[1] ?? null);
  const { mutate: sendRequest, isPending: isSendingRequest } = useSendConnectionRequest();

  // Use watchPosition for continuous GPS updates (prompted only once per session)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        // Cache for instant reload
        sessionStorage.setItem('lastKnownPosition', JSON.stringify(newPos));
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleConnect = (candidateId: string) => {
    if (!user) return;
    sendRequest({ senderId: user.id.toString(), receiverId: candidateId }, {
      onSuccess: () => {
        toast({ title: 'Request Sent!', description: 'Waiting for their approval to unlock live map sharing.' });
      },
      onError: (err) => {
        toast({ title: 'Failed to send request', description: err.message, variant: 'destructive' });
      }
    });
  };

  // Helper to generate a dummy coordinate in an approximate radius for strangers
  const getFuzzyCoordinate = (lat: number, lng: number, distanceMeters: number): [number, number] => {
    // 1 degree lat is approx 111km.
    const offset = (distanceMeters / 111000); 
    // Randomize angle
    const angle = Math.random() * Math.PI * 2;
    return [
      lat + (offset * Math.cos(angle)),
      lng + (offset * Math.sin(angle))
    ];
  };

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !activeChatUser) return;
    sendMessage(activeChatUser.userId, chatInput);
    setChatInput('');
  };

  if (geoError) return <div className="p-8 text-center text-red-500">Error: {geoError}</div>;
  if (!position) return <div className="p-8 text-center text-gray-500">Acquiring GPS location...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full">
      <div className="bg-primary/5 p-4 border-b flex justify-between items-center z-10 relative">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nearby Users</h1>
          <p className="text-sm text-muted-foreground">Discover other travelers near you</p>
        </div>
        {isLoading && <span className="text-sm text-blue-500 animate-pulse">Scanning area...</span>}
      </div>

      <div className="flex-grow w-full relative z-0">
        <MapContainer center={position} zoom={14} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {/* My Location */}
          <Circle center={position} radius={50} pathOptions={{ color: 'blue', fillColor: 'blue' }} />
          <Marker position={position}>
            <Popup>You are here</Popup>
          </Marker>

          {/* Nearby Candidates */}
          {nearbyUsers?.map((candidate: NearbyCandidate) => {
            const isFriend = candidate.isConnected;
            
            // If connected, we have exact GPS. If not, generate a visual jitter in UI.
            const markerPos = isFriend && candidate.exactLatitude && candidate.exactLongitude
              ? [candidate.exactLatitude, candidate.exactLongitude] as [number, number]
              : getFuzzyCoordinate(position[0], position[1], candidate.approximateDistanceMeters);

            const displayName = candidate.username || 'Unknown Tourist';
            const firstLetter = displayName.charAt(0).toUpperCase();
            // Generate a consistent color from the username
            const hue = displayName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
            const avatarBgColor = `hsl(${hue}, 55%, 50%)`;
            const hasAvatar = candidate.avatarUrl && candidate.avatarUrl.length > 0;

            return (
              <React.Fragment key={candidate.userId}>
                <Marker position={markerPos} icon={isFriend ? exactIcon : strangerIcon}>
                  <Popup className="min-w-[200px]">
                    <div className="flex flex-col items-center gap-3">
                      {hasAvatar ? (
                        <img 
                          src={candidate.avatarUrl} 
                          alt={displayName}
                          onError={(e) => {
                            // Hide broken image — the fallback letter will show via parent
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          className="w-16 h-16 rounded-full border shadow object-cover"
                        />
                      ) : null}
                      {/* First-letter avatar fallback (shown when no avatarUrl or image fails) */}
                      <div 
                        className="w-16 h-16 rounded-full border shadow flex items-center justify-center text-white text-2xl font-bold"
                        style={{ 
                          backgroundColor: avatarBgColor,
                          display: hasAvatar ? 'none' : 'flex'
                        }}
                      >
                        {firstLetter}
                      </div>
                      <div className="text-center">
                        <strong className="block text-lg">{displayName}</strong>
                        <span className="text-sm text-gray-500">
                          {isFriend ? 'Exact Match 📍' : `~${candidate.approximateDistanceMeters}m away`}
                        </span>
                      </div>
                      
                      {!isFriend && (
                        <Button 
                          size="sm" 
                          onClick={() => handleConnect(candidate.userId)}
                          disabled={isSendingRequest}
                          className="w-full mt-2"
                        >
                          Send Request
                        </Button>
                      )}
                      
                      {isFriend && (
                        <Button
                          size="sm"
                          onClick={() => setActiveChatUser(candidate)}
                          className="w-full mt-2"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      )}
                    </div>
                  </Popup>
                </Marker>
                
                {/* Draw Directions Route if Friend */}
                {isFriend && (
                  <MapRouting source={position} destination={markerPos} />
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Floating Chat Modal */}
      {activeChatUser && (
        <div className="absolute bottom-4 right-4 w-80 h-96 bg-background border rounded-lg shadow-2xl flex flex-col z-[1000] overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
            <div className="font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              {activeChatUser.username || 'Unknown Tourist'}
            </div>
            <button onClick={() => setActiveChatUser(null)} className="hover:bg-primary-foreground/20 p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-muted/20">
            {messages.filter(m => m.from === activeChatUser.userId || m.from === user?.id.toString()).length === 0 ? (
              <div className="text-center text-sm text-muted-foreground my-auto">
                No messages yet. Say hi!
              </div>
            ) : (
              messages
                .filter(m => m.from === activeChatUser.userId || m.to === activeChatUser.userId || (m.from === user?.id.toString() && !m.to)) // Handle simple logic
                .map((msg, i) => {
                  const isMe = msg.from === user?.id.toString();
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-2 rounded-lg text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          
          {/* Input */}
          <form onSubmit={handleSendChat} className="p-3 bg-background border-t flex gap-2">
            <Input 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 text-sm"
            />
            <Button type="submit" size="icon" disabled={!chatInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
