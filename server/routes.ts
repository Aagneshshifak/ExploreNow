import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { requireUser, requireAdmin, generateToken, createResponse } from "./middleware";
import { convertCurrency } from "./controllers/utils";
import { 
  loginSchema, 
  registerSchema, 
  insertTripSchema, 
  insertHotelSchema, 
  insertBookingSchema,
  currencyConversionSchema,
  type LoginRequest,
  type RegisterRequest
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================
  
  // Register - POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, null, "Invalid input data")
        );
      }
      
      const { name, email, password, role } = validation.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json(
          createResponse(false, null, "User already exists with this email")
        );
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const newUser = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role: role || "user"
      });
      
      // Generate token
      const token = generateToken(newUser);
      
      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(
        createResponse(true, { user: userWithoutPassword, token }, "User registered successfully")
      );
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json(
        createResponse(false, null, "Registration failed")
      );
    }
  });
  
  // Login - POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, null, "Invalid email or password format")
        );
      }
      
      const { email, password } = validation.data;
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json(
          createResponse(false, null, "Invalid email or password")
        );
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json(
          createResponse(false, null, "Invalid email or password")
        );
      }
      
      // Generate token
      const token = generateToken(user);
      
      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(
        createResponse(true, { user: userWithoutPassword, token }, "Login successful")
      );
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json(
        createResponse(false, null, "Login failed")
      );
    }
  });
  
  // Logout - POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json(createResponse(true, null, "Logged out successfully"));
  });
  
  // Get current user - GET /api/auth/me
  app.get("/api/auth/me", requireUser, (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json(createResponse(true, userWithoutPassword, "User data retrieved"));
  });
  
  // ============================================
  // TRIPS ROUTES (Admin only for CUD, Users can read)
  // ============================================
  
  // Get all trips - GET /api/trips
  app.get("/api/trips", async (req, res) => {
    try {
      const trips = await storage.getAllTrips();
      res.json(createResponse(true, trips, "Trips retrieved successfully"));
    } catch (error) {
      console.error("Get trips error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve trips"));
    }
  });
  
  // Get single trip - GET /api/trips/:id
  app.get("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, null, "Invalid trip ID"));
      }
      
      const trip = await storage.getTrip(id);
      if (!trip) {
        return res.status(404).json(createResponse(false, null, "Trip not found"));
      }
      
      res.json(createResponse(true, trip, "Trip retrieved successfully"));
    } catch (error) {
      console.error("Get trip error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve trip"));
    }
  });
  
  // Create trip - POST /api/trips (Admin only)
  app.post("/api/trips", requireAdmin, async (req, res) => {
    try {
      const validation = insertTripSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, validation.error.errors, "Invalid trip data")
        );
      }
      
      const trip = await storage.createTrip(validation.data);
      res.status(201).json(createResponse(true, trip, "Trip created successfully"));
    } catch (error) {
      console.error("Create trip error:", error);
      res.status(500).json(createResponse(false, null, "Failed to create trip"));
    }
  });
  
  // Update trip - PUT /api/trips/:id (Admin only)
  app.put("/api/trips/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, null, "Invalid trip ID"));
      }
      
      const validation = insertTripSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, validation.error.errors, "Invalid trip data")
        );
      }
      
      const trip = await storage.updateTrip(id, validation.data);
      if (!trip) {
        return res.status(404).json(createResponse(false, null, "Trip not found"));
      }
      
      res.json(createResponse(true, trip, "Trip updated successfully"));
    } catch (error) {
      console.error("Update trip error:", error);
      res.status(500).json(createResponse(false, null, "Failed to update trip"));
    }
  });
  
  // Delete trip - DELETE /api/trips/:id (Admin only)
  app.delete("/api/trips/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, null, "Invalid trip ID"));
      }
      
      const deleted = await storage.deleteTrip(id);
      if (!deleted) {
        return res.status(404).json(createResponse(false, null, "Trip not found"));
      }
      
      res.json(createResponse(true, null, "Trip deleted successfully"));
    } catch (error) {
      console.error("Delete trip error:", error);
      res.status(500).json(createResponse(false, null, "Failed to delete trip"));
    }
  });
  
  // ============================================
  // HOTELS ROUTES (Admin only for CUD, Users can read)
  // ============================================
  
  // Get all hotels - GET /api/hotels
  app.get("/api/hotels", async (req, res) => {
    try {
      const hotels = await storage.getAllHotels();
      res.json(createResponse(true, hotels, "Hotels retrieved successfully"));
    } catch (error) {
      console.error("Get hotels error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve hotels"));
    }
  });
  
  // Get single hotel - GET /api/hotels/:id
  app.get("/api/hotels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, null, "Invalid hotel ID"));
      }
      
      const hotel = await storage.getHotel(id);
      if (!hotel) {
        return res.status(404).json(createResponse(false, null, "Hotel not found"));
      }
      
      res.json(createResponse(true, hotel, "Hotel retrieved successfully"));
    } catch (error) {
      console.error("Get hotel error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve hotel"));
    }
  });
  
  // Create hotel - POST /api/hotels (Admin only)
  app.post("/api/hotels", requireAdmin, async (req, res) => {
    try {
      const validation = insertHotelSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, validation.error.errors, "Invalid hotel data")
        );
      }
      
      const hotel = await storage.createHotel(validation.data);
      res.status(201).json(createResponse(true, hotel, "Hotel created successfully"));
    } catch (error) {
      console.error("Create hotel error:", error);
      res.status(500).json(createResponse(false, null, "Failed to create hotel"));
    }
  });
  
  // Update hotel - PUT /api/hotels/:id (Admin only)
  app.put("/api/hotels/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, null, "Invalid hotel ID"));
      }
      
      const validation = insertHotelSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, validation.error.errors, "Invalid hotel data")
        );
      }
      
      const hotel = await storage.updateHotel(id, validation.data);
      if (!hotel) {
        return res.status(404).json(createResponse(false, null, "Hotel not found"));
      }
      
      res.json(createResponse(true, hotel, "Hotel updated successfully"));
    } catch (error) {
      console.error("Update hotel error:", error);
      res.status(500).json(createResponse(false, null, "Failed to update hotel"));
    }
  });
  
  // Delete hotel - DELETE /api/hotels/:id (Admin only)
  app.delete("/api/hotels/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, null, "Invalid hotel ID"));
      }
      
      const deleted = await storage.deleteHotel(id);
      if (!deleted) {
        return res.status(404).json(createResponse(false, null, "Hotel not found"));
      }
      
      res.json(createResponse(true, null, "Hotel deleted successfully"));
    } catch (error) {
      console.error("Delete hotel error:", error);
      res.status(500).json(createResponse(false, null, "Failed to delete hotel"));
    }
  });
  
  // ============================================
  // BOOKINGS ROUTES (Users can create and view their own)
  // ============================================
  
  // Get user's bookings - GET /api/bookings
  app.get("/api/bookings", requireUser, async (req, res) => {
    try {
      const bookings = await storage.getUserBookings(req.user!.id);
      res.json(createResponse(true, bookings, "Bookings retrieved successfully"));
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve bookings"));
    }
  });

  // Get user's booking history with analytics - GET /api/bookings/history
  app.get("/api/bookings/history", requireUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const bookings = await storage.getUserBookingsWithDetails(userId);
      
      // Calculate analytics
      const totalSpent = bookings.reduce((sum: number, booking: any) => {
        return sum + parseFloat(booking.totalPrice);
      }, 0);
      
      const bookingsByStatus = bookings.reduce((acc: Record<string, number>, booking: any) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const bookingsByType = bookings.reduce((acc: Record<string, number>, booking: any) => {
        acc[booking.type] = (acc[booking.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Group bookings by month for chart data
      const bookingsByMonth = bookings.reduce((acc: Record<string, { month: string; count: number; spent: number }>, booking: any) => {
        const month = new Date(booking.bookingDate!).toISOString().slice(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { month, count: 0, spent: 0 };
        }
        acc[month].count += 1;
        acc[month].spent += parseFloat(booking.totalPrice);
        return acc;
      }, {} as Record<string, { month: string; count: number; spent: number }>);
      
      const monthlyData = Object.values(bookingsByMonth).sort((a: { month: string }, b: { month: string }) => 
        a.month.localeCompare(b.month)
      );
      
      const analytics = {
        totalBookings: bookings.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        bookingsByStatus,
        bookingsByType,
        monthlyData
      };
      
      res.json(createResponse(true, { bookings, analytics }, "Booking history retrieved successfully"));
    } catch (error) {
      console.error("Get booking history error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve booking history"));
    }
  });
  
  // Book a trip - POST /api/bookings/trip/:tripId
  app.post("/api/bookings/trip/:tripId", requireUser, async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      if (isNaN(tripId)) {
        return res.status(400).json(createResponse(false, null, "Invalid trip ID"));
      }
      
      // Verify trip exists
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json(createResponse(false, null, "Trip not found"));
      }
      
      const bookingData = {
        userId: req.user!.id,
        tripId: tripId,
        hotelId: null,
        type: "trip" as const,
        totalPrice: trip.price,
        checkIn: req.body.checkIn ? new Date(req.body.checkIn) : null,
        checkOut: req.body.checkOut ? new Date(req.body.checkOut) : null,
      };
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(createResponse(true, booking, "Trip booked successfully"));
    } catch (error) {
      console.error("Book trip error:", error);
      res.status(500).json(createResponse(false, null, "Failed to book trip"));
    }
  });
  
  // Book a hotel - POST /api/bookings/hotel/:hotelId
  app.post("/api/bookings/hotel/:hotelId", requireUser, async (req, res) => {
    try {
      const hotelId = parseInt(req.params.hotelId);
      if (isNaN(hotelId)) {
        return res.status(400).json(createResponse(false, null, "Invalid hotel ID"));
      }
      
      // Verify hotel exists
      const hotel = await storage.getHotel(hotelId);
      if (!hotel) {
        return res.status(404).json(createResponse(false, null, "Hotel not found"));
      }
      
      const { checkIn, checkOut, nights } = req.body;
      const totalPrice = parseFloat(hotel.price) * (nights || 1);
      
      const bookingData = {
        userId: req.user!.id,
        tripId: null,
        hotelId: hotelId,
        type: "hotel" as const,
        totalPrice: totalPrice.toString(),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
      };
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(createResponse(true, booking, "Hotel booked successfully"));
    } catch (error) {
      console.error("Book hotel error:", error);
      res.status(500).json(createResponse(false, null, "Failed to book hotel"));
    }
  });
  
  // ============================================
  // ADMIN ANALYTICS ROUTES
  // ============================================
  
  // Get analytics - GET /api/admin/analytics (Admin only)
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(createResponse(true, analytics, "Analytics retrieved successfully"));
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve analytics"));
    }
  });
  
  // ============================================
  // CURRENCY CONVERSION UTILITY
  // ============================================
  
  // Convert currency - GET /api/utils/convert-currency
  app.get("/api/utils/convert-currency", convertCurrency);
  
  // ============================================
  // AI FEATURES - TRIP RECOMMENDATIONS & ROUTE PLANNING
  // ============================================
  
  // AI Trip Recommender - POST /api/ai/recommend
  app.post("/api/ai/recommend", requireUser, async (req, res) => {
    try {
      const { budget, interests, duration, destination } = req.body;
      
      // Mock AI recommendations for now - can be replaced with OpenAI integration later
      const mockRecommendations = [
        {
          id: 1,
          name: "Shimla Snow Trails",
          location: "Shimla, India",
          cost: 200,
          duration: "3 days",
          tags: ["Snow", "Mountains", "Adventure"],
          description: "Experience the magic of snow-capped mountains in Shimla with adventure activities.",
          rating: 4.5,
          includes: ["Hotel", "Meals", "Sightseeing"]
        },
        {
          id: 2,
          name: "Goa Beach Paradise",
          location: "Goa, India",
          cost: 150,
          duration: "4 days",
          tags: ["Beach", "Relaxation", "Nightlife"],
          description: "Relax on pristine beaches with vibrant nightlife and water sports.",
          rating: 4.3,
          includes: ["Beach Resort", "Water Sports", "Local Cuisine"]
        },
        {
          id: 3,
          name: "Kerala Backwater Cruise",
          location: "Kerala, India",
          cost: 300,
          duration: "5 days",
          tags: ["Nature", "Backwaters", "Culture"],
          description: "Discover the serene backwaters of Kerala with houseboat stays.",
          rating: 4.7,
          includes: ["Houseboat", "Traditional Meals", "Cultural Tours"]
        },
        {
          id: 4,
          name: "Rajasthan Heritage Tour",
          location: "Rajasthan, India",
          cost: 250,
          duration: "6 days",
          tags: ["Heritage", "Culture", "Architecture"],
          description: "Explore magnificent palaces and forts in the royal state of Rajasthan.",
          rating: 4.6,
          includes: ["Heritage Hotels", "Palace Tours", "Cultural Shows"]
        }
      ];

      // Filter recommendations based on budget and interests
      let filteredRecommendations = mockRecommendations;
      
      if (budget) {
        filteredRecommendations = filteredRecommendations.filter(trip => trip.cost <= budget);
      }
      
      if (interests && interests.length > 0) {
        filteredRecommendations = filteredRecommendations.filter(trip => 
          trip.tags.some(tag => interests.some((interest: string) => 
            tag.toLowerCase().includes(interest.toLowerCase()) || 
            interest.toLowerCase().includes(tag.toLowerCase())
          ))
        );
      }

      // Sort by rating and cost
      filteredRecommendations.sort((a, b) => b.rating - a.rating);

      res.json(createResponse(true, {
        trips: filteredRecommendations.slice(0, 6),
        totalFound: filteredRecommendations.length,
        searchCriteria: { budget, interests, duration, destination }
      }, "Trip recommendations generated successfully"));
    } catch (error) {
      console.error("AI recommend error:", error);
      res.status(500).json(createResponse(false, null, "Failed to generate recommendations"));
    }
  });

  // AI Route Planner - POST /api/ai/route-planner
  app.post("/api/ai/route-planner", requireUser, async (req, res) => {
    try {
      const { destinations, startLocation, travelMode, duration } = req.body;
      
      // Mock route planning response - can be replaced with actual route optimization
      const mockRoute = {
        totalDistance: "1,250 km",
        totalDuration: "15 hours driving",
        estimatedCost: "$400",
        route: destinations.map((dest: string, index: number) => ({
          order: index + 1,
          destination: dest,
          arrivalTime: `Day ${index + 1}`,
          stayDuration: "2 days",
          activities: ["Sightseeing", "Local Cuisine", "Cultural Sites"],
          estimatedCost: "$" + (50 + Math.floor(Math.random() * 100))
        })),
        recommendations: [
          "Start early morning for better traffic conditions",
          "Book accommodations in advance during peak season",
          "Try local specialties at each destination",
          "Keep emergency contacts and documents handy"
        ]
      };

      res.json(createResponse(true, mockRoute, "Route planned successfully"));
    } catch (error) {
      console.error("Route planner error:", error);
      res.status(500).json(createResponse(false, null, "Failed to plan route"));
    }
  });

  // AI placeholder for other future AI routes
  app.use("/api/ai/*", (req, res) => {
    res.json(createResponse(true, null, "AI Feature Coming Soon"));
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
