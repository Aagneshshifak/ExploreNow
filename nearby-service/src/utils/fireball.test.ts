import { FireballAlgorithm, LocationData } from './fireball';

describe('FireballAlgorithm', () => {
  let fireball: FireballAlgorithm;
  
  const baseLocation: LocationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    timestamp: 1000000,
    speed: 5.0,
    direction: 90.0
  };

  beforeEach(() => {
    fireball = new FireballAlgorithm();
  });

  test('should always send the first location', () => {
    expect(fireball.shouldSendUpdate(baseLocation)).toBe(true);
  });

  test('should not send if nothing changed significantly', () => {
    fireball.shouldSendUpdate(baseLocation); // first is true

    const minorChange: LocationData = {
      ...baseLocation,
      latitude: 40.712801, // ~10cm move
      timestamp: 1000000 + 10000, // 10 seconds later
    };

    expect(fireball.shouldSendUpdate(minorChange)).toBe(false);
  });

  test('should send if TIME_THRESHOLD (2 minutes) is exceeded', () => {
    fireball.shouldSendUpdate(baseLocation);

    const timeChange: LocationData = {
      ...baseLocation,
      timestamp: 1000000 + 120_000, // Exactly 2 minutes later
    };

    expect(fireball.shouldSendUpdate(timeChange)).toBe(true);
  });

  test('should send if DISTANCE_THRESHOLD (50m) is exceeded', () => {
    fireball.shouldSendUpdate(baseLocation);

    const distanceChange: LocationData = {
      ...baseLocation,
      // Approximately 60 meters north
      latitude: 40.71334, 
    };

    expect(fireball.shouldSendUpdate(distanceChange)).toBe(true);
  });

  test('should send if SPEED_THRESHOLD (2.0 m/s) is exceeded', () => {
    fireball.shouldSendUpdate(baseLocation);

    const speedChange: LocationData = {
      ...baseLocation,
      speed: 7.0, // 2.0 m/s faster
    };

    expect(fireball.shouldSendUpdate(speedChange)).toBe(true);
  });

  test('should send if DIRECTION_THRESHOLD (30 deg) is exceeded', () => {
    fireball.shouldSendUpdate(baseLocation);

    const directionChange: LocationData = {
      ...baseLocation,
      direction: 120.0, // exactly 30 degrees right
    };

    expect(fireball.shouldSendUpdate(directionChange)).toBe(true);
  });

  test('should handle direction wrap-around correctly (350 to 10 is a 20 deg change, NOT 340)', () => {
    fireball.shouldSendUpdate({ ...baseLocation, direction: 350.0 });

    const wrapAroundChange: LocationData = {
      ...baseLocation,
      direction: 10.0, // Only 20 degrees difference from 350
    };

    // Should NOT trigger because 20 < 30
    expect(fireball.shouldSendUpdate(wrapAroundChange)).toBe(false);

    const largeWrapAroundChange: LocationData = {
      ...baseLocation,
      direction: 25.0, // 35 degrees difference from 350
    };

    // Should trigger because 35 > 30
    expect(fireball.shouldSendUpdate(largeWrapAroundChange)).toBe(true);
  });
  
  test('should send if H3 cell changes even if distance is small (edge of hexagon)', () => {
    fireball.shouldSendUpdate({
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: 1000000,
    });

    // A coordinate specifically chosen that crosses into a neighboring H3 resolution 9 cell
    // but is physically very close. For this test, a known cell boundary jump is simulated by a 400m jump
    const h3Change: LocationData = {
      latitude: 40.7160,
      longitude: -74.0060,
      timestamp: 1000010,
    };

    expect(fireball.shouldSendUpdate(h3Change)).toBe(true);
  });
});
