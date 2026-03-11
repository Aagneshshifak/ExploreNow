/**
 * ExternalAPIService - Handles external API calls with caching and rate limiting
 * 
 * Features:
 * - In-memory caching with expiration
 * - Rate limiting to respect API limits
 * - Support for ipapi.co, OpenWeatherMap, and Nager.Date APIs
 * 
 * Requirements: 9.4, 9.6
 */

interface CachedResponse<T = any> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  requests: number[];
  lastReset: Date;
}

export class ExternalAPIService {
  private cache: Map<string, CachedResponse>;
  private rateLimiters: Map<string, RateLimitState>;
  private rateLimitConfigs: Map<string, RateLimitConfig>;

  constructor() {
    this.cache = new Map();
    this.rateLimiters = new Map();
    this.rateLimitConfigs = new Map();

    // Configure rate limits for each API
    // ipapi.co: 1000 requests/day (free tier)
    this.rateLimitConfigs.set('ipapi', {
      maxRequests: 1000,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
    });

    // OpenWeatherMap: 1000 calls/day (free tier)
    this.rateLimitConfigs.set('openweather', {
      maxRequests: 1000,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Nager.Date: No strict limit, but be respectful
    this.rateLimitConfigs.set('nager', {
      maxRequests: 100,
      windowMs: 60 * 60 * 1000, // 1 hour
    });
  }

  /**
   * Get cached data if available and not expired
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = new Date();
    if (now > cached.expiresAt) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Store data in cache with expiration
   */
  private setCache<T>(key: string, data: T, ttlMs: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt,
    });
  }

  /**
   * Check if rate limit allows the request
   */
  private checkRateLimit(apiName: string): boolean {
    const config = this.rateLimitConfigs.get(apiName);
    if (!config) {
      return true; // No rate limit configured
    }

    let state = this.rateLimiters.get(apiName);
    const now = new Date();

    if (!state) {
      // Initialize rate limiter state
      state = {
        requests: [],
        lastReset: now,
      };
      this.rateLimiters.set(apiName, state);
    }

    // Check if window has expired
    const windowStart = new Date(now.getTime() - config.windowMs);
    
    // Filter out requests outside the current window
    state.requests = state.requests.filter(
      (timestamp) => timestamp > windowStart.getTime()
    );

    // Check if we're within the limit
    if (state.requests.length >= config.maxRequests) {
      return false;
    }

    // Record this request
    state.requests.push(now.getTime());
    return true;
  }

  /**
   * Get geolocation data from IP address
   * Cache: 24 hours
   * API: ipapi.co or ip-api.com (fallback)
   */
  async getGeolocation(ipAddress: string): Promise<{
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  }> {
    const cacheKey = `geo:${ipAddress}`;
    
    // Check cache first
    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    if (!this.checkRateLimit('ipapi')) {
      throw new Error('Rate limit exceeded for geolocation API');
    }

    try {
      // Try ipapi.co first
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      
      if (!response.ok) {
        throw new Error(`ipapi.co returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.reason || 'Geolocation failed');
      }

      const result = {
        country: data.country_name || data.country || 'Unknown',
        city: data.city || 'Unknown',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      };

      // Cache for 24 hours
      this.setCache(cacheKey, result, 24 * 60 * 60 * 1000);

      return result;
    } catch (error) {
      // Fallback to ip-api.com
      console.warn('ipapi.co failed, trying ip-api.com:', error);
      
      try {
        const fallbackResponse = await fetch(`http://ip-api.com/json/${ipAddress}`);
        
        if (!fallbackResponse.ok) {
          throw new Error(`ip-api.com returned ${fallbackResponse.status}`);
        }

        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.status === 'fail') {
          throw new Error(fallbackData.message || 'Geolocation failed');
        }

        const result = {
          country: fallbackData.country || 'Unknown',
          city: fallbackData.city || 'Unknown',
          latitude: fallbackData.lat || 0,
          longitude: fallbackData.lon || 0,
        };

        // Cache for 24 hours
        this.setCache(cacheKey, result, 24 * 60 * 60 * 1000);

        return result;
      } catch (fallbackError) {
        console.error('Both geolocation APIs failed:', fallbackError);
        throw new Error('Failed to detect location');
      }
    }
  }

  /**
   * Get weather forecast from OpenWeatherMap
   * Cache: 1 hour
   * API: OpenWeatherMap
   */
  async getWeatherForecast(
    latitude: number,
    longitude: number,
    hours: number = 24
  ): Promise<Array<{
    timestamp: Date;
    temperature: number;
    condition: string;
    description: string;
  }>> {
    const cacheKey = `weather:${latitude},${longitude}:${hours}`;
    
    // Check cache first
    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    if (!this.checkRateLimit('openweather')) {
      throw new Error('Rate limit exceeded for weather API');
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    try {
      // Use 5-day forecast endpoint (free tier)
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenWeatherMap returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.list || !Array.isArray(data.list)) {
        throw new Error('Invalid weather data format');
      }

      // Convert to our format and limit to requested hours
      const forecast = data.list.slice(0, Math.ceil(hours / 3)).map((item: any) => ({
        timestamp: new Date(item.dt * 1000),
        temperature: item.main.temp,
        condition: item.weather[0]?.main?.toLowerCase() || 'unknown',
        description: item.weather[0]?.description || 'No description',
      }));

      // Cache for 1 hour
      this.setCache(cacheKey, forecast, 60 * 60 * 1000);

      return forecast;
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  /**
   * Get holidays for a country and year
   * Cache: 30 days
   * API: Nager.Date
   */
  async getHolidays(
    countryCode: string,
    year: number
  ): Promise<Array<{
    date: string;
    name: string;
    localName: string;
    countryCode: string;
    global: boolean;
  }>> {
    const cacheKey = `holidays:${countryCode}:${year}`;
    
    // Check cache first
    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    if (!this.checkRateLimit('nager')) {
      throw new Error('Rate limit exceeded for holidays API');
    }

    try {
      const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Nager.Date returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid holidays data format');
      }

      const holidays = data.map((item: any) => ({
        date: item.date,
        name: item.name,
        localName: item.localName,
        countryCode: item.countryCode,
        global: item.global || false,
      }));

      // Cache for 30 days
      this.setCache(cacheKey, holidays, 30 * 24 * 60 * 60 * 1000);

      return holidays;
    } catch (error) {
      console.error('Holidays API error:', error);
      throw new Error('Failed to fetch holidays');
    }
  }

  /**
   * Clear expired cache entries (for maintenance)
   */
  clearExpiredCache(): number {
    const now = new Date();
    let cleared = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
  } {
    const now = new Date();
    let expired = 0;
    let valid = 0;

    for (const value of this.cache.values()) {
      if (now > value.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expired,
      validEntries: valid,
    };
  }

  /**
   * Get rate limit status for an API
   */
  getRateLimitStatus(apiName: string): {
    maxRequests: number;
    currentRequests: number;
    remaining: number;
    windowMs: number;
  } | null {
    const config = this.rateLimitConfigs.get(apiName);
    const state = this.rateLimiters.get(apiName);

    if (!config) {
      return null;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    
    // Count requests in current window
    const currentRequests = state
      ? state.requests.filter((timestamp) => timestamp > windowStart.getTime()).length
      : 0;

    return {
      maxRequests: config.maxRequests,
      currentRequests,
      remaining: Math.max(0, config.maxRequests - currentRequests),
      windowMs: config.windowMs,
    };
  }
}

// Export singleton instance
export const externalAPIService = new ExternalAPIService();
