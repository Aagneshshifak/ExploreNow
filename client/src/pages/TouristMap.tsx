import { useState, useMemo, useEffect } from 'react';
import type { Category, CrowdLevel } from '@shared/schema';
import LocationSelector from '@/components/LocationSelector';
import MapDisplay from '@/components/MapDisplay';
import MapFilters from '@/components/MapFilters';
import SpotDetailsPanel from '@/components/SpotDetailsPanel';
import CrowdTimeline from '@/components/CrowdTimeline';
import AlternativesList from '@/components/AlternativesList';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  useLocation,
  useSpots,
  useNearbySpots,
  useSpotDetails,
  usePredictions,
  useAlternatives,
  useSubmitReport,
  type Location,
} from '@/hooks/use-tourist-map';

/**
 * TouristMap Page Component
 * 
 * Main page for the Tourist & Crowd Map feature.
 * Integrates all components and manages state for:
 * - User location (detected or manual)
 * - Selected tourist spot
 * - Map filters (categories and crowd levels)
 * - Spot details, predictions, and alternatives
 * 
 * Requirements: All frontend requirements
 */
export default function TouristMap() {
  // State management
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedCrowdLevels, setSelectedCrowdLevels] = useState<CrowdLevel[]>([]);

  // Fetch user location (GPS or IP-based)
  const { data: detectedLocation, isLoading: isLoadingLocation } = useLocation();

  // Set initial location when detected
  useEffect(() => {
    if (detectedLocation && !isManualLocation && !selectedLocation) {
      setSelectedLocation(detectedLocation);
    }
  }, [detectedLocation, isManualLocation, selectedLocation]);

  // Fetch nearby tourist spots if we have GPS coordinates
  const hasGPSCoordinates = selectedLocation?.coordinates !== undefined;
  const {
    data: nearbySpots,
    isLoading: isLoadingNearby,
    error: nearbyError,
  } = useNearbySpots(
    hasGPSCoordinates ? selectedLocation!.coordinates!.latitude : null,
    hasGPSCoordinates ? selectedLocation!.coordinates!.longitude : null,
    50, // Increased to 50km radius to cover entire city/metro area
    selectedCategories.length === 1 ? selectedCategories[0] : undefined
  );

  // Fetch tourist spots by city/country (fallback or when manually selected)
  const {
    data: spotsResponse,
    isLoading: isLoadingSpots,
    error: spotsError,
  } = useSpots(
    selectedLocation?.country || '',
    selectedLocation?.city || '',
    selectedCategories.length > 0 ? undefined : undefined,
    selectedCrowdLevels.length > 0 ? undefined : undefined
  );

  // Use nearby spots if available (GPS-based), otherwise use city-based spots
  const spots = hasGPSCoordinates && nearbySpots ? nearbySpots : (spotsResponse?.spots || []);
  const isLoadingSpotsData = hasGPSCoordinates ? isLoadingNearby : isLoadingSpots;
  const spotsLoadError = hasGPSCoordinates ? nearbyError : spotsError;

  // Apply client-side filtering for multiple categories/crowd levels
  const filteredSpots = useMemo(() => {
    if (!spots) return [];

    let filtered = spots;

    // Filter by categories if any selected
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((spot: any) => selectedCategories.includes(spot.category));
    }

    // Filter by crowd levels if any selected
    if (selectedCrowdLevels.length > 0) {
      filtered = filtered.filter((spot: any) => 
        spot.currentCrowdLevel && selectedCrowdLevels.includes(spot.currentCrowdLevel)
      );
    }

    return filtered;
  }, [spots, selectedCategories, selectedCrowdLevels]);

  // Create crowd levels map for MapDisplay
  const currentCrowdLevels = useMemo(() => {
    const levels: Record<number, CrowdLevel> = {};
    spots.forEach((spot: any) => {
      if (spot.currentCrowdLevel) {
        levels[spot.id] = spot.currentCrowdLevel;
      }
    });
    return levels;
  }, [spots]);

  // Fetch selected spot details
  const {
    data: selectedSpot,
    isLoading: isLoadingSpotDetails,
  } = useSpotDetails(selectedSpotId);

  // Fetch predictions for selected spot
  const {
    data: predictions = [],
    isLoading: isLoadingPredictions,
  } = usePredictions(selectedSpotId, 24);

  // Fetch alternatives for selected spot
  const {
    data: alternatives = [],
    isLoading: isLoadingAlternatives,
  } = useAlternatives(selectedSpotId);

  // Submit crowd report mutation
  const submitReport = useSubmitReport();

  // Handle location change
  const handleLocationChange = (location: Location) => {
    setSelectedLocation(location);
    setIsManualLocation(true);
    setSelectedSpotId(null); // Clear selected spot when location changes
  };

  // Handle spot selection from map
  const handleSpotClick = (spotId: number) => {
    setSelectedSpotId(spotId);
  };

  // Handle crowd report submission
  const handleReportCrowd = async (crowdLevel: CrowdLevel) => {
    if (!selectedSpotId) return;

    // Get user's current location using browser geolocation API
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await submitReport.mutateAsync({
              spotId: selectedSpotId,
              reportData: {
                crowdLevel,
                userLocation: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
              },
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error('Unable to get your location. Please enable location services.'));
        }
      );
    });
  };

  // Calculate map center from selected location or first spot
  const mapCenter: [number, number] = useMemo(() => {
    if (selectedLocation?.coordinates) {
      return [selectedLocation.coordinates.latitude, selectedLocation.coordinates.longitude];
    }
    if (filteredSpots.length > 0) {
      const firstSpot = filteredSpots[0];
      const lat = typeof firstSpot.latitude === 'string' ? parseFloat(firstSpot.latitude) : firstSpot.latitude;
      const lon = typeof firstSpot.longitude === 'string' ? parseFloat(firstSpot.longitude) : firstSpot.longitude;
      return [lat, lon];
    }
    return [40.7128, -74.0060]; // Default to New York
  }, [selectedLocation, filteredSpots]);

  // Loading state
  if (isLoadingLocation) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">Detecting your location...</p>
        </div>
      </div>
    );
  }

  // Error state for location detection
  if (!selectedLocation && !isLoadingLocation) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Select Your Location
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  Please select a location to view tourist spots and crowd information.
                </p>
                <LocationSelector
                  detectedLocation={null}
                  onLocationChange={handleLocationChange}
                  isManual={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If location detection is still loading but we have no location, show the page with manual selector
  if (!selectedLocation && !isLoadingLocation) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Tourist & Crowd Map</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Discover tourist attractions and check real-time crowd levels to plan your visit.
          </p>
        </div>

        {/* Location Selector */}
        <div className="mb-4 sm:mb-6">
          <LocationSelector
            detectedLocation={detectedLocation || null}
            onLocationChange={handleLocationChange}
            isManual={true}
          />
        </div>

        <div className="text-center text-muted-foreground py-12">
          <p>Please select a location to view tourist spots</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header - Responsive text sizing */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Tourist & Crowd Map</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover tourist attractions and check real-time crowd levels to plan your visit.
        </p>
      </div>

      {/* Location Selector */}
      <div className="mb-4 sm:mb-6">
        <LocationSelector
          detectedLocation={detectedLocation || null}
          onLocationChange={handleLocationChange}
          isManual={isManualLocation}
        />
      </div>

      {/* Main Content Grid - Mobile-first responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Sidebar - Filters (stacked on mobile, sidebar on desktop) */}
        <div className="md:col-span-12 lg:col-span-3 order-1">
          <MapFilters
            selectedCategories={selectedCategories}
            selectedCrowdLevels={selectedCrowdLevels}
            onCategoryChange={setSelectedCategories}
            onCrowdLevelChange={setSelectedCrowdLevels}
          />
        </div>

        {/* Center - Map Display (full width on mobile, centered on desktop) */}
        <div className="md:col-span-12 lg:col-span-6 order-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {isLoadingSpotsData ? (
              <div className="flex items-center justify-center h-[300px] sm:h-[400px] lg:h-[500px]">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
                  <p className="text-sm sm:text-base text-muted-foreground">Loading tourist spots...</p>
                </div>
              </div>
            ) : spotsLoadError ? (
              <div className="flex items-center justify-center h-[300px] sm:h-[400px] lg:h-[500px] p-4 sm:p-6">
                <div className="text-center">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-3 sm:mb-4 text-red-500" />
                  <p className="text-sm sm:text-base text-red-600 dark:text-red-400">
                    Failed to load tourist spots. Please try again.
                  </p>
                </div>
              </div>
            ) : filteredSpots.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] sm:h-[400px] lg:h-[500px] p-4 sm:p-6">
                <div className="text-center">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    No tourist spots found for the selected filters.
                  </p>
                  {(selectedCategories.length > 0 || selectedCrowdLevels.length > 0) && (
                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedCrowdLevels([]);
                      }}
                      className="mt-3 sm:mt-4 text-sm sm:text-base text-primary hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
                <MapDisplay
                  spots={filteredSpots}
                  currentCrowdLevels={currentCrowdLevels}
                  onSpotClick={handleSpotClick}
                  center={mapCenter}
                  zoom={12}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Spot Details (stacked on mobile, sidebar on desktop) */}
        <div className="md:col-span-12 lg:col-span-3 order-3">
          {selectedSpotId && selectedSpot ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Spot Details Panel */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {isLoadingSpotDetails ? (
                  <div className="flex items-center justify-center p-6 sm:p-8">
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <SpotDetailsPanel
                    spot={selectedSpot}
                    currentCrowdLevel={selectedSpot.currentCrowdLevel || 'low'}
                    onReportCrowd={handleReportCrowd}
                    onClose={() => setSelectedSpotId(null)}
                  />
                )}
              </div>

              {/* Crowd Timeline */}
              {predictions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Crowd Predictions</h3>
                  {isLoadingPredictions ? (
                    <div className="flex items-center justify-center p-6 sm:p-8">
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <CrowdTimeline
                      spotId={selectedSpotId}
                      predictions={predictions}
                      currentTime={new Date()}
                    />
                  )}
                </div>
              )}

              {/* Alternatives List */}
              {alternatives.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Less Crowded Alternatives</h3>
                  {isLoadingAlternatives ? (
                    <div className="flex items-center justify-center p-6 sm:p-8">
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <AlternativesList
                      alternatives={alternatives}
                      onAlternativeClick={handleSpotClick}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
              <p className="text-center text-sm sm:text-base text-muted-foreground">
                Click on a marker to view spot details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
