import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import type { CrowdLevel } from '@shared/schema';
import type { TouristSpot } from '@/lib/touristMapClient';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapDisplayProps {
  spots: TouristSpot[];
  currentCrowdLevels: Record<number, CrowdLevel>;
  onSpotClick: (spotId: number) => void;
  center?: [number, number];
  zoom?: number;
}

/**
 * MapDisplay Component
 * 
 * Renders an interactive Leaflet map with OpenStreetMap tiles showing tourist spots.
 * Features:
 * - Color-coded markers based on crowd levels (green=low, yellow=medium, red=high)
 * - Marker clustering for performance with large datasets
 * - Click handlers for spot selection
 * - Responsive map that adapts to container size
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 12.4
 */
export default function MapDisplay({
  spots,
  currentCrowdLevels,
  onSpotClick,
  center = [40.7128, -74.0060], // Default to New York
  zoom = 12,
}: MapDisplayProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  // Initialize map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance with OpenStreetMap tiles (Requirement 5.1)
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initialize marker cluster group for performance (Requirement 12.4)
    // Optimized for 100+ spots with custom cluster icon styling
    const markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50, // Cluster markers within 50px radius
      spiderfyOnMaxZoom: true, // Spread out markers at max zoom
      showCoverageOnHover: false, // Don't show cluster coverage polygon
      zoomToBoundsOnClick: true, // Zoom to cluster bounds on click
      disableClusteringAtZoom: 18, // Disable clustering at street level
      chunkedLoading: true, // Load markers in chunks for better performance
      chunkInterval: 200, // Process markers every 200ms
      chunkDelay: 50, // Delay between chunks
      iconCreateFunction: (cluster) => {
        const markers = cluster.getAllChildMarkers();
        const count = markers.length;
        
        // Calculate average crowd level for the cluster
        let lowCount = 0;
        let mediumCount = 0;
        let highCount = 0;
        
        markers.forEach((marker: any) => {
          const crowdLevel = marker.options.crowdLevel;
          if (crowdLevel === 'low') lowCount++;
          else if (crowdLevel === 'medium') mediumCount++;
          else if (crowdLevel === 'high') highCount++;
        });
        
        // Determine dominant crowd level
        let dominantLevel: 'low' | 'medium' | 'high' = 'medium';
        let dominantColor = '#eab308'; // yellow
        
        if (highCount > lowCount && highCount > mediumCount) {
          dominantLevel = 'high';
          dominantColor = '#ef4444'; // red
        } else if (lowCount > mediumCount && lowCount > highCount) {
          dominantLevel = 'low';
          dominantColor = '#22c55e'; // green
        }
        
        // Size clusters based on marker count
        let size = 40;
        let className = 'marker-cluster-small';
        
        if (count >= 100) {
          size = 60;
          className = 'marker-cluster-large';
        } else if (count >= 50) {
          size = 50;
          className = 'marker-cluster-medium';
        }
        
        return L.divIcon({
          html: `
            <div style="
              background-color: ${dominantColor};
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              font-weight: bold;
              color: white;
              font-size: ${size > 50 ? '18px' : '14px'};
            ">
              ${count}
            </div>
          `,
          className: `marker-cluster ${className}`,
          iconSize: L.point(size, size),
        });
      },
    });

    map.addLayer(markerClusterGroup);

    mapRef.current = map;
    markerClusterGroupRef.current = markerClusterGroup;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerClusterGroupRef.current = null;
      }
    };
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers when spots or crowd levels change
  useEffect(() => {
    if (!mapRef.current || !markerClusterGroupRef.current) return;

    const markerClusterGroup = markerClusterGroupRef.current;

    // Clear existing markers
    markerClusterGroup.clearLayers();

    // Add markers for each spot (Requirements 5.2, 5.3, 5.4)
    spots.forEach((spot) => {
      const lat = typeof spot.latitude === 'string' ? parseFloat(spot.latitude) : spot.latitude;
      const lon = typeof spot.longitude === 'string' ? parseFloat(spot.longitude) : spot.longitude;

      // Get crowd level for this spot
      const crowdLevel = currentCrowdLevels[spot.id] || 'low';

      // Create color-coded marker icon based on crowd level (Requirement 5.3)
      const markerColor = getCrowdLevelColor(crowdLevel);
      const icon = createColoredIcon(markerColor);

      // Create marker at spot coordinates (Requirement 5.2)
      const marker = L.marker([lat, lon], { 
        icon,
        crowdLevel: crowdLevel, // Store crowd level for cluster calculation
      } as any);

      // Add popup with spot name and crowd level
      marker.bindPopup(`
        <div style="min-width: 150px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${spot.name}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${spot.category}</p>
          <p style="margin: 0; font-size: 12px;">
            <span style="font-weight: 500;">Crowd Level:</span> 
            <span style="color: ${markerColor}; font-weight: 600; text-transform: capitalize;">${crowdLevel}</span>
          </p>
        </div>
      `);

      // Add click handler (Requirement 5.4)
      marker.on('click', () => {
        onSpotClick(spot.id);
      });

      // Add marker to cluster group
      markerClusterGroup.addLayer(marker);
    });
  }, [spots, currentCrowdLevels, onSpotClick]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-md"
      style={{ zIndex: 0 }}
    />
  );
}

/**
 * Get color for crowd level
 * Requirement 3.3: Color coding (green for Low, yellow for Medium, red for High)
 */
function getCrowdLevelColor(crowdLevel: CrowdLevel): string {
  switch (crowdLevel) {
    case 'low':
      return '#22c55e'; // green
    case 'medium':
      return '#eab308'; // yellow
    case 'high':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray for unknown
  }
}

/**
 * Create a colored marker icon using SVG
 * This creates a custom marker with the specified color
 */
function createColoredIcon(color: string): L.DivIcon {
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.125 12.5 28.125S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z" 
            fill="${color}" 
            stroke="#fff" 
            stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}
