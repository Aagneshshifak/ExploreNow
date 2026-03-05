/**
 * CrowdReportService - Handles user-contributed crowd reports
 * 
 * Features:
 * - Submit crowd reports with proximity validation
 * - Aggregate reports with temporal weighting
 * - Store reports in database with timestamps
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { db } from '../db';
import { crowdReports, crowdDataPoints, touristSpots } from '@shared/schema';
import { locationService, Coordinates } from './locationService';
import { eq, and, gte, desc } from 'drizzle-orm';
import type { CrowdLevel } from '@shared/schema';

export interface CrowdReportSubmission {
  userId: number;
  spotId: number;
  crowdLevel: CrowdLevel;
  userLocation: Coordinates;
}

export class CrowdReportService {
  /**
   * Submit a crowd report with proximity validation
   * 
   * @param submission - Report submission data
   * @throws Error if user is not within 1km of the spot
   * @returns The created report ID
   */
  async submitReport(submission: CrowdReportSubmission): Promise<number> {
    const { userId, spotId, crowdLevel, userLocation } = submission;

    // Get the tourist spot coordinates from database
    const spots = await db
      .select({
        id: touristSpots.id,
        latitude: touristSpots.latitude,
        longitude: touristSpots.longitude,
      })
      .from(touristSpots)
      .where(eq(touristSpots.id, spotId))
      .limit(1);

    if (spots.length === 0) {
      throw new Error('Tourist spot not found');
    }

    const spot = spots[0];

    // Convert decimal strings to numbers for proximity validation
    const spotLocation: Coordinates = {
      latitude: typeof spot.latitude === 'string' ? parseFloat(spot.latitude) : spot.latitude,
      longitude: typeof spot.longitude === 'string' ? parseFloat(spot.longitude) : spot.longitude,
    };

    // Validate user proximity (within 1km)
    const isWithinProximity = locationService.validateProximity(
      userLocation,
      spotLocation,
      1 // 1km max distance
    );

    if (!isWithinProximity) {
      throw new Error('You must be within 1km of the attraction to submit a report');
    }

    // Store the report in database
    const [report] = await db.insert(crowdReports).values({
      userId,
      spotId,
      crowdLevel,
      userLatitude: userLocation.latitude.toString(),
      userLongitude: userLocation.longitude.toString(),
      validated: true, // Mark as validated since we checked proximity
    }).returning({ id: crowdReports.id });

    // Also store in historical crowd data for prediction engine
    const now = new Date();
    await db.insert(crowdDataPoints).values({
      spotId,
      timestamp: now,
      crowdLevel,
      dayOfWeek: now.getDay(),
      hourOfDay: now.getHours(),
      month: now.getMonth(),
      season: this.getSeason(now.getMonth()),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      isHoliday: false, // TODO: Check holiday status when available
      source: 'user_report',
    });

    return report.id;
  }

  /**
   * Aggregate crowd reports with temporal weighting
   * Recent reports are weighted more heavily than older reports
   * 
   * @param spotId - Tourist spot ID
   * @param timeWindow - Time window in minutes (default: 30)
   * @returns Aggregated crowd level
   */
  async aggregateReports(
    spotId: number,
    timeWindow: number = 30
  ): Promise<CrowdLevel | null> {
    const cutoffTime = new Date(Date.now() - timeWindow * 60 * 1000);

    // Get all reports within the time window
    const reports = await db
      .select({
        crowdLevel: crowdReports.crowdLevel,
        reportedAt: crowdReports.reportedAt,
      })
      .from(crowdReports)
      .where(
        and(
          eq(crowdReports.spotId, spotId),
          gte(crowdReports.reportedAt, cutoffTime)
        )
      )
      .orderBy(desc(crowdReports.reportedAt));

    if (reports.length === 0) {
      return null;
    }

    // Calculate weighted average with temporal weighting
    // Reports from last 15 minutes get weight 1.0
    // Reports from 15-30 minutes get weight 0.5
    const now = Date.now();
    const crowdLevelValues: Record<CrowdLevel, number> = {
      low: 0,
      medium: 1,
      high: 2,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const report of reports) {
      const reportTime = report.reportedAt?.getTime() || now;
      const ageMinutes = (now - reportTime) / (60 * 1000);
      
      // Calculate weight: 1.0 for last 15 minutes, 0.5 for 15-30 minutes
      const weight = ageMinutes <= 15 ? 1.0 : 0.5;
      
      const numericValue = crowdLevelValues[report.crowdLevel as CrowdLevel];
      weightedSum += numericValue * weight;
      totalWeight += weight;
    }

    // Calculate weighted average and classify back to crowd level
    const averageValue = weightedSum / totalWeight;
    
    // Classify: 0-0.66 = low, 0.67-1.33 = medium, 1.34-2 = high
    if (averageValue < 0.67) {
      return 'low';
    } else if (averageValue < 1.34) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Get season from month
   * 
   * @param month - Month (0-11)
   * @returns Season name
   */
  private getSeason(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

// Export singleton instance
export const crowdReportService = new CrowdReportService();
