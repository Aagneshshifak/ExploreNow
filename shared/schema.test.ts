import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  insertTouristSpotSchema,
  categorySchema,
  type Category,
} from './schema';

/**
 * Property-Based Tests for Tourist & Crowd Map Feature
 * Feature: tourist-crowd-map
 */

describe('Tourist Spot Schema Validation', () => {
  /**
   * Property 3: Tourist Spot Schema Validation
   * 
   * For any tourist spot stored in the database, it should contain all required fields:
   * name, country, city, coordinates (latitude, longitude), category, description, and images array.
   * 
   * **Validates: Requirements 2.1, 2.5**
   */
  it('Property 3: should validate that all tourist spots contain required fields', () => {
    // Define valid categories
    const validCategories: Category[] = [
      'museum',
      'beach',
      'monument',
      'park',
      'religious_site',
      'market',
      'viewpoint',
    ];

    // Generator for valid tourist spot data
    const touristSpotArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
      country: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length > 0),
      city: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length > 0),
      latitude: fc.double({ min: -90, max: 90, noNaN: true }).map(n => n.toString()),
      longitude: fc.double({ min: -180, max: 180, noNaN: true }).map(n => n.toString()),
      category: fc.constantFrom(...validCategories),
      description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
      images: fc.array(fc.webUrl(), { minLength: 0, maxLength: 10 }),
    });

    fc.assert(
      fc.property(touristSpotArbitrary, (spot) => {
        // Validate using Zod schema
        const result = insertTouristSpotSchema.safeParse(spot);

        // The schema should successfully parse valid data
        expect(result.success).toBe(true);

        if (result.success) {
          // Verify all required fields are present
          expect(result.data).toHaveProperty('name');
          expect(result.data).toHaveProperty('country');
          expect(result.data).toHaveProperty('city');
          expect(result.data).toHaveProperty('latitude');
          expect(result.data).toHaveProperty('longitude');
          expect(result.data).toHaveProperty('category');
          expect(result.data).toHaveProperty('description');
          expect(result.data).toHaveProperty('images');

          // Verify field types
          expect(typeof result.data.name).toBe('string');
          expect(typeof result.data.country).toBe('string');
          expect(typeof result.data.city).toBe('string');
          expect(typeof result.data.latitude).toBe('string');
          expect(typeof result.data.longitude).toBe('string');
          expect(typeof result.data.category).toBe('string');
          expect(typeof result.data.description).toBe('string');
          expect(Array.isArray(result.data.images)).toBe(true);

          // Verify coordinate ranges (parse strings to numbers)
          const lat = parseFloat(result.data.latitude);
          const lon = parseFloat(result.data.longitude);
          expect(lat).toBeGreaterThanOrEqual(-90);
          expect(lat).toBeLessThanOrEqual(90);
          expect(lon).toBeGreaterThanOrEqual(-180);
          expect(lon).toBeLessThanOrEqual(180);

          // Verify category is valid
          expect(validCategories).toContain(result.data.category);

          // Verify strings are non-empty
          expect(result.data.name.length).toBeGreaterThan(0);
          expect(result.data.country.length).toBeGreaterThan(0);
          expect(result.data.city.length).toBeGreaterThan(0);
          expect(result.data.description.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 3 (Edge Case): should reject tourist spots with missing required fields
   */
  it('Property 3 (Edge Case): should reject tourist spots missing required fields', () => {
    // Generator for incomplete tourist spot data (missing random required fields)
    const incompleteSpotArbitrary = fc.record({
      name: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
      country: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
      city: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
      latitude: fc.option(fc.double({ min: -90, max: 90 }), { nil: undefined }),
      longitude: fc.option(fc.double({ min: -180, max: 180 }), { nil: undefined }),
      category: fc.option(fc.constantFrom('museum', 'beach', 'monument'), { nil: undefined }),
      description: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
      images: fc.option(fc.array(fc.webUrl()), { nil: undefined }),
    }).filter((spot) => {
      // Ensure at least one required field is missing
      return (
        spot.name === undefined ||
        spot.country === undefined ||
        spot.city === undefined ||
        spot.latitude === undefined ||
        spot.longitude === undefined ||
        spot.category === undefined ||
        spot.description === undefined ||
        spot.images === undefined
      );
    });

    fc.assert(
      fc.property(incompleteSpotArbitrary, (spot) => {
        // Validate using Zod schema
        const result = insertTouristSpotSchema.safeParse(spot);

        // The schema should reject incomplete data
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3 (Edge Case): should reject tourist spots with invalid coordinate ranges
   */
  it('Property 3 (Edge Case): should reject tourist spots with invalid coordinates', () => {
    const validCategories: Category[] = [
      'museum',
      'beach',
      'monument',
      'park',
      'religious_site',
      'market',
      'viewpoint',
    ];

    // Generator for tourist spots with invalid coordinates
    const invalidCoordinatesArbitrary = fc.record({
      name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      country: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      city: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      latitude: fc.oneof(
        fc.double({ min: 91, max: 200 }), // Invalid: > 90
        fc.double({ min: -200, max: -91 }) // Invalid: < -90
      ).map(n => n.toString()),
      longitude: fc.oneof(
        fc.double({ min: 181, max: 360 }), // Invalid: > 180
        fc.double({ min: -360, max: -181 }) // Invalid: < -180
      ).map(n => n.toString()),
      category: fc.constantFrom(...validCategories),
      description: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      images: fc.array(fc.webUrl()),
    });

    fc.assert(
      fc.property(invalidCoordinatesArbitrary, (spot) => {
        // Validate using Zod schema
        const result = insertTouristSpotSchema.safeParse(spot);

        // The schema should reject invalid coordinates
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3 (Edge Case): should handle empty images array
   */
  it('Property 3 (Edge Case): should accept tourist spots with empty images array', () => {
    const validCategories: Category[] = [
      'museum',
      'beach',
      'monument',
      'park',
      'religious_site',
      'market',
      'viewpoint',
    ];

    const spotWithEmptyImagesArbitrary = fc.record({
      name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      country: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      city: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      latitude: fc.double({ min: -90, max: 90, noNaN: true }).map(n => n.toString()),
      longitude: fc.double({ min: -180, max: 180, noNaN: true }).map(n => n.toString()),
      category: fc.constantFrom(...validCategories),
      description: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      images: fc.constant([]), // Always empty array
    });

    fc.assert(
      fc.property(spotWithEmptyImagesArbitrary, (spot) => {
        const result = insertTouristSpotSchema.safeParse(spot);

        // Should accept spots with empty images array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.images).toEqual([]);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Category Enum Validation', () => {
  /**
   * Property 4: Category Enum Validation
   * 
   * For any tourist spot, the category field should be one of the valid enum values:
   * Museum, Beach, Monument, Park, ReligiousSite, Market, or Viewpoint.
   * 
   * **Feature: tourist-crowd-map, Property 4: Category Enum Validation**
   * **Validates: Requirements 2.2**
   */
  it('Property 4: should validate that category is one of the valid enum values', () => {
    const validCategories: Category[] = [
      'museum',
      'beach',
      'monument',
      'park',
      'religious_site',
      'market',
      'viewpoint',
    ];

    // Generator for tourist spots with valid categories
    const touristSpotArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
      country: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length > 0),
      city: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length > 0),
      latitude: fc.double({ min: -90, max: 90, noNaN: true }).map(n => n.toString()),
      longitude: fc.double({ min: -180, max: 180, noNaN: true }).map(n => n.toString()),
      category: fc.constantFrom(...validCategories),
      description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
      images: fc.array(fc.webUrl(), { minLength: 0, maxLength: 10 }),
    });

    fc.assert(
      fc.property(touristSpotArbitrary, (spot) => {
        // Validate using Zod schema
        const result = insertTouristSpotSchema.safeParse(spot);

        // The schema should successfully parse valid data
        expect(result.success).toBe(true);

        if (result.success) {
          // Verify category is one of the valid enum values
          expect(validCategories).toContain(result.data.category);
          
          // Verify category is a string
          expect(typeof result.data.category).toBe('string');
          
          // Verify category matches exactly one of the enum values
          const categoryMatches = validCategories.filter(c => c === result.data.category);
          expect(categoryMatches.length).toBe(1);
        }
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 4 (Edge Case): should reject tourist spots with invalid category values
   */
  it('Property 4 (Edge Case): should reject tourist spots with invalid categories', () => {
    const validCategories: Category[] = [
      'museum',
      'beach',
      'monument',
      'park',
      'religious_site',
      'market',
      'viewpoint',
    ];

    // Generator for invalid category strings (not in the enum)
    const invalidCategoryArbitrary = fc.string().filter(s => !validCategories.includes(s as Category));

    // Generator for tourist spots with invalid categories
    const spotWithInvalidCategoryArbitrary = fc.record({
      name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      country: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      city: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      latitude: fc.double({ min: -90, max: 90, noNaN: true }).map(n => n.toString()),
      longitude: fc.double({ min: -180, max: 180, noNaN: true }).map(n => n.toString()),
      category: invalidCategoryArbitrary,
      description: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      images: fc.array(fc.webUrl()),
    });

    fc.assert(
      fc.property(spotWithInvalidCategoryArbitrary, (spot) => {
        // Validate using Zod schema
        const result = insertTouristSpotSchema.safeParse(spot);

        // The schema should reject invalid categories
        expect(result.success).toBe(false);
        
        if (!result.success) {
          // Verify that the error is related to the category field
          const categoryErrors = result.error.issues.filter(issue => 
            issue.path.includes('category')
          );
          expect(categoryErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4 (Edge Case): should validate category using categorySchema directly
   */
  it('Property 4 (Edge Case): should validate categories using categorySchema', () => {
    const validCategories: Category[] = [
      'museum',
      'beach',
      'monument',
      'park',
      'religious_site',
      'market',
      'viewpoint',
    ];

    // Test that all valid categories pass the schema validation
    validCategories.forEach(category => {
      const result = categorySchema.safeParse(category);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(category);
      }
    });

    // Test that invalid categories fail the schema validation
    const invalidCategories = ['restaurant', 'hotel', 'airport', 'invalid', '', 'MUSEUM', 'Beach'];
    invalidCategories.forEach(category => {
      const result = categorySchema.safeParse(category);
      expect(result.success).toBe(false);
    });
  });
});
