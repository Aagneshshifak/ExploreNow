import { useEffect, useState } from 'react';
import { MapPin, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface Location {
  country: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface LocationSelectorProps {
  detectedLocation: Location | null;
  onLocationChange: (location: Location) => void;
  isManual: boolean;
}

/**
 * LocationSelector Component
 * 
 * Displays detected location and provides manual location selection.
 * Features:
 * - Shows automatically detected location from IP geolocation
 * - Provides dropdown for manual location selection
 * - Fetches supported locations from API
 * - Handles location change events
 * 
 * Requirements: 1.1, 1.3, 1.4
 */
export default function LocationSelector({
  detectedLocation,
  onLocationChange,
  isManual,
}: LocationSelectorProps) {
  const [supportedLocations, setSupportedLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showManualSelector, setShowManualSelector] = useState(isManual);

  // Fetch supported locations from API (Requirement 1.3, 1.4)
  useEffect(() => {
    const fetchSupportedLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const response = await fetch('/api/tourist-map/locations');
        const data = await response.json();
        
        if (data.success && data.data) {
          setSupportedLocations(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch supported locations:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchSupportedLocations();
  }, []);

  // Set initial selected location when detected location changes
  useEffect(() => {
    if (detectedLocation && !isManual) {
      const locationKey = `${detectedLocation.country}|${detectedLocation.city}`;
      setSelectedLocation(locationKey);
    }
  }, [detectedLocation, isManual]);

  // Auto-switch to manual mode if no location is detected
  useEffect(() => {
    if (!detectedLocation && !showManualSelector) {
      setShowManualSelector(true);
    }
  }, [detectedLocation, showManualSelector]);

  // Handle manual location selection (Requirement 1.4)
  const handleLocationSelect = (value: string) => {
    setSelectedLocation(value);
    const [country, city] = value.split('|');
    
    const location: Location = {
      country,
      city,
    };
    
    onLocationChange(location);
  };

  // Toggle between detected and manual selection
  const handleToggleManual = () => {
    setShowManualSelector(!showManualSelector);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Your Location</h3>
            </div>
            
            {/* Toggle button for manual selection (Requirement 1.3) */}
            {detectedLocation && !showManualSelector && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleManual}
              >
                Change Location
              </Button>
            )}
          </div>

          {/* Display detected location (Requirement 1.1) */}
          {detectedLocation && !showManualSelector ? (
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Detected Location</p>
                <p className="text-base font-medium mt-1">
                  {detectedLocation.city}, {detectedLocation.country}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          ) : (
            /* Manual location dropdown (Requirement 1.3, 1.4) */
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Select a location manually
              </label>
              
              {isLoadingLocations ? (
                <div className="flex items-center justify-center p-4 border rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading locations...
                  </span>
                </div>
              ) : (
                <Select
                  value={selectedLocation}
                  onValueChange={handleLocationSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a city..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {supportedLocations.map((location) => {
                      const locationKey = `${location.country}|${location.city}`;
                      return (
                        <SelectItem key={locationKey} value={locationKey}>
                          {location.city}, {location.country}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}

              {/* Show option to use detected location if available */}
              {detectedLocation && showManualSelector && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleManual}
                  className="w-full mt-2"
                >
                  Use detected location ({detectedLocation.city}, {detectedLocation.country})
                </Button>
              )}
            </div>
          )}

          {/* Info message when location detection fails (Requirement 1.3) */}
          {!detectedLocation && !showManualSelector && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                We couldn't detect your location automatically. Please select a location manually.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
