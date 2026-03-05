/**
 * Unit tests for ExternalAPIService
 * Tests caching, rate limiting, and API integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ExternalAPIService } from './externalAPIService';

describe('ExternalAPIService', () => {
  let service: ExternalAPIService;

  beforeEach(() => {
    service = new ExternalAPIService();
    vi.clearAllMocks();
  });

  describe('Caching', () => {
    it('should cache geolocation responses', async () => {
      const mockResponse = {
        country_name: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // First call should hit the API
      const result1 = await service.getGeolocation('8.8.8.8');
      expect(result1.country).toBe('United States');
      expect(result1.city).toBe('New York');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.getGeolocation('8.8.8.8');
      expect(result2.country).toBe('United States');
      expect(result2.city).toBe('New York');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should cache weather forecast responses', async () => {
      const mockWeatherResponse = {
        list: [
          {
            dt: Math.floor(Date.now() / 1000),
            main: { temp: 20 },
            weather: [{ main: 'Clear', description: 'clear sky' }],
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherResponse,
      } as Response);

      process.env.OPENWEATHER_API_KEY = 'test-key';

      // First call should hit the API
      const result1 = await service.getWeatherForecast(40.7128, -74.0060, 24);
      expect(result1).toHaveLength(1);
      expect(result1[0].temperature).toBe(20);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.getWeatherForecast(40.7128, -74.0060, 24);
      expect(result2).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should cache holiday responses', async () => {
      const mockHolidays = [
        {
          date: '2024-01-01',
          name: 'New Year',
          localName: 'New Year',
          countryCode: 'US',
          global: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockHolidays,
      } as Response);

      // First call should hit the API
      const result1 = await service.getHolidays('US', 2024);
      expect(result1).toHaveLength(1);
      expect(result1[0].name).toBe('New Year');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.getHolidays('US', 2024);
      expect(result2).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should expire cache after TTL', async () => {
      const mockResponse = {
        country_name: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Create a service with very short cache TTL for testing
      const testService = new ExternalAPIService();
      
      // Mock the setCache method to use a short TTL
      const originalSetCache = (testService as any).setCache.bind(testService);
      (testService as any).setCache = (key: string, data: any, ttl: number) => {
        // Use 1ms TTL for testing
        originalSetCache(key, data, 1);
      };

      // First call
      await testService.getGeolocation('8.8.8.8');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second call should hit API again
      await testService.getGeolocation('8.8.8.8');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Create a service with very low rate limit for testing
      const testService = new ExternalAPIService();
      (testService as any).rateLimitConfigs.set('ipapi', {
        maxRequests: 2,
        windowMs: 60000, // 1 minute
      });

      const mockResponse = {
        country_name: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // First two requests should succeed
      await testService.getGeolocation('1.1.1.1');
      await testService.getGeolocation('2.2.2.2');

      // Third request should fail due to rate limit
      await expect(testService.getGeolocation('3.3.3.3')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should track rate limit status', () => {
      const status = service.getRateLimitStatus('ipapi');
      expect(status).not.toBeNull();
      expect(status?.maxRequests).toBe(1000);
      expect(status?.currentRequests).toBe(0);
      expect(status?.remaining).toBe(1000);
    });

    it('should reset rate limit after window expires', async () => {
      // This test would require mocking time, which is complex
      // For now, we just verify the rate limit status updates
      const testService = new ExternalAPIService();
      (testService as any).rateLimitConfigs.set('test-api', {
        maxRequests: 1,
        windowMs: 100, // 100ms window
      });

      // Initialize rate limiter
      (testService as any).checkRateLimit('test-api');
      
      let status = testService.getRateLimitStatus('test-api');
      expect(status?.remaining).toBe(0);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be able to make request again
      const canRequest = (testService as any).checkRateLimit('test-api');
      expect(canRequest).toBe(true);
    });
  });

  describe('API Integration', () => {
    it('should handle geolocation API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.getGeolocation('8.8.8.8')).rejects.toThrow();
    });

    it('should fallback to ip-api.com when ipapi.co fails', async () => {
      const mockFallbackResponse = {
        status: 'success',
        country: 'United States',
        city: 'New York',
        lat: 40.7128,
        lon: -74.0060,
      };

      global.fetch = vi
        .fn()
        // First call to ipapi.co fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)
        // Second call to ip-api.com succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFallbackResponse,
        } as Response);

      const result = await service.getGeolocation('8.8.8.8');
      expect(result.country).toBe('United States');
      expect(result.city).toBe('New York');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle weather API errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      process.env.OPENWEATHER_API_KEY = 'test-key';

      await expect(
        service.getWeatherForecast(40.7128, -74.0060, 24)
      ).rejects.toThrow();
    });

    it('should require OpenWeatherMap API key', async () => {
      delete process.env.OPENWEATHER_API_KEY;

      await expect(
        service.getWeatherForecast(40.7128, -74.0060, 24)
      ).rejects.toThrow('API key not configured');
    });

    it('should handle holidays API errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(service.getHolidays('US', 2024)).rejects.toThrow();
    });
  });

  describe('API Error Handling - Graceful Degradation', () => {
    /**
     * Tests for Requirement 9.5: Graceful degradation when APIs fail
     * These tests verify that the system handles various API failure scenarios
     * and provides appropriate error messages without crashing.
     */

    it('should handle network errors gracefully for geolocation', async () => {
      // Simulate network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.getGeolocation('8.8.8.8')).rejects.toThrow(
        'Failed to detect location'
      );
    });

    it('should handle network errors gracefully for weather API', async () => {
      process.env.OPENWEATHER_API_KEY = 'test-key';
      
      // Simulate network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

      await expect(
        service.getWeatherForecast(40.7128, -74.0060, 24)
      ).rejects.toThrow('Failed to fetch weather forecast');
    });

    it('should handle network errors gracefully for holidays API', async () => {
      // Simulate network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      await expect(service.getHolidays('US', 2024)).rejects.toThrow(
        'Failed to fetch holidays'
      );
    });

    it('should handle invalid JSON responses from geolocation API', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(service.getGeolocation('8.8.8.8')).rejects.toThrow();
    });

    it('should handle invalid JSON responses from weather API', async () => {
      process.env.OPENWEATHER_API_KEY = 'test-key';
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(
        service.getWeatherForecast(40.7128, -74.0060, 24)
      ).rejects.toThrow('Failed to fetch weather forecast');
    });

    it('should handle invalid JSON responses from holidays API', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(service.getHolidays('US', 2024)).rejects.toThrow(
        'Failed to fetch holidays'
      );
    });

    it('should handle malformed weather data gracefully', async () => {
      process.env.OPENWEATHER_API_KEY = 'test-key';
      
      // Return data without the expected 'list' array
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cod: '200',
          message: 0,
          // Missing 'list' field
        }),
      } as Response);

      await expect(
        service.getWeatherForecast(40.7128, -74.0060, 24)
      ).rejects.toThrow('Failed to fetch weather forecast');
    });

    it('should handle malformed holidays data gracefully', async () => {
      // Return non-array data
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'Invalid country code',
        }),
      } as Response);

      await expect(service.getHolidays('INVALID', 2024)).rejects.toThrow(
        'Failed to fetch holidays'
      );
    });

    it('should handle geolocation API error responses', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: true,
          reason: 'Invalid IP address',
        }),
      } as Response);

      await expect(service.getGeolocation('invalid-ip')).rejects.toThrow(
        'Failed to detect location'
      );
    });

    it('should handle fallback API error responses', async () => {
      // Both APIs fail
      global.fetch = vi
        .fn()
        // First call to ipapi.co fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)
        // Second call to ip-api.com also fails
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'fail',
            message: 'Invalid IP',
          }),
        } as Response);

      await expect(service.getGeolocation('invalid-ip')).rejects.toThrow(
        'Failed to detect location'
      );
    });

    it('should handle HTTP error codes gracefully', async () => {
      const errorCodes = [400, 401, 403, 404, 429, 500, 502, 503];

      for (const code of errorCodes) {
        const testService = new ExternalAPIService();
        
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status: code,
        } as Response);

        await expect(testService.getHolidays('US', 2024)).rejects.toThrow();
      }
    });

    it('should provide default values for missing geolocation fields', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing some fields
          country_name: 'Test Country',
          // city is missing
          // latitude is missing
          // longitude is missing
        }),
      } as Response);

      const result = await service.getGeolocation('8.8.8.8');
      
      expect(result.country).toBe('Test Country');
      expect(result.city).toBe('Unknown');
      expect(result.latitude).toBe(0);
      expect(result.longitude).toBe(0);
    });

    it('should handle weather data with missing fields gracefully', async () => {
      process.env.OPENWEATHER_API_KEY = 'test-key';
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          list: [
            {
              dt: Math.floor(Date.now() / 1000),
              main: { temp: 20 },
              weather: [], // Empty weather array
            },
          ],
        }),
      } as Response);

      const result = await service.getWeatherForecast(40.7128, -74.0060, 24);
      
      expect(result).toHaveLength(1);
      expect(result[0].condition).toBe('unknown');
      expect(result[0].description).toBe('No description');
    });
  });

  describe('API Error Handling - Rate Limiting', () => {
    /**
     * Tests for Requirement 9.5: Rate limit handling
     * These tests verify that the system properly enforces rate limits
     * and provides appropriate error messages when limits are exceeded.
     */

    it('should throw error when geolocation rate limit is exceeded', async () => {
      const testService = new ExternalAPIService();
      
      // Set very low rate limit for testing
      (testService as any).rateLimitConfigs.set('ipapi', {
        maxRequests: 1,
        windowMs: 60000,
      });

      const mockResponse = {
        country_name: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // First request should succeed
      await testService.getGeolocation('1.1.1.1');

      // Second request should fail due to rate limit
      await expect(testService.getGeolocation('2.2.2.2')).rejects.toThrow(
        'Rate limit exceeded for geolocation API'
      );
    });

    it('should throw error when weather API rate limit is exceeded', async () => {
      const testService = new ExternalAPIService();
      
      // Set very low rate limit for testing
      (testService as any).rateLimitConfigs.set('openweather', {
        maxRequests: 1,
        windowMs: 60000,
      });

      const mockWeatherResponse = {
        list: [
          {
            dt: Math.floor(Date.now() / 1000),
            main: { temp: 20 },
            weather: [{ main: 'Clear', description: 'clear sky' }],
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWeatherResponse,
      } as Response);

      process.env.OPENWEATHER_API_KEY = 'test-key';

      // First request should succeed
      await testService.getWeatherForecast(40.7128, -74.0060, 24);

      // Second request should fail due to rate limit
      await expect(
        testService.getWeatherForecast(41.0, -75.0, 24)
      ).rejects.toThrow('Rate limit exceeded for weather API');
    });

    it('should throw error when holidays API rate limit is exceeded', async () => {
      const testService = new ExternalAPIService();
      
      // Set very low rate limit for testing
      (testService as any).rateLimitConfigs.set('nager', {
        maxRequests: 1,
        windowMs: 60000,
      });

      const mockHolidays = [
        {
          date: '2024-01-01',
          name: 'New Year',
          localName: 'New Year',
          countryCode: 'US',
          global: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockHolidays,
      } as Response);

      // First request should succeed
      await testService.getHolidays('US', 2024);

      // Second request should fail due to rate limit
      await expect(testService.getHolidays('GB', 2024)).rejects.toThrow(
        'Rate limit exceeded for holidays API'
      );
    });

    it('should not count cached requests against rate limit', async () => {
      const testService = new ExternalAPIService();
      
      // Set very low rate limit for testing
      (testService as any).rateLimitConfigs.set('ipapi', {
        maxRequests: 1,
        windowMs: 60000,
      });

      const mockResponse = {
        country_name: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // First request should succeed and be cached
      await testService.getGeolocation('8.8.8.8');

      // Second request for same IP should use cache and not count against rate limit
      await testService.getGeolocation('8.8.8.8');

      // Third request for same IP should still work (using cache)
      const result = await testService.getGeolocation('8.8.8.8');
      expect(result.country).toBe('United States');

      // Verify only one API call was made
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should provide accurate rate limit status information', async () => {
      const testService = new ExternalAPIService();
      
      // Set low rate limit for testing
      (testService as any).rateLimitConfigs.set('ipapi', {
        maxRequests: 3,
        windowMs: 60000,
      });

      const mockResponse = {
        country_name: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Check initial status
      let status = testService.getRateLimitStatus('ipapi');
      expect(status?.remaining).toBe(3);

      // Make first request
      await testService.getGeolocation('1.1.1.1');
      status = testService.getRateLimitStatus('ipapi');
      expect(status?.remaining).toBe(2);

      // Make second request
      await testService.getGeolocation('2.2.2.2');
      status = testService.getRateLimitStatus('ipapi');
      expect(status?.remaining).toBe(1);

      // Make third request
      await testService.getGeolocation('3.3.3.3');
      status = testService.getRateLimitStatus('ipapi');
      expect(status?.remaining).toBe(0);

      // Fourth request should fail
      await expect(testService.getGeolocation('4.4.4.4')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  describe('Cache Management', () => {
    it('should clear expired cache entries', async () => {
      const testService = new ExternalAPIService();
      
      // Add some cache entries with short TTL
      (testService as any).setCache('test1', { data: 'value1' }, 1);
      (testService as any).setCache('test2', { data: 'value2' }, 1);
      (testService as any).setCache('test3', { data: 'value3' }, 100000);

      // Wait for some to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const cleared = testService.clearExpiredCache();
      expect(cleared).toBeGreaterThanOrEqual(2);
    });

    it('should provide cache statistics', async () => {
      const mockResponse = {
        country_name: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Add some cached data
      await service.getGeolocation('8.8.8.8');
      await service.getGeolocation('1.1.1.1');

      const stats = service.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
      expect(stats.validEntries).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Data Format', () => {
    it('should format geolocation data correctly', async () => {
      const mockResponse = {
        country_name: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.getGeolocation('8.8.8.8');
      
      expect(result).toHaveProperty('country');
      expect(result).toHaveProperty('city');
      expect(result).toHaveProperty('latitude');
      expect(result).toHaveProperty('longitude');
      expect(typeof result.latitude).toBe('number');
      expect(typeof result.longitude).toBe('number');
    });

    it('should format weather data correctly', async () => {
      const mockWeatherResponse = {
        list: [
          {
            dt: Math.floor(Date.now() / 1000),
            main: { temp: 20 },
            weather: [{ main: 'Clear', description: 'clear sky' }],
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherResponse,
      } as Response);

      process.env.OPENWEATHER_API_KEY = 'test-key';

      const result = await service.getWeatherForecast(40.7128, -74.0060, 24);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('temperature');
      expect(result[0]).toHaveProperty('condition');
      expect(result[0]).toHaveProperty('description');
      expect(result[0].timestamp).toBeInstanceOf(Date);
    });

    it('should format holiday data correctly', async () => {
      const mockHolidays = [
        {
          date: '2024-01-01',
          name: 'New Year',
          localName: 'New Year',
          countryCode: 'US',
          global: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockHolidays,
      } as Response);

      const result = await service.getHolidays('US', 2024);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('localName');
      expect(result[0]).toHaveProperty('countryCode');
      expect(result[0]).toHaveProperty('global');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: tourist-crowd-map, Property 23: API Response Caching
     * **Validates: Requirements 9.4**
     * 
     * Property: For any external API request, if the same request is made within 
     * the cache validity period, the system should return cached data without 
     * making a new API call.
     * 
     * This test verifies that:
     * 1. The first request to any API endpoint makes an actual API call
     * 2. Subsequent identical requests within the cache TTL return cached data
     * 3. No additional API calls are made for cached requests
     * 4. The cached data matches the original response
     */
    it('Property 23: API Response Caching - should cache all API responses within validity period', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random API request parameters
          fc.record({
            apiType: fc.constantFrom('geolocation', 'weather', 'holidays'),
            ipAddress: fc.ipV4(),
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            countryCode: fc.constantFrom('US', 'GB', 'FR', 'DE', 'JP', 'AU'),
            year: fc.integer({ min: 2020, max: 2030 }),
            hours: fc.integer({ min: 1, max: 48 }),
          }),
          async (params) => {
            // Create a fresh service instance for each test
            const testService = new ExternalAPIService();
            let fetchCallCount = 0;

            // Mock fetch to track calls
            const mockFetch = vi.fn(async (url: string) => {
              fetchCallCount++;
              
              // Return appropriate mock data based on API type
              if (url.includes('ipapi.co') || url.includes('ip-api.com')) {
                return {
                  ok: true,
                  json: async () => ({
                    country_name: 'Test Country',
                    city: 'Test City',
                    latitude: params.latitude,
                    longitude: params.longitude,
                  }),
                } as Response;
              } else if (url.includes('openweathermap.org')) {
                return {
                  ok: true,
                  json: async () => ({
                    list: Array.from({ length: Math.ceil(params.hours / 3) }, (_, i) => ({
                      dt: Math.floor(Date.now() / 1000) + i * 3600,
                      main: { temp: 20 + i },
                      weather: [{ main: 'Clear', description: 'clear sky' }],
                    })),
                  }),
                } as Response;
              } else if (url.includes('date.nager.at')) {
                return {
                  ok: true,
                  json: async () => [
                    {
                      date: `${params.year}-01-01`,
                      name: 'New Year',
                      localName: 'New Year',
                      countryCode: params.countryCode,
                      global: true,
                    },
                  ],
                } as Response;
              }
              
              return {
                ok: false,
                status: 404,
              } as Response;
            });

            global.fetch = mockFetch;
            process.env.OPENWEATHER_API_KEY = 'test-key';

            // Make the first request based on API type
            let result1: any;
            let result2: any;

            switch (params.apiType) {
              case 'geolocation':
                result1 = await testService.getGeolocation(params.ipAddress);
                // Second identical request should use cache
                result2 = await testService.getGeolocation(params.ipAddress);
                break;
              
              case 'weather':
                result1 = await testService.getWeatherForecast(
                  params.latitude,
                  params.longitude,
                  params.hours
                );
                // Second identical request should use cache
                result2 = await testService.getWeatherForecast(
                  params.latitude,
                  params.longitude,
                  params.hours
                );
                break;
              
              case 'holidays':
                result1 = await testService.getHolidays(params.countryCode, params.year);
                // Second identical request should use cache
                result2 = await testService.getHolidays(params.countryCode, params.year);
                break;
            }

            // Property assertions:
            // 1. First request should have made exactly one API call
            expect(fetchCallCount).toBe(1);

            // 2. Second request should NOT have made another API call (still 1 total)
            expect(mockFetch).toHaveBeenCalledTimes(1);

            // 3. Both results should be identical (cached data matches original)
            expect(result2).toEqual(result1);

            // 4. Results should not be null or undefined
            expect(result1).toBeDefined();
            expect(result2).toBeDefined();

            // 5. For array results, verify they have the same length
            if (Array.isArray(result1)) {
              expect(result2).toHaveLength(result1.length);
            }

            // 6. Verify cache statistics show the cached entry
            const stats = testService.getCacheStats();
            expect(stats.validEntries).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as per requirements
      );
    });

    /**
     * Additional property test: Cache expiration behavior
     * Verifies that expired cache entries are not used and trigger new API calls
     */
    it('Property 23 (Extended): Expired cache entries should trigger new API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ipAddress: fc.ipV4(),
            cacheTTL: fc.integer({ min: 1, max: 10 }), // Very short TTL for testing
          }),
          async (params) => {
            const testService = new ExternalAPIService();
            let fetchCallCount = 0;

            // Mock fetch
            global.fetch = vi.fn(async () => {
              fetchCallCount++;
              return {
                ok: true,
                json: async () => ({
                  country_name: 'Test Country',
                  city: 'Test City',
                  latitude: 40.7128,
                  longitude: -74.0060,
                }),
              } as Response;
            });

            // Override setCache to use short TTL
            const originalSetCache = (testService as any).setCache.bind(testService);
            (testService as any).setCache = (key: string, data: any, _ttl: number) => {
              originalSetCache(key, data, params.cacheTTL);
            };

            // First request
            await testService.getGeolocation(params.ipAddress);
            expect(fetchCallCount).toBe(1);

            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, params.cacheTTL + 5));

            // Second request after expiration should make a new API call
            await testService.getGeolocation(params.ipAddress);
            expect(fetchCallCount).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property test: Different requests should not share cache
     * Verifies that cache keys are properly differentiated
     */
    it('Property 23 (Extended): Different API requests should not share cached data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ipAddress1: fc.ipV4(),
            ipAddress2: fc.ipV4(),
          }).filter(params => params.ipAddress1 !== params.ipAddress2),
          async (params) => {
            const testService = new ExternalAPIService();
            let fetchCallCount = 0;

            // Mock fetch to return different data for different IPs
            global.fetch = vi.fn(async (url: string) => {
              fetchCallCount++;
              const ipMatch = url.match(/(\d+\.\d+\.\d+\.\d+)/);
              const ip = ipMatch ? ipMatch[1] : 'unknown';
              
              return {
                ok: true,
                json: async () => ({
                  country_name: `Country-${ip}`,
                  city: `City-${ip}`,
                  latitude: 40.7128,
                  longitude: -74.0060,
                }),
              } as Response;
            });

            // Request for first IP
            const result1 = await testService.getGeolocation(params.ipAddress1);
            expect(fetchCallCount).toBe(1);

            // Request for second IP should make a new API call (different cache key)
            const result2 = await testService.getGeolocation(params.ipAddress2);
            expect(fetchCallCount).toBe(2);

            // Results should be different
            expect(result1.country).not.toBe(result2.country);

            // Request for first IP again should use cache (no new call)
            const result3 = await testService.getGeolocation(params.ipAddress1);
            expect(fetchCallCount).toBe(2); // Still 2, not 3
            expect(result3).toEqual(result1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
