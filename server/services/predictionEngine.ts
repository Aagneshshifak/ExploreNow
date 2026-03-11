/**
 * PredictionEngine - Core prediction logic for crowd level forecasting
 * 
 * Features:
 * - Temporal feature extraction (day of week, hour, season, holidays)
 * - Pattern-based prediction using historical data
 * - Weather and holiday adjustments
 * - Confidence score calculation
 * 
 * Requirements: 4.2
 */

import { externalAPIService } from './externalAPIService';
import type { Season, CrowdLevel, CrowdDataPoint } from '@shared/schema';
import { db } from '../db';
import { crowdDataPoints } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface TemporalFeatures {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hourOfDay: number; // 0-23
  month: number; // 0-11
  isWeekend: boolean;
  isHoliday: boolean;
  season: Season;
}

export interface CrowdPrediction {
  timestamp: Date;
  crowdLevel: CrowdLevel;
  confidence: number;
}

export class PredictionEngine {
  /**
   * Extract temporal features from a target date/time
   * 
   * @param targetTime - The date/time to extract features for
   * @param countryCode - Country code for holiday checking (e.g., 'US', 'GB')
   * @returns TemporalFeatures object with all extracted features
   */
  async extractTemporalFeatures(
    targetTime: Date,
    countryCode?: string
  ): Promise<TemporalFeatures> {
    const dayOfWeek = targetTime.getDay(); // 0-6
    const hourOfDay = targetTime.getHours(); // 0-23
    const month = targetTime.getMonth(); // 0-11
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const season = this.getSeason(month);
    
    // Check if the date is a holiday
    let isHoliday = false;
    if (countryCode) {
      isHoliday = await this.checkHoliday(targetTime, countryCode);
    }

    return {
      dayOfWeek,
      hourOfDay,
      month,
      isWeekend,
      isHoliday,
      season,
    };
  }

  /**
   * Get season from month
   * 
   * @param month - Month number (0-11)
   * @returns Season enum value
   */
  getSeason(month: number): Season {
    // Northern hemisphere seasons
    if (month >= 2 && month <= 4) {
      return 'spring'; // March, April, May
    } else if (month >= 5 && month <= 7) {
      return 'summer'; // June, July, August
    } else if (month >= 8 && month <= 10) {
      return 'fall'; // September, October, November
    } else {
      return 'winter'; // December, January, February
    }
  }

  /**
   * Check if a date is a holiday using the holiday service
   * 
   * @param targetTime - The date to check
   * @param countryCode - Country code (e.g., 'US', 'GB')
   * @returns true if the date is a holiday, false otherwise
   */
  async checkHoliday(targetTime: Date, countryCode: string): Promise<boolean> {
    try {
      const year = targetTime.getFullYear();
      const holidays = await externalAPIService.getHolidays(countryCode, year);
      
      // Format target date as YYYY-MM-DD
      const targetDateStr = targetTime.toISOString().split('T')[0];
      
      // Check if any holiday matches the target date
      return holidays.some(holiday => holiday.date === targetDateStr);
    } catch (error) {
      console.warn('Failed to check holiday status:', error);
      // If holiday API fails, assume not a holiday
      return false;
    }
  }

  /**
   * Main prediction method - generates crowd level prediction for a specific time
   * 
   * @param spotId - The tourist spot ID
   * @param targetTime - The date/time to predict for
   * @param countryCode - Country code for holiday checking
   * @param coordinates - Spot coordinates for weather data
   * @returns CrowdPrediction with level and confidence
   */
  async predict(
    spotId: number,
    targetTime: Date,
    countryCode?: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<CrowdPrediction> {
    // 1. Extract temporal features
    const features = await this.extractTemporalFeatures(targetTime, countryCode);

    // 2. Query historical data for similar conditions
    const historicalData = await this.getHistoricalData(spotId, features);

    // 3. Calculate base crowd level from historical average
    const baseCrowdLevel = this.calculateAverage(historicalData);

    // 4. Apply weather adjustment
    let weatherAdjustment = 1.0;
    if (coordinates) {
      try {
        const weather = await externalAPIService.getWeatherForecast(
          coordinates.latitude,
          coordinates.longitude,
          1 // Just need current/near-term forecast
        );
        if (weather.length > 0) {
          weatherAdjustment = this.getWeatherAdjustment(weather[0]);
        }
      } catch (error) {
        console.warn('Failed to get weather data for prediction:', error);
        // Continue without weather adjustment
      }
    }

    // 5. Apply holiday adjustment
    const holidayAdjustment = features.isHoliday ? 1.3 : 1.0;

    // 6. Calculate final prediction
    const adjustedLevel = baseCrowdLevel * weatherAdjustment * holidayAdjustment;

    // 7. Calculate confidence based on data availability
    const confidence = this.calculateConfidence(historicalData.length);

    return {
      timestamp: targetTime,
      crowdLevel: this.classifyCrowdLevel(adjustedLevel),
      confidence: confidence
    };
  }

  /**
   * Query historical crowd data for similar temporal conditions
   * 
   * @param spotId - The tourist spot ID
   * @param features - Temporal features to match
   * @returns Array of historical crowd data points
   */
  private async getHistoricalData(
    spotId: number,
    features: TemporalFeatures
  ): Promise<CrowdDataPoint[]> {
    try {
      // Query for similar temporal patterns
      // Match: same spot, same day of week, similar hour (±2 hours), same season
      const hourMin = Math.max(0, features.hourOfDay - 2);
      const hourMax = Math.min(23, features.hourOfDay + 2);

      const data = await db
        .select()
        .from(crowdDataPoints)
        .where(
          and(
            eq(crowdDataPoints.spotId, spotId),
            eq(crowdDataPoints.dayOfWeek, features.dayOfWeek),
            gte(crowdDataPoints.hourOfDay, hourMin),
            lte(crowdDataPoints.hourOfDay, hourMax),
            eq(crowdDataPoints.season, features.season)
          )
        );

      return data;
    } catch (error) {
      console.error('Failed to query historical data:', error);
      return [];
    }
  }

  /**
   * Calculate average crowd level from historical data
   * 
   * @param historicalData - Array of historical crowd data points
   * @returns Numeric crowd level (0.0 to 1.0)
   */
  private calculateAverage(historicalData: CrowdDataPoint[]): number {
    if (historicalData.length === 0) {
      // No data available, return medium level as default
      return 0.5;
    }

    // Convert crowd levels to numeric values
    const numericValues = historicalData.map(point => {
      switch (point.crowdLevel) {
        case 'low':
          return 0.2;
        case 'medium':
          return 0.5;
        case 'high':
          return 0.8;
        default:
          return 0.5;
      }
    });

    // Calculate average
    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    return sum / numericValues.length;
  }

  /**
   * Get weather adjustment multiplier based on weather conditions
   * 
   * @param weather - Weather data object
   * @returns Multiplier (0.7 to 1.2)
   */
  private getWeatherAdjustment(weather: {
    condition: string;
    temperature: number;
  }): number {
    // Rain/snow reduces crowds (0.7x multiplier)
    if (weather.condition === 'rain' || weather.condition === 'snow') {
      return 0.7;
    }

    // Extreme heat/cold reduces crowds (0.8x multiplier)
    if (weather.temperature < 5 || weather.temperature > 35) {
      return 0.8;
    }

    // Good weather increases crowds (1.2x multiplier)
    if (
      weather.condition === 'clear' &&
      weather.temperature > 15 &&
      weather.temperature < 28
    ) {
      return 1.2;
    }

    // Normal weather, no adjustment
    return 1.0;
  }

  /**
   * Classify numeric crowd level into enum value
   * 
   * @param value - Numeric crowd level (0.0 to 1.0)
   * @returns CrowdLevel enum (low, medium, high)
   */
  private classifyCrowdLevel(value: number): CrowdLevel {
    // Classify numeric value into Low/Medium/High
    if (value < 0.33) {
      return 'low';
    }
    if (value < 0.67) {
      return 'medium';
    }
    return 'high';
  }

  /**
   * Calculate confidence score based on available data points
   * 
   * @param dataPoints - Number of historical data points
   * @returns Confidence score (0.0 to 0.9)
   */
  private calculateConfidence(dataPoints: number): number {
    // More historical data = higher confidence
    // Minimum 10 data points for 50% confidence
    // 100+ data points for 90% confidence
    if (dataPoints === 0) {
      return 0.0;
    }
    return Math.min(0.9, 0.5 + (dataPoints / 200));
  }
}

// Export singleton instance
export const predictionEngine = new PredictionEngine();
