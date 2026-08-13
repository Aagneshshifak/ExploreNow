import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface MapRoutingProps {
  source: [number, number];
  destination: [number, number];
}

export default function MapRouting({ source, destination }: MapRoutingProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create a plan with custom marker suppression (we have our own markers)
    const plan = L.Routing.plan([
      L.latLng(source[0], source[1]),
      L.latLng(destination[0], destination[1])
    ], {
      createMarker: () => false,
      draggableWaypoints: false,
      addWaypoints: false,
    });

    // Create a routing control instance
    const routingControl = L.Routing.control({
      plan,
      routeWhileDragging: false,
      addWaypoints: false, // Don't let users drag to add new waypoints
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 4, opacity: 0.8 }], // Blue line
        extendToWaypoints: true,
        missingRouteTolerance: 10
      },
      // Disable the text directions panel for a cleaner UI (Google Maps style overview)
      show: false,
    }).addTo(map);

    // Clean up routing control on unmount or when points change
    return () => {
      if (map && routingControl) {
        try {
          map.removeControl(routingControl);
        } catch (e) {
          // Ignore removal errors if map is already unmounting
        }
      }
    };
  }, [map, source, destination]);

  return null;
}
