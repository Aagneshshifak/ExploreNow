import { Router, Request, Response } from 'express';
import { LocationService } from '../../../application/services/location.service';
import { MatchingService } from '../../../application/services/matching.service';
import { ConnectionService } from '../../../application/services/connection.service';
import { RedisLocationRepository } from '../../../infrastructure/repositories/redis.location.repository';
import { PostgresPrivacyRepository } from '../../../infrastructure/repositories/postgres.privacy.repository';
import { HttpProfileRepository } from '../../../infrastructure/repositories/http.profile.repository';
import { PostgresConnectionRepository } from '../../../infrastructure/repositories/postgres.connection.repository';
import { RedisEventDispatcher } from '../../../infrastructure/redis/redis.event.dispatcher';
import { OfflineQueueService } from '../../../application/services/offline.queue.service';
import { RedisOfflineQueueRepository } from '../../../infrastructure/repositories/redis.offline.queue.repository';
import { eventDispatcher } from '../../../infrastructure/redis/redis.event.dispatcher';

const router = Router();

// Instantiate Services for HTTP controllers
const locationRepo = new RedisLocationRepository();
const privacyRepo = new PostgresPrivacyRepository();
const profileRepo = new HttpProfileRepository();
const connectionRepo = new PostgresConnectionRepository();
const offlineQueueRepo = new RedisOfflineQueueRepository();
const offlineQueueService = new OfflineQueueService(offlineQueueRepo);

const locationService = new LocationService(locationRepo, privacyRepo, eventDispatcher);
const connectionService = new ConnectionService(connectionRepo, eventDispatcher, offlineQueueService);
const matchingService = new MatchingService(locationRepo, privacyRepo, profileRepo, connectionRepo);

// 1. Ping Location
router.post('/location/ping', async (req: Request, res: Response) => {
  try {
    const { userId, latitude, longitude } = req.body;
    await locationService.updateLocation(userId, { latitude, longitude });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Go Offline (called via sendBeacon when tab closes)
router.post('/location/offline', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    await locationService.markUserOffline(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Find Nearby
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { userId, lat, lng, radius } = req.query;
    const users = await matchingService.findNearbyCandidates(
      userId as string,
      parseFloat(lat as string),
      parseFloat(lng as string),
      parseInt(radius as string) || 2000
    );
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Connection Requests
router.post('/connections/request', async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.body;
    await connectionService.sendRequest(senderId, receiverId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/connections/respond', async (req: Request, res: Response) => {
  try {
    const { responderId, senderId, status } = req.body; // status: ACCEPTED | REJECTED
    await connectionService.respondToRequest(responderId, senderId, status);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
