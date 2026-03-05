import { useState } from 'react';
import type { CrowdLevel } from '@shared/schema';
import type { TouristSpot } from '@/lib/touristMapClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MapPin, Users, Calendar, Image as ImageIcon } from 'lucide-react';

interface SpotDetailsPanelProps {
  spot: TouristSpot;
  currentCrowdLevel: CrowdLevel;
  onReportCrowd: (level: CrowdLevel) => void;
  onClose?: () => void;
}

/**
 * SpotDetailsPanel Component
 * 
 * Displays detailed information about a tourist spot including:
 * - Spot information (name, description, images, category)
 * - Current crowd level with color coding
 * - Crowd report submission form
 * 
 * Requirements: 2.3, 3.1, 10.1
 */
export default function SpotDetailsPanel({
  spot,
  currentCrowdLevel,
  onReportCrowd,
  onClose,
}: SpotDetailsPanelProps) {
  const [selectedCrowdLevel, setSelectedCrowdLevel] = useState<CrowdLevel>('low');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle crowd report submission
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onReportCrowd(selectedCrowdLevel);
      setSubmitSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get color for crowd level (Requirement 3.3)
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
        return 'text-green-700';
      case 'medium':
        return 'text-yellow-700';
      case 'high':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
      <Card className="border-0 shadow-none">
        <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {/* Close button for mobile */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:hidden"
            >
              ✕
            </Button>
          )}

          {/* Spot name and category (Requirement 2.3) */}
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 pr-8 lg:pr-0">{spot.name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{spot.city}, {spot.country}</span>
            </CardDescription>
          </div>

          {/* Category badge */}
          <Badge variant="secondary" className="w-fit capitalize text-xs sm:text-sm">
            {spot.category.replace('_', ' ')}
          </Badge>

          {/* Current crowd level (Requirements 3.1, 3.3) */}
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Crowd Level
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getCrowdLevelColor(currentCrowdLevel)}`} />
                <span className={`text-base sm:text-lg font-semibold capitalize ${getCrowdLevelTextColor(currentCrowdLevel)}`}>
                  {currentCrowdLevel}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Images (Requirement 2.3) */}
          {spot.images && spot.images.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 sm:gap-2">
                <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Photos
              </h3>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {spot.images.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${spot.name} - Image ${index + 1}`}
                    className="w-full h-24 sm:h-32 object-cover rounded-lg"
                    onError={(e) => {
                      // Fallback for broken images
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description (Requirement 2.3) */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              About
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {spot.description}
            </p>
          </div>

          {/* Opening Hours */}
          {spot.openingHours && (
            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Opening Hours
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {spot.openingHours}
              </p>
            </div>
          )}

          {/* Best Time to Visit */}
          {spot.bestTimeToVisit && (
            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Best Time to Visit
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {spot.bestTimeToVisit}
              </p>
            </div>
          )}

          {/* Location coordinates */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              Location
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Latitude: {spot.latitude}
              <br />
              Longitude: {spot.longitude}
            </p>
          </div>

          {/* Crowd report submission form (Requirement 10.1) */}
          <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Report Current Crowd Level
              </h3>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Help other travelers by reporting the current crowd level at this location.
            </p>

            <RadioGroup
              value={selectedCrowdLevel}
              onValueChange={(value) => setSelectedCrowdLevel(value as CrowdLevel)}
              className="space-y-1.5 sm:space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <Label htmlFor="low" className="flex items-center gap-1.5 sm:gap-2 cursor-pointer text-xs sm:text-sm">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                  <span>Low - Not crowded</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <Label htmlFor="medium" className="flex items-center gap-1.5 sm:gap-2 cursor-pointer text-xs sm:text-sm">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                  <span>Medium - Moderately busy</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <Label htmlFor="high" className="flex items-center gap-1.5 sm:gap-2 cursor-pointer text-xs sm:text-sm">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                  <span>High - Very crowded</span>
                </Label>
              </div>
            </RadioGroup>

            <Button
              onClick={handleSubmitReport}
              disabled={isSubmitting}
              className="w-full text-xs sm:text-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>

            {/* Success message */}
            {submitSuccess && (
              <div className="p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400">
                  ✓ Thank you! Your report has been submitted successfully.
                </p>
              </div>
            )}

            {/* Error message */}
            {submitError && (
              <div className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
                  {submitError}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
