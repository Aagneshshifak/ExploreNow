/**
 * Tourist Map Routes
 * 
 * REST API endpoints for the Tourist & Crowd Map feature
 * 
 * Endpoints:
 * - GET /location - Detect user location from IP
 * - GET /locations - Get list of supported locations
 * - GET /spots - Get tourist spots with filtering
 * - GET /spots/:id - Get detailed spot information
 * - GET /spots/:id/predictions - Get crowd predictions
 * - GET /spots/:id/alternatives - Get alternative recommendations
 * - POST /spots/:id/report - Submit crowd report
 * 
 * Requirements: 1.1, 1.2, 4.1, 7.1, 10.1
 */

import express, { Request, Response } from 'express';
import { locationService } from '../services/locationService';
import { touristSpotService } from '../services/touristSpotService';
import { crowdPredictionService } from '../services/crowdPredictionService';
import { crowdReportService } from '../services/crowdReportService';
import { placesService } from '../services/placesService';
import { requireUser } from '../middleware';
import type { Category, CrowdLevel } from '@shared/schema';

const router = express.Router();

/**
 * GET /api/tourist-map/location
 * Detect user location from IP address OR accept GPS coordinates
 * 
 * Query params (optional):
 * - lat: Latitude from GPS
 * - lon: Longitude from GPS
 * 
 * Response: { country: string, city: string, coordinates: { latitude: number, longitude: number } }
 */
router.get('/location', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;
    
    // If GPS coordinates are provided, use reverse geocoding
    if (lat && lon) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Invalid coordinates provided'
        });
      }
      
      try {
        // Use Nominatim (OpenStreetMap) for reverse geocoding - FREE, no API key needed
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
        const response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'ExploreNow-TouristMap/1.0' // Required by Nominatim
          }
        });
        
        if (!response.ok) {
          throw new Error('Reverse geocoding failed');
        }
        
        const data = await response.json();
        
        const city = data.address?.city || 
                     data.address?.town || 
                     data.address?.village || 
                     data.address?.municipality ||
                     data.address?.county ||
                     'Unknown';
        const country = data.address?.country || 'Unknown';
        
        return res.json({
          success: true,
          data: {
            country,
            city,
            coordinates: {
              latitude,
              longitude
            }
          },
          message: 'Location detected from GPS coordinates'
        });
      } catch (geoError) {
        console.error('Reverse geocoding error:', geoError);
        return res.status(500).json({
          success: false,
          data: null,
          message: 'Failed to determine location from coordinates'
        });
      }
    }
    
    // Fallback: Get IP address from request for IP-based geolocation
    let ipAddress = req.ip || req.headers['x-forwarded-for'] as string || '8.8.8.8';
    
    // Handle localhost/development environment
    if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === 'localhost' || ipAddress.startsWith('::ffff:127.')) {
      console.log('Localhost detected, using fallback location');
      return res.json({
        success: true,
        data: {
          country: 'United States',
          city: 'New York',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        message: 'Location detected successfully (development mode)'
      });
    }
    
    const location = await locationService.detectLocation(ipAddress);
    
    res.json({
      success: true,
      data: location,
      message: 'Location detected successfully'
    });
  } catch (error) {
    console.error('Location detection error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to detect location'
    });
  }
});

/**
 * GET /api/tourist-map/locations
 * Get list of supported locations for manual selection
 * Dynamically fetches unique city/country combinations from the database
 * 
 * Response: Array of { country: string, city: string }
 */
router.get('/locations', async (req: Request, res: Response) => {
  try {
    // Dynamically fetch unique city/country combinations from tourist spots database
    const uniqueLocations = await touristSpotService.getUniqueLocations();
    
    res.json({
      success: true,
      data: uniqueLocations,
      message: 'Supported locations retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch supported locations'
    });
  }
});

/**
 * GET /api/tourist-map/spots/nearby
 * Get nearby tourist spots based on GPS coordinates
 * Now uses dynamic data from OpenStreetMap via Overpass API
 * 
 * Query params:
 * - lat (required): Latitude
 * - lon (required): Longitude  
 * - radius (optional): Search radius in kilometers (default: 10km, max: 50km)
 * - category (optional): Category filter
 * - limit (optional): Number of results (default: 20, max: 100)
 * - useDynamic (optional): Use dynamic data from OSM (default: true)
 * 
 * Response: Array of tourist spots sorted by distance
 */
router.get('/spots/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lon, radius, category, limit, useDynamic } = req.query;
    
    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Latitude and longitude are required parameters'
      });
    }
    
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    const searchRadius = Math.min(50, parseFloat(radius as string) || 10); // Default 10km, max 50km
    const resultLimit = Math.min(100, parseInt(limit as string) || 20);
    const shouldUseDynamic = useDynamic !== 'false'; // Default to true
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid coordinates'
      });
    }
    
    let nearbySpots: any[] = [];
    
    if (shouldUseDynamic) {
      // Fetch dynamic spots from OpenStreetMap
      console.log(`Fetching dynamic places from OSM for ${latitude}, ${longitude}`);
      const dynamicSpots = await placesService.fetchNearbyPlaces(
        latitude,
        longitude,
        searchRadius,
        category as Category | undefined
      );
      
      // Enrich with crowd levels (simulate realistic crowd levels based on time and category)
      const currentHour = new Date().getHours();
      nearbySpots = await Promise.all(
        dynamicSpots.slice(0, resultLimit).map(async (spot, index) => {
          // Simulate crowd levels based on time of day and category
          let currentCrowdLevel: CrowdLevel = 'low';
          
          // Peak hours logic (9 AM - 12 PM and 5 PM - 8 PM)
          const isPeakHours = (currentHour >= 9 && currentHour <= 12) || (currentHour >= 17 && currentHour <= 20);
          
          // Weekend logic (higher crowds on weekends)
          const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
          
          // Category-based crowd patterns
          if (spot.category === 'market' || spot.category === 'religious_site') {
            // Markets and temples are busier during peak hours
            if (isPeakHours) {
              currentCrowdLevel = isWeekend ? 'high' : 'medium';
            } else {
              currentCrowdLevel = 'low';
            }
          } else if (spot.category === 'park' || spot.category === 'viewpoint') {
            // Parks are busier on weekends
            if (isWeekend) {
              currentCrowdLevel = isPeakHours ? 'high' : 'medium';
            } else {
              currentCrowdLevel = isPeakHours ? 'medium' : 'low';
            }
          } else if (spot.category === 'museum') {
            // Museums have moderate crowds
            currentCrowdLevel = isWeekend ? 'medium' : 'low';
          } else {
            // Random distribution for variety (for demo purposes)
            const crowdLevels: CrowdLevel[] = ['low', 'medium', 'high'];
            currentCrowdLevel = crowdLevels[index % 3];
          }
          
          return {
            id: `dynamic-${spot.latitude}-${spot.longitude}`, // Temporary ID
            ...spot,
            images: spot.images.slice(0, 3),
            currentCrowdLevel,
            distance: 0, // Distance calculation would be done client-side
          };
        })
      );
    } else {
      // Use database spots (original behavior)
      const dbSpots = await touristSpotService.getNearbySpots(
        { latitude, longitude },
        searchRadius,
        category as Category | undefined,
        resultLimit
      );
      
      // Enrich spots with current crowd levels
      nearbySpots = await Promise.all(
        dbSpots.map(async (spot) => {
          try {
            const currentCrowdLevel = await crowdPredictionService.getCurrentCrowdLevel(spot.id);
            return {
              ...spot,
              images: spot.images ? spot.images.slice(0, 3) : [],
              currentCrowdLevel
            };
          } catch (error) {
            console.error(`Failed to get crowd level for spot ${spot.id}:`, error);
            return {
              ...spot,
              images: spot.images ? spot.images.slice(0, 3) : [],
              currentCrowdLevel: 'medium' as CrowdLevel
            };
          }
        })
      );
    }
    
    res.json({
      success: true,
      data: nearbySpots,
      message: `Found ${nearbySpots.length} tourist spots within ${searchRadius}km${shouldUseDynamic ? ' (dynamic data from OpenStreetMap)' : ''}`
    });
  } catch (error) {
    console.error('Error fetching nearby spots:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to fetch nearby spots'
    });
  }
});

/**
 * GET /api/tourist-map/spots
 * Get tourist spots filtered by location and optional filters
 * 
 * Query params:
 * - country (required): Country name
 * - city (required): City name
 * - category (optional): Category filter (museum, beach, monument, park, religious_site, market, viewpoint)
 * - crowdLevel (optional): Crowd level filter (low, medium, high)
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Number of results per page (default: 20, max: 100)
 * 
 * Response: Paginated array of tourist spots with current crowd levels
 */
router.get('/spots', async (req: Request, res: Response) => {
  try {
    const { country, city, category, crowdLevel, page, limit } = req.query;
    
    // Validate required parameters
    if (!country || !city) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Country and city are required parameters'
      });
    }
    
    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    
    // Get spots from service with pagination
    const result = await touristSpotService.getSpotsByLocation(
      country as string,
      city as string,
      category as Category | undefined,
      crowdLevel as CrowdLevel | undefined,
      pageNum,
      limitNum
    );
    
    // Enrich spots with current crowd levels
    const spotsWithCrowdLevels = await Promise.all(
      result.spots.map(async (spot) => {
        try {
          const currentCrowdLevel = await crowdPredictionService.getCurrentCrowdLevel(spot.id);
          // Limit images to first 3 URLs to reduce response size
          return {
            ...spot,
            images: spot.images ? spot.images.slice(0, 3) : [],
            currentCrowdLevel
          };
        } catch (error) {
          console.error(`Failed to get crowd level for spot ${spot.id}:`, error);
          return {
            ...spot,
            images: spot.images ? spot.images.slice(0, 3) : [],
            currentCrowdLevel: 'medium' as CrowdLevel // Default fallback
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: spotsWithCrowdLevels,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
        hasMore: pageNum * limitNum < result.total
      },
      message: 'Tourist spots retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching tourist spots:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to fetch tourist spots'
    });
  }
});

/**
 * GET /api/tourist-map/spots/:id
 * Get detailed information for a specific tourist spot
 * 
 * Response: Tourist spot with all details and current crowd level
 */
router.get('/spots/:id', async (req: Request, res: Response) => {
  try {
    const spotId = parseInt(req.params.id, 10);
    
    if (isNaN(spotId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid spot ID'
      });
    }
    
    // Get spot details
    const spot = await touristSpotService.getSpotDetails(spotId);
    
    // Get current crowd level
    let currentCrowdLevel: CrowdLevel = 'medium';
    try {
      currentCrowdLevel = await crowdPredictionService.getCurrentCrowdLevel(spotId);
    } catch (error) {
      console.error(`Failed to get crowd level for spot ${spotId}:`, error);
    }
    
    // Limit images to first 5 URLs for details view
    const optimizedSpot = {
      ...spot,
      images: spot.images ? spot.images.slice(0, 5) : [],
      currentCrowdLevel
    };
    
    res.json({
      success: true,
      data: optimizedSpot,
      message: 'Spot details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching spot details:', error);
    
    if (error instanceof Error && error.message === 'Tourist spot not found') {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Tourist spot not found'
      });
    }
    
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch spot details'
    });
  }
});

/**
 * GET /api/tourist-map/spots/:id/predictions
 * Get crowd predictions for the next 24 hours
 * 
 * Query params:
 * - hours (optional): Number of hours to predict (default: 24)
 * 
 * Response: Array of hourly predictions with crowd level and confidence
 */
router.get('/spots/:id/predictions', async (req: Request, res: Response) => {
  try {
    const spotId = parseInt(req.params.id, 10);
    const hours = parseInt(req.query.hours as string) || 24;
    
    if (isNaN(spotId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid spot ID'
      });
    }
    
    if (hours < 1 || hours > 168) { // Max 1 week
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Hours must be between 1 and 168'
      });
    }
    
    // Get predictions
    const predictions = await crowdPredictionService.predictCrowdLevels(
      spotId,
      new Date(),
      hours
    );
    
    res.json({
      success: true,
      data: predictions,
      message: 'Predictions retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to fetch predictions'
    });
  }
});

/**
 * GET /api/tourist-map/spots/:id/alternatives
 * Get alternative less-crowded spots in the same category
 * 
 * Response: Array of alternative spots with distance and crowd level
 */
router.get('/spots/:id/alternatives', async (req: Request, res: Response) => {
  try {
    const spotId = parseInt(req.params.id, 10);
    
    if (isNaN(spotId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid spot ID'
      });
    }
    
    // Get original spot details
    const originalSpot = await touristSpotService.getSpotDetails(spotId);
    
    // Get alternatives
    const alternatives = await touristSpotService.getAlternatives(
      spotId,
      originalSpot.category as Category,
      originalSpot.country,
      originalSpot.city,
      {
        latitude: parseFloat(originalSpot.latitude as string),
        longitude: parseFloat(originalSpot.longitude as string)
      }
    );
    
    // Enrich alternatives with current crowd levels
    const alternativesWithCrowdLevels = await Promise.all(
      alternatives.map(async (alt) => {
        try {
          const currentCrowdLevel = await crowdPredictionService.getCurrentCrowdLevel(alt.id);
          // Limit images to first 2 URLs for alternatives list
          return {
            ...alt,
            images: alt.images ? alt.images.slice(0, 2) : [],
            currentCrowdLevel
          };
        } catch (error) {
          console.error(`Failed to get crowd level for alternative ${alt.id}:`, error);
          return {
            ...alt,
            images: alt.images ? alt.images.slice(0, 2) : [],
            currentCrowdLevel: 'medium' as CrowdLevel
          };
        }
      })
    );
    
    // Filter to only show alternatives with lower crowd levels than original
    const originalCrowdLevel = await crowdPredictionService.getCurrentCrowdLevel(spotId);
    const crowdLevelOrder: Record<CrowdLevel, number> = { low: 0, medium: 1, high: 2 };
    
    const lowerCrowdAlternatives = alternativesWithCrowdLevels.filter(
      alt => crowdLevelOrder[alt.currentCrowdLevel || 'medium'] < crowdLevelOrder[originalCrowdLevel]
    );
    
    res.json({
      success: true,
      data: lowerCrowdAlternatives,
      message: 'Alternative spots retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching alternatives:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to fetch alternatives'
    });
  }
});

/**
 * POST /api/tourist-map/spots/:id/report
 * Submit a crowd report for a tourist spot
 * Requires authentication
 * 
 * Body:
 * - crowdLevel (required): 'low', 'medium', or 'high'
 * - userLocation (required): { latitude: number, longitude: number }
 * 
 * Response: { success: boolean }
 */
router.post('/spots/:id/report', requireUser, async (req: Request, res: Response) => {
  try {
    const spotId = parseInt(req.params.id, 10);
    const { crowdLevel, userLocation } = req.body;
    
    // Validate spot ID
    if (isNaN(spotId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid spot ID'
      });
    }
    
    // Validate crowd level
    if (!crowdLevel || !['low', 'medium', 'high'].includes(crowdLevel)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid crowd level. Must be low, medium, or high'
      });
    }
    
    // Validate user location
    if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid user location. Must include latitude and longitude'
      });
    }
    
    // Validate coordinate ranges
    if (userLocation.latitude < -90 || userLocation.latitude > 90) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid latitude. Must be between -90 and 90'
      });
    }
    
    if (userLocation.longitude < -180 || userLocation.longitude > 180) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid longitude. Must be between -180 and 180'
      });
    }
    
    // Submit report
    const reportId = await crowdReportService.submitReport({
      userId: req.user!.id,
      spotId,
      crowdLevel: crowdLevel as CrowdLevel,
      userLocation
    });
    
    res.json({
      success: true,
      data: { reportId },
      message: 'Crowd report submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting crowd report:', error);
    
    // Handle proximity validation error
    if (error instanceof Error && error.message.includes('within 1km')) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to submit crowd report'
    });
  }
});

export default router;
