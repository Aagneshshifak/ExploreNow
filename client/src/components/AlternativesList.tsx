import type { CrowdLevel } from '@shared/schema';
import type { TouristSpot } from '@/lib/touristMapClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Users } from 'lucide-react';

interface AlternativesListProps {
  alternatives: Array<TouristSpot & { distance?: number; currentCrowdLevel?: CrowdLevel }>;
  onAlternativeClick: (spotId: number) => void;
}

/**
 * AlternativesList Component
 * 
 * Displays alternative tourist spots with lower crowd levels.
 * Features:
 * - Shows alternative spots with distance and crowd level
 * - Color-coded crowd level indicators
 * - Click handlers to navigate to alternatives
 * 
 * Requirements: 7.1, 7.2, 7.3
 */
export default function AlternativesList({
  alternatives,
  onAlternativeClick,
}: AlternativesListProps) {
  // Get color for crowd level (Requirement 7.3)
  const getCrowdLevelColor = (level: CrowdLevel): string => {
    switch (level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCrowdLevelTextColor = (level: CrowdLevel): string => {
    switch (level) {
      case 'low':
        return 'text-green-700 dark:text-green-400';
      case 'medium':
        return 'text-yellow-700 dark:text-yellow-400';
      case 'high':
        return 'text-red-700 dark:text-red-400';
      default:
        return 'text-gray-700 dark:text-gray-400';
    }
  };

  // Format distance for display
  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  };

  // If no alternatives, show empty state
  if (alternatives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Alternative Spots
          </CardTitle>
          <CardDescription>
            Less crowded alternatives nearby
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No alternative spots available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
          Alternative Spots
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Less crowded alternatives nearby
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3">
          {alternatives.map((alternative) => (
            <div
              key={alternative.id}
              className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              {/* Spot name and category */}
              <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1 truncate">
                    {alternative.name}
                  </h4>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {alternative.category.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{alternative.city}, {alternative.country}</span>
              </div>

              {/* Distance and crowd level (Requirements 7.2, 7.3) */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                {/* Distance */}
                {alternative.distance !== undefined && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDistance(alternative.distance)} away
                    </span>
                  </div>
                )}

                {/* Crowd level */}
                {alternative.currentCrowdLevel && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${getCrowdLevelColor(alternative.currentCrowdLevel)}`} />
                      <span className={`text-xs sm:text-sm font-medium capitalize ${getCrowdLevelTextColor(alternative.currentCrowdLevel)}`}>
                        {alternative.currentCrowdLevel}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* View button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs sm:text-sm"
                onClick={() => onAlternativeClick(alternative.id)}
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
