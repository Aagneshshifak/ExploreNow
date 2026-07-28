import { getH3Index, getNeighboringCells, calculateRingSize, calculateHaversineDistance, DEFAULT_H3_RESOLUTION } from './h3.util';

describe('H3 Utilities', () => {
  const NYC_LAT = 40.7128;
  const NYC_LNG = -74.0060;

  test('should generate a valid H3 index for a coordinate', () => {
    const index = getH3Index(NYC_LAT, NYC_LNG, DEFAULT_H3_RESOLUTION);
    // H3 indices at resolution 9 are 15-character hex strings
    expect(typeof index).toBe('string');
    expect(index.length).toBe(15);
  });

  test('should return 1 cell for kRingSize = 0', () => {
    const index = getH3Index(NYC_LAT, NYC_LNG, 9);
    const neighbors = getNeighboringCells(index, 0);
    expect(neighbors.length).toBe(1);
    expect(neighbors[0]).toBe(index);
  });

  test('should return 7 cells for kRingSize = 1', () => {
    const index = getH3Index(NYC_LAT, NYC_LNG, 9);
    const neighbors = getNeighboringCells(index, 1);
    expect(neighbors.length).toBe(7);
    expect(neighbors).toContain(index); // Should include the origin
  });

  test('should return 19 cells for kRingSize = 2', () => {
    const index = getH3Index(NYC_LAT, NYC_LNG, 9);
    const neighbors = getNeighboringCells(index, 2);
    expect(neighbors.length).toBe(19);
  });

  test('calculateRingSize should compute conservative k-rings based on radius', () => {
    // At res 9, edge is ~174m. 
    // 100m should be covered by k=1 (Math.ceil(100/174) = 1)
    expect(calculateRingSize(100, 9)).toBe(1);
    
    // 500m should be covered by k=3 (Math.ceil(500/174) = 3)
    expect(calculateRingSize(500, 9)).toBe(3);
    // 2000m should be covered by k=12 (Math.ceil(2000/174) = 12), though exact library avg might yield 10 or 11 based on projection.
    const ringSizeFor2k = calculateRingSize(2000, 9);
    expect(ringSizeFor2k).toBeGreaterThanOrEqual(10);
    expect(ringSizeFor2k).toBeLessThanOrEqual(12);
  });

  test('calculateHaversineDistance should correctly calculate distance between two coordinates', () => {
    // Times Square to Empire State Building (~1.05 km)
    const lat1 = 40.7580;
    const lon1 = -73.9855;
    const lat2 = 40.7484;
    const lon2 = -73.9857;

    const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    
    // Should be around 1067 meters
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1100);
  });
});
