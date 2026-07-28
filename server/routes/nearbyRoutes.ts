import { Router } from "express";
import { requireUser } from "../middleware";
import { 
  grpcPingLocation, 
  grpcFindNearby, 
  grpcSendConnectionRequest, 
  grpcRespondToConnection 
} from "../grpc/nearby.client";

const router = Router();

// 1. Ping Location
router.post('/location/ping', requireUser, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    // req.user exists because of requireUser middleware
    const userId = req.user!.id.toString(); 
    
    await grpcPingLocation(userId, latitude, longitude);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Find Nearby
router.get('/', requireUser, async (req, res) => {
  try {
    const userId = req.user!.id.toString();
    const { lat, lng, radius } = req.query;
    
    const candidates = await grpcFindNearby(
      userId, 
      parseFloat(lat as string), 
      parseFloat(lng as string), 
      parseInt(radius as string) || 2000
    );
    
    res.json({ success: true, data: candidates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Connection Request
router.post('/connections/request', requireUser, async (req, res) => {
  try {
    const senderId = req.user!.id.toString();
    const { receiverId } = req.body;
    
    await grpcSendConnectionRequest(senderId, receiverId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Connection Response
router.post('/connections/respond', requireUser, async (req, res) => {
  try {
    const responderId = req.user!.id.toString();
    const { senderId, status } = req.body;
    
    await grpcRespondToConnection(responderId, senderId, status);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
