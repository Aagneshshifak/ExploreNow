/**
 * CrowdPredictionService - High-level service for crowd prediction and caching
 * 
 * Features:
 * - Generate 24-hour crowd level forecasts
 * - Get current crowd level with user report aggregation
 * - Update and cache predictions for all spots
 * - Manage prediction cache in database
 * 
 * Requirements: 3.1, 4.1, 4.3
 */

import { db } from '../db';
import { predictionEngine } from './predictionEngine';
import { 
  predictionCache, 
  crowdReports, 
  touristSpots,
  type CrowdLevel,
  type TouristSpot
} from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export interface CrowdPredictionResult {
  timestamp: Date;
  crowdLevel: CrowdLevel;
  confidence: number;
}

export class CrowdPredictionService {
  /**
   * Generate 24-hour crowd level predictions for a tourist spot
   * Checks cache first, generates new predictions if needed
   * 
   * @param spotId - The tourist spot ID
   * @param startTime - Starting time for predictions (defaults to now)
   * @param hours - Number of hours to predict (default: 24)
   * @returns Array of hourly predictions
   */
  async predictCrowdLevels(
    spotId: number,
    startTime: Date = new Date(),
    hours: number = 24
  ): Promise<CrowdPredictionResult[]> {
    const predictions: CrowdPredictionResult[] = [];
    
    // Get spot details for country code and coordinates
    const spot = await this.getSpotDetails(spotId);
    if (!spot) {
      throw new Error(`Tourist spot with ID ${spotId} not found`);
    }

    // Extract country code from country name (simplified - would need a mapping in production)
    const countryCode = this.getCountryCode(spot.country);
    const coordinates = {
      latitude: parseFloat(spot.latitude),
      longitude: parseFloat(spot.longitude)
    };

    // Generate predictions for each hour
    for (let i = 0; i < hours; i++) {
      const targetTime = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      
      // Check cache first
      const cached = await this.getCachedPrediction(spotId, targetTime);
      
      if (cached) {
        predictions.push({
          timestamp: cached.predictedFor,
          crowdLevel: cached.crowdLevel as CrowdLevel,
          confidence: parseFloat(cached.confidence)
        });
      } else {
        // Generate new prediction
        const prediction = await predictionEngine.predict(
          spotId,
          targetTime,
          countryCode,
          coordinates
        );
        
        predictions.push(prediction);
        
        // Cache the prediction
        await this.cachePrediction(spotId, prediction);
      }
    }

    return predictions;
  }

  /**
   * Get current crowd level for a tourist spot
   * Aggregates recent user reports if available, otherwise uses prediction
   * 
   * @param spotId - The tourist spot ID
   * @returns Current crowd level
   */
  async getCurrentCrowdLevel(spotId: number): Promise<CrowdLevel> {
    // Check for recent user reports (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const recentReports = await db
      .select()
      .from(crowdReports)
      .where(
        and(
          eq(crowdReports.spotId, spotId),
          eq(crowdReports.validated, true),
          gte(crowdReports.reportedAt, thirtyMinutesAgo)
        )
      )
      .orderBy(desc(crowdReports.reportedAt));

    // If we have recent reports, aggregate them
    if (recentReports.length > 0) {
      return this.aggregateReports(recentReports);
    }

    // No recent reports, use prediction for current time
    const predictions = await this.predictCrowdLevels(spotId, new Date(), 1);
    return predictions[0]?.crowdLevel || 'medium';
  }

  /**
   * Update predictions for all tourist spots
   * This is meant to be run as a scheduled job (every hour)
   * Generates and caches predictions for the next 24 hours
   */
  async updatePredictions(): Promise<void> {
    try {
      console.log('Starting prediction update job...');
      
      // Get all tourist spots
      const spots = await db.select().from(touristSpots);
      
      console.log(`Updating predictions for ${spots.length} tourist spots`);
      
      // Generate predictions for each spot
      for (const spot of spots) {
        try {
          await this.predictCrowdLevels(spot.id);
          console.log(`Updated predictions for spot ${spot.id}: ${spot.name}`);
        } catch (error) {
          console.error(`Failed to update predictions for spot ${spot.id}:`, error);
          // Continue with other spots even if one fails
        }
      }
      
      console.log('Prediction update job completed');
    } catch (error) {
      console.error('Prediction update job failed:', error);
      throw error;
    }
  }

  /**
   * Get cached prediction for a specific spot and time
   * 
   * @param spotId - The tourist spot ID
   * @param targetTime - The time to get prediction for
   * @returns Cached prediction or null if not found/expired
   */
  private async getCachedPrediction(
    spotId: number,
    targetTime: Date
  ): Promise<typeof predictionCache.$inferSelect | null> {
    try {
      // Round target time to nearest hour for cache lookup
      const roundedTime = new Date(targetTime);
      roundedTime.setMinutes(0, 0, 0);
      
      const now = new Date();
      
      const cached = await db
        .select()
        .from(predictionCache)
        .where(
          and(
            eq(predictionCache.spotId, spotId),
            eq(predictionCache.predictedFor, roundedTime),
            gte(predictionCache.expiresAt, now)
          )
        )
        .limit(1);

      return cached[0] || null;
    } catch (error) {
      console.error('Failed to get cached prediction:', error);
      return null;
    }
  }

  /**
   * Cache a prediction in the database
   * 
   * @param spotId - The tourist spot ID
   * @param prediction - The prediction to cache
   */
  private async cachePrediction(
    spotId: number,
    prediction: CrowdPredictionResult
  ): Promise<void> {
    try {
      // Round timestamp to nearest hour
      const roundedTime = new Date(prediction.timestamp);
      roundedTime.setMinutes(0, 0, 0);
      
      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      await db.insert(predictionCache).values({
        spotId,
        predictedFor: roundedTime,
        crowdLevel: prediction.crowdLevel,
        confidence: prediction.confidence.toString(),
        expiresAt
      });
    } catch (error) {
      // If insert fails (e.g., duplicate), just log and continue
      console.warn('Failed to cache prediction:', error);
    }
  }

  /**
   * Aggregate multiple crowd reports into a single crowd level
   * Uses temporal weighting (more recent reports have higher weight)
   * 
   * @param reports - Array of crowd reports
   * @returns Aggregated crowd level
   */
  private aggregateReports(
    reports: Array<typeof crowdReports.$inferSelect>
  ): CrowdLevel {
    if (reports.length === 0) {
      return 'medium';
    }

    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;

    for (const report of reports) {
      // Calculate age in minutes
      const ageMinutes = (now - report.reportedAt!.getTime()) / (60 * 1000);
      
      // Weight decreases with age (exponential decay)
      // Reports from last 15 minutes get full weight (1.0)
      // Reports from 30 minutes ago get ~0.5 weight
      const weight = Math.exp(-ageMinutes / 15);
      
      // Convert crowd level to numeric value
      const numericValue = this.crowdLevelToNumeric(report.crowdLevel as CrowdLevel);
      
      weightedSum += numericValue * weight;
      totalWeight += weight;
    }

    // Calculate weighted average
    const average = weightedSum / totalWeight;
    
    // Convert back to crowd level
    return this.numericToCrowdLevel(average);
  }

  /**
   * Convert crowd level enum to numeric value
   */
  private crowdLevelToNumeric(level: CrowdLevel): number {
    switch (level) {
      case 'low':
        return 0.2;
      case 'medium':
        return 0.5;
      case 'high':
        return 0.8;
      default:
        return 0.5;
    }
  }

  /**
   * Convert numeric value to crowd level enum
   */
  private numericToCrowdLevel(value: number): CrowdLevel {
    if (value < 0.33) {
      return 'low';
    }
    if (value < 0.67) {
      return 'medium';
    }
    return 'high';
  }

  /**
   * Get spot details from database
   */
  private async getSpotDetails(spotId: number): Promise<TouristSpot | null> {
    try {
      const spots = await db
        .select()
        .from(touristSpots)
        .where(eq(touristSpots.id, spotId))
        .limit(1);

      return spots[0] || null;
    } catch (error) {
      console.error('Failed to get spot details:', error);
      return null;
    }
  }

  /**
   * Get country code from country name
   * This is a simplified version - in production, use a proper country name to code mapping
   */
  private getCountryCode(countryName: string): string {
    const countryMap: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'France': 'FR',
      'Germany': 'DE',
      'Italy': 'IT',
      'Spain': 'ES',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Brazil': 'BR',
      'Australia': 'AU',
      'Canada': 'CA',
      'Mexico': 'MX',
      'Netherlands': 'NL',
      'Switzerland': 'CH',
      'Thailand': 'TH',
      'Singapore': 'SG',
      'UAE': 'AE',
      'Egypt': 'EG',
      'Greece': 'GR',
      'Turkey': 'TR',
      'Portugal': 'PT',
      'Austria': 'AT',
      'Belgium': 'BE',
      'Sweden': 'SE',
      'Norway': 'NO',
      'Denmark': 'DK',
      'Finland': 'FI',
      'Poland': 'PL',
      'Czech Republic': 'CZ',
      'Hungary': 'HU',
      'Ireland': 'IE',
      'New Zealand': 'NZ',
      'South Korea': 'KR',
      'Malaysia': 'MY',
      'Indonesia': 'ID',
      'Philippines': 'PH',
      'Vietnam': 'VN',
      'Argentina': 'AR',
      'Chile': 'CL',
      'Colombia': 'CO',
      'Peru': 'PE',
      'South Africa': 'ZA',
      'Morocco': 'MA',
      'Israel': 'IL',
      'Russia': 'RU',
      'Ukraine': 'UA',
      'Croatia': 'HR',
      'Iceland': 'IS'
    };

    return countryMap[countryName] || 'US'; // Default to US if not found
  }
}

// Export singleton instance
export const crowdPredictionService = new CrowdPredictionService();
