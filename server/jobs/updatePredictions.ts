/**
 * Prediction Update Job
 * 
 * Scheduled job that updates crowd predictions for all tourist spots.
 * Runs every hour to keep predictions fresh and accurate.
 * 
 * Requirements: 4.5
 */

import cron from 'node-cron';
import { crowdPredictionService } from '../services/crowdPredictionService';

/**
 * Start the prediction update job
 * Schedules the job to run every hour at minute 0
 */
export function startPredictionUpdateJob(): void {
  // Schedule job to run every hour at minute 0
  // Cron format: minute hour day month weekday
  // '0 * * * *' means: at minute 0 of every hour
  const job = cron.schedule('0 * * * *', async () => {
    const startTime = new Date();
    console.log(`[Prediction Job] Starting at ${startTime.toISOString()}`);
    
    try {
      await crowdPredictionService.updatePredictions();
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.log(`[Prediction Job] Completed successfully in ${duration}ms`);
    } catch (error) {
      console.error('[Prediction Job] Failed:', error);
      // Log error but don't crash the server
      // The job will retry on the next scheduled run
    }
  });

  console.log('[Prediction Job] Scheduled to run every hour at minute 0');
  
  // Optionally run immediately on startup for testing/initialization
  // Uncomment the following lines if you want predictions to update on server start
  // console.log('[Prediction Job] Running initial update...');
  // crowdPredictionService.updatePredictions().catch(error => {
  //   console.error('[Prediction Job] Initial update failed:', error);
  // });
}

/**
 * Stop the prediction update job (for graceful shutdown)
 */
export function stopPredictionUpdateJob(): void {
  cron.getTasks().forEach(task => task.stop());
  console.log('[Prediction Job] Stopped');
}
