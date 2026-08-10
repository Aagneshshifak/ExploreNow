import { Router } from "express";
import { requireUser } from "../middleware";

const router = Router();

// Use the nearby-service's public HTTP URL instead of gRPC
// gRPC requires a separate port (50051) which Render web services can't expose
const NEARBY_SERVICE_URL = process.env.NEARBY_SERVICE_URL || 'http://localhost:10000';

// Helper to make HTTP requests to the nearby-service REST API
async function nearbyFetch(path: string, options: RequestInit = {}) {
  const url = `${NEARBY_SERVICE_URL}/api/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Nearby service request failed: ${res.status}`);
  }
  return data;
}

// 1. Ping Location
router.post('/location/ping', requireUser, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    // req.user exists because of requireUser middleware
    const userId = req.user!.id.toString(); 
    
    await nearbyFetch('/location/ping', {
      method: 'POST',
      body: JSON.stringify({ userId, latitude, longitude }),
    });
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
    
    const data = await nearbyFetch(
      `/nearby?userId=${userId}&lat=${lat}&lng=${lng}&radius=${radius || 2000}`
    );
    
    // The REST API already returns camelCase, but normalize just in case
    const candidates = (data.data || []).map((c: any) => ({
      userId: c.userId || c.user_id,
      username: c.username,
      avatarUrl: c.avatarUrl || c.avatar_url,
      approximateDistanceMeters: c.approximateDistanceMeters || c.approximate_distance_meters,
      exactLatitude: c.exactLatitude || c.exact_latitude || undefined,
      exactLongitude: c.exactLongitude || c.exact_longitude || undefined,
      isConnected: c.isConnected || c.is_connected,
    }));
    
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
    
    await nearbyFetch('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ senderId, receiverId }),
    });
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
    
    await nearbyFetch('/connections/respond', {
      method: 'POST',
      body: JSON.stringify({ responderId, senderId, status }),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

