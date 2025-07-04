import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertHotelSchema, 
  insertTripPackageSchema, 
  insertBookingSchema,
  insertReviewSchema 
} from "@shared/schema";
import { cacheControl, memoryCache } from "./middleware/cache";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(400).json({ error: "Registration failed", details: error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, username, password } = req.body;
      let user;
      
      if (email) {
        user = await storage.getUserByEmail(email);
      } else if (username) {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, email: user.email, userType: user.userType }
      });
    } catch (error) {
      res.status(400).json({ error: "Login failed", details: error });
    }
  });

  // Hotel routes
  app.get("/api/hotels", cacheControl.apiCache, async (req, res) => {
    try {
      // Check cache first
      const cacheKey = 'hotels:all';
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const hotels = await storage.getHotels();
      memoryCache.set(cacheKey, hotels, 300); // Cache for 5 minutes
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hotels", details: error });
    }
  });

  app.get("/api/hotels/:id", cacheControl.apiCache, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check cache first
      const cacheKey = `hotel:${id}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const hotel = await storage.getHotel(id);
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }
      
      memoryCache.set(cacheKey, hotel, 300); // Cache for 5 minutes
      res.json(hotel);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hotel", details: error });
    }
  });

  app.post("/api/hotels", async (req, res) => {
    try {
      const hotelData = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(hotelData);
      res.json(hotel);
    } catch (error) {
      res.status(400).json({ error: "Failed to create hotel", details: error });
    }
  });

  // Trip package routes
  app.get("/api/trips/packages", cacheControl.apiCache, async (req, res) => {
    try {
      // Check cache first
      const cacheKey = 'trips:packages:all';
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const packages = await storage.getTripPackages();
      memoryCache.set(cacheKey, packages, 300); // Cache for 5 minutes
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip packages", details: error });
    }
  });

  app.get("/api/trips/packages/:id", cacheControl.apiCache, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check cache first
      const cacheKey = `trip:package:${id}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const tripPackage = await storage.getTripPackage(id);
      if (!tripPackage) {
        return res.status(404).json({ error: "Trip package not found" });
      }
      
      memoryCache.set(cacheKey, tripPackage, 300); // Cache for 5 minutes
      res.json(tripPackage);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip package", details: error });
    }
  });

  app.post("/api/trips/packages", async (req, res) => {
    try {
      const packageData = insertTripPackageSchema.parse(req.body);
      const tripPackage = await storage.createTripPackage(packageData);
      res.json(tripPackage);
    } catch (error) {
      res.status(400).json({ error: "Failed to create trip package", details: error });
    }
  });

  // Booking routes
  app.get("/api/bookings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bookings = await storage.getBookings(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings", details: error });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: "Failed to create booking", details: error });
    }
  });

  app.put("/api/bookings/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const booking = await storage.updateBookingStatus(id, status);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: "Failed to update booking status", details: error });
    }
  });

  // Review routes
  app.get("/api/reviews", async (req, res) => {
    try {
      const { hotelId, tripPackageId } = req.query;
      const reviews = await storage.getReviews(
        hotelId ? parseInt(hotelId as string) : undefined,
        tripPackageId ? parseInt(tripPackageId as string) : undefined
      );
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews", details: error });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ error: "Failed to create review", details: error });
    }
  });

  // Travel Tools API endpoints
  app.post("/api/tools/expenses-tracker", async (req, res) => {
    try {
      const { from, to, mode, travelers, addons } = req.body;
      
      // Mock expense calculation
      const basePrice = 5000;
      const modeMultiplier = mode === "flight" ? 3 : mode === "train" ? 1.5 : 1;
      const totalCost = basePrice * modeMultiplier * travelers;
      
      res.json({
        from,
        to,
        mode,
        travelers,
        breakdown: {
          transport: totalCost * 0.4,
          accommodation: totalCost * 0.3,
          food: totalCost * 0.2,
          activities: totalCost * 0.1
        },
        total: totalCost
      });
    } catch (error) {
      res.status(400).json({ error: "Expense calculation failed", details: error });
    }
  });

  app.post("/api/tools/visa-check", async (req, res) => {
    try {
      const { nationality, destination } = req.body;
      
      // Mock visa data
      const visaInfo = {
        visaRequired: true,
        documentsNeeded: ["Passport", "Photos", "Bank Statement", "Travel Insurance"],
        processingTime: "15 working days",
        fee: "$80"
      };
      
      res.json({
        nationality,
        destination,
        ...visaInfo
      });
    } catch (error) {
      res.status(400).json({ error: "Visa check failed", details: error });
    }
  });

  app.get("/api/tools/mood-quiz/:mood", async (req, res) => {
    try {
      const { mood } = req.params;
      
      const moodDestinations = {
        relax: ["Goa", "Manali", "Coorg"],
        adventure: ["Rishikesh", "Leh", "Auli"],
        cultural: ["Jaipur", "Varanasi", "Delhi"],
        nature: ["Munnar", "Darjeeling", "Ooty"]
      };
      
      res.json({
        mood,
        destinations: moodDestinations[mood as keyof typeof moodDestinations] || ["Mumbai", "Bangalore"]
      });
    } catch (error) {
      res.status(400).json({ error: "Mood quiz failed", details: error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
