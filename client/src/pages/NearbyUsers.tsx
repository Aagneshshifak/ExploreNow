import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNearbyUsers, useSendConnectionRequest, NearbyCandidate } from '../hooks/useNearbyUsers';
import { useNearbySocket } from '../hooks/useNearbySocket';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../hooks/use-auth';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const exactIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const strangerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function NearbyUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Real-time WS connection
  useNearbySocket();
  
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // Data fetching
  const { data: nearbyUsers, isLoading } = useNearbyUsers(position?.[0] ?? null, position?.[1] ?? null);
  const { mutate: sendRequest, isPending: isSendingRequest } = useSendConnectionRequest();

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    );
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

            return (
              <Marker key={candidate.userId} position={markerPos} icon={isFriend ? exactIcon : strangerIcon}>
                <Popup className="min-w-[200px]">
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={candidate.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + candidate.userId} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full border shadow"
                    />
                    <div className="text-center">
                      <strong className="block text-lg">{candidate.username || `User ${candidate.userId}`}</strong>
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
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
