/**
 * PlacesService - Dynamically fetch tourist spots from external APIs
 * 
 * Uses Overpass API (OpenStreetMap) to fetch real-time tourist attractions,
 * malls, museums, parks, and other points of interest.
 * 
 * Free API - No API key required
 */

import type { Category } from '@shared/schema';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    tourism?: string;
    amenity?: string;
    shop?: string;
    leisure?: string;
    historic?: string;
    'opening_hours'?: string;
    description?: string;
    wikipedia?: string;
    image?: string;
    website?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface DynamicTouristSpot {
  name: string;
  latitude: number;
  longitude: number;
  category: Category;
  description: string;
  openingHours?: string;
  images: string[];
  source: 'overpass' | 'manual';
}

export class PlacesService {
  private readonly OVERPASS_API = 'https://overpass-api.de/api/interpreter';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private cache: Map<string, { data: DynamicTouristSpot[]; timestamp: number }> = new Map();

  /**
   * Fetch tourist spots dynamically from OpenStreetMap
   * 
   * @param latitude - Center latitude
   * @param longitude - Center longitude
   * @param radiusKm - Search radius in kilometers
   * @param category - Optional category filter
   * @returns Array of tourist spots
   */
  async fetchNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    category?: Category
  ): Promise<DynamicTouristSpot[]> {
    const cacheKey = `${latitude},${longitude},${radiusKm},${category || 'all'}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached places data');
      return cached.data;
    }

    try {
      const radiusMeters = radiusKm * 1000;
      const query = this.buildOverpassQuery(latitude, longitude, radiusMeters, category);
      
      console.log('Fetching places from Overpass API...');
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(this.OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ExploreNow-TouristMap/1.0'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
      }

      const data: OverpassResponse = await response.json();
      const spots = this.parseOverpassResponse(data);
      
      // Cache the results
      this.cache.set(cacheKey, { data: spots, timestamp: Date.now() });
      
      console.log(`Fetched ${spots.length} places from Overpass API`);
      return spots;
    } catch (error) {
      console.error('Error fetching places from Overpass API:', error);
      
      // Return fallback data instead of empty array
      return this.getFallbackPlaces(latitude, longitude, category);
    }
  }

  /**
   * Get fallback places when Overpass API fails
   */
  private getFallbackPlaces(latitude: number, longitude: number, category?: Category): DynamicTouristSpot[] {
    console.log('Using fallback places data');
    
    // Generate some realistic fallback spots based on coordinates
    const fallbackSpots: DynamicTouristSpot[] = [];
    
    // NYC area fallback (if coordinates are around NYC)
    if (latitude > 40.5 && latitude < 41.0 && longitude > -74.5 && longitude < -73.5) {
      const nycSpots = [
        {
          name: 'Central Park',
          latitude: 40.7829,
          longitude: -73.9654,
          category: 'park' as Category,
          description: 'A large public park in Manhattan, New York City.',
          images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'],
          source: 'manual' as const
        },
        {
          name: 'Times Square',
          latitude: 40.7580,
          longitude: -73.9855,
          category: 'viewpoint' as Category,
          description: 'A major commercial intersection and tourist destination.',
          images: ['https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800'],
          source: 'manual' as const
        },
        {
          name: 'Metropolitan Museum of Art',
          latitude: 40.7794,
          longitude: -73.9632,
          category: 'museum' as Category,
          description: 'One of the world\'s largest and most prestigious art museums.',
          images: ['https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800'],
          source: 'manual' as const
        }
      ];
      
      fallbackSpots.push(...nycSpots);
    } else {
      // Generic fallback spots
      const genericSpots = [
        {
          name: 'Local Park',
          latitude: latitude + 0.01,
          longitude: longitude + 0.01,
          category: 'park' as Category,
          description: 'A beautiful local park perfect for relaxation.',
          images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'],
          source: 'manual' as const
        },
        {
          name: 'City Center',
          latitude: latitude - 0.01,
          longitude: longitude - 0.01,
          category: 'viewpoint' as Category,
          description: 'The bustling heart of the city with great views.',
          images: ['https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800'],
          source: 'manual' as const
        }
      ];
      
      fallbackSpots.push(...genericSpots);
    }
    
    // Filter by category if specified
    if (category) {
      return fallbackSpots.filter(spot => spot.category === category);
    }
    
    return fallbackSpots;
  }

  /**
   * Build Overpass QL query based on category
   */
  private buildOverpassQuery(lat: number, lon: number, radius: number, category?: Category): string {
    const around = `around:${radius},${lat},${lon}`;
    
    let filters: string[] = [];
    
    if (!category) {
      // Fetch all tourist attractions
      filters = [
        `node["tourism"](${around});`,
        `way["tourism"](${around});`,
        `node["amenity"="place_of_worship"](${around});`,
        `way["amenity"="place_of_worship"](${around});`,
        `node["shop"="mall"](${around});`,
        `way["shop"="mall"](${around});`,
        `node["leisure"="park"](${around});`,
        `way["leisure"="park"](${around});`,
        `node["historic"](${around});`,
        `way["historic"](${around});`,
      ];
    } else {
      // Category-specific queries
      switch (category) {
        case 'museum':
          filters = [
            `node["tourism"="museum"](${around});`,
            `way["tourism"="museum"](${around});`,
          ];
          break;
        case 'monument':
          filters = [
            `node["historic"="monument"](${around});`,
            `way["historic"="monument"](${around});`,
            `node["tourism"="attraction"]["historic"](${around});`,
            `way["tourism"="attraction"]["historic"](${around});`,
          ];
          break;
        case 'park':
          filters = [
            `node["leisure"="park"](${around});`,
            `way["leisure"="park"](${around});`,
            `node["leisure"="garden"](${around});`,
            `way["leisure"="garden"](${around});`,
          ];
          break;
        case 'religious_site':
          filters = [
            `node["amenity"="place_of_worship"](${around});`,
            `way["amenity"="place_of_worship"](${around});`,
          ];
          break;
        case 'market':
          filters = [
            `node["shop"="mall"](${around});`,
            `way["shop"="mall"](${around});`,
            `node["amenity"="marketplace"](${around});`,
            `way["amenity"="marketplace"](${around});`,
            `node["shop"="supermarket"](${around});`,
            `way["shop"="supermarket"](${around});`,
          ];
          break;
        case 'viewpoint':
          filters = [
            `node["tourism"="viewpoint"](${around});`,
            `way["tourism"="viewpoint"](${around});`,
          ];
          break;
        case 'beach':
          filters = [
            `node["natural"="beach"](${around});`,
            `way["natural"="beach"](${around});`,
          ];
          break;
      }
    }

    return `
      [out:json][timeout:10];
      (
        ${filters.join('\n        ')}
      );
      out center;
    `;
  }

  /**
   * Parse Overpass API response into tourist spots
   */
  private parseOverpassResponse(data: OverpassResponse): DynamicTouristSpot[] {
    const spots: DynamicTouristSpot[] = [];

    for (const element of data.elements) {
      const tags = element.tags;
      if (!tags || !tags.name) continue;

      // Get coordinates
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      if (!lat || !lon) continue;

      // Determine category
      const category = this.determineCategory(tags);
      if (!category) continue;

      // Build description
      const description = this.buildDescription(tags, category);

      // Get images (use placeholder for now, could integrate with Wikimedia Commons API)
      const images = this.getImages(tags, category);

      spots.push({
        name: tags.name,
        latitude: lat,
        longitude: lon,
        category,
        description,
        openingHours: tags['opening_hours'],
        images,
        source: 'overpass',
      });
    }

    return spots;
  }

  /**
   * Determine category from OSM tags
   */
  private determineCategory(tags: OverpassElement['tags']): Category | null {
    if (!tags) return null;

    if (tags.tourism === 'museum') return 'museum';
    if (tags.tourism === 'viewpoint') return 'viewpoint';
    if (tags.historic === 'monument' || tags.historic === 'memorial') return 'monument';
    if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
    if (tags.amenity === 'place_of_worship') return 'religious_site';
    if (tags.shop === 'mall' || tags.amenity === 'marketplace') return 'market';
    if (tags.tourism === 'attraction' && tags.historic) return 'monument';
    if (tags.tourism === 'attraction') return 'viewpoint';

    return null;
  }

  /**
   * Build description from tags
   */
  private buildDescription(tags: OverpassElement['tags'], category: Category): string {
    if (!tags) return `A ${category.replace('_', ' ')} in the area.`;

    const parts: string[] = [];

    if (tags.description) {
      parts.push(tags.description);
    } else {
      // Generate generic description
      parts.push(`A popular ${category.replace('_', ' ')}`);
      
      if (tags.wikipedia) {
        parts.push('with historical significance');
      }
    }

    if (tags.website) {
      parts.push(`Visit ${tags.website} for more information.`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Get images for the spot
   * Uses category-appropriate placeholder images from Unsplash
   */
  private getImages(tags: OverpassElement['tags'], category: Category): string[] {
    // If there's a specific image URL in tags, use it
    if (tags?.image) {
      return [tags.image];
    }

    // Return category-appropriate placeholder images
    const imageMap: Record<Category, string[]> = {
      museum: [
        'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800',
        'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800',
      ],
      beach: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      ],
      monument: [
        'https://images.unsplash.com/photo-1513026705753-bc3fffca8bf4?w=800',
        'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
      ],
      park: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
      ],
      religious_site: [
        'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
        'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
      ],
      market: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800',
      ],
      viewpoint: [
        'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      ],
    };

    return imageMap[category] || ['https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800'];
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const placesService = new PlacesService();
