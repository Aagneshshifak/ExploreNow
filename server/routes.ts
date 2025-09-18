import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "./db";
import { bookings, trips, hotels } from "@shared/schema";
import { requireUser, requireAdmin, generateToken, createResponse } from "./middleware";
import { convertCurrency } from "./controllers/utils";
import { emailService } from "./services/emailService";
import { 
  loginSchema, 
  registerSchema, 
  insertTripSchema, 
  insertHotelSchema, 
  insertBookingSchema,
  insertPaymentSchema,
  paymentFormSchema,
  currencyConversionSchema,
  tripFilterSchema,
  budgetFilterSchema,
  aiRecommendationSchema,
  type LoginRequest,
  type RegisterRequest,
  type TripFilterData,
  type BudgetFilterData,
  type AIRecommendationData,
  type PaymentFormData
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================
  
  // Register - POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration request body:", req.body);
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("Validation errors:", validation.error.errors);
        return res.status(400).json(
          createResponse(false, null, `Invalid input data: ${validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
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
      
      // Send welcome email (non-blocking)
      emailService.sendWelcomeEmail(email, name).catch((error) => {
        console.log('Welcome email failed, but user registration successful:', error.message);
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
      console.log("Login request body:", req.body);
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("Login validation errors:", validation.error.errors);
        return res.status(400).json(
          createResponse(false, null, `Invalid email or password format: ${validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
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

  // Test endpoint to check cookies - GET /api/auth/test
  app.get("/api/auth/test", (req, res) => {
    console.log('Cookies:', req.cookies);
    console.log('Headers:', req.headers);
    res.json(createResponse(true, { 
      cookies: req.cookies, 
      hasToken: !!req.cookies.token,
      userAgent: req.headers['user-agent']
    }, "Test endpoint"));
  });

  // Get user bookings with details - GET /api/bookings/dashboard
  app.get("/api/bookings/dashboard", requireUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Fetch bookings with trip and hotel details using Drizzle
      const userBookings = await db
        .select({
          id: bookings.id,
          type: bookings.type,
          status: bookings.status,
          amount: bookings.amount,
          checkIn: bookings.checkIn,
          checkOut: bookings.checkOut,
          createdAt: bookings.createdAt,
          tripId: trips.id,
          tripTitle: trips.title,
          tripLocation: trips.location,
          tripImageUrl: trips.imageUrl,
          hotelId: hotels.id,
          hotelName: hotels.name,
          hotelLocation: hotels.location,
          hotelImageUrl: hotels.imageUrl,
        })
        .from(bookings)
        .leftJoin(trips, eq(bookings.tripId, trips.id))
        .leftJoin(hotels, eq(bookings.hotelId, hotels.id))
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt));

      // Group bookings by status
      const upcoming = userBookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn!) > new Date());
      const completed = userBookings.filter(b => b.status === 'completed');
      const cancelled = userBookings.filter(b => b.status === 'cancelled');

      res.json(createResponse(true, {
        upcoming,
        completed,
        cancelled,
        stats: {
          totalBookings: userBookings.length,
          totalSpent: userBookings.reduce((sum, b) => sum + b.amount, 0),
          upcomingTrips: upcoming.length,
          completedTrips: completed.length,
          cancelledTrips: cancelled.length
        }
      }, "Dashboard data retrieved successfully"));
    } catch (error) {
      console.error("Dashboard data error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve dashboard data"));
    }
  });

  // Get user hotel bookings - GET /api/bookings/hotels
  app.get("/api/bookings/hotels", requireUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Fetch all bookings for the user
      const userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt));
      
      // Process bookings to get hotel-related data
      const hotelBookings = [];
      for (const booking of userBookings) {
        if (booking.hotelId) {
          // Direct hotel booking
          const hotel = await db
            .select()
            .from(hotels)
            .where(eq(hotels.id, parseInt(booking.hotelId)))
            .limit(1);
          
          if (hotel[0]) {
            hotelBookings.push({
              id: booking.id,
              type: booking.type,
              status: booking.status,
              amount: parseFloat(booking.amount),
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              createdAt: booking.createdAt,
              hotelId: hotel[0].id,
              hotelName: hotel[0].name,
              hotelLocation: hotel[0].location,
              hotelImageUrl: hotel[0].imageUrl,
              hotelRating: hotel[0].rating ? parseFloat(hotel[0].rating) : null,
              hotelPrice: hotel[0].price ? parseFloat(hotel[0].price) : null,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              guests: booking.guests,
              specialRequests: booking.specialRequests
            });
          }
        } else if (booking.tripId && booking.type === 'hotel') {
          // Trip booking that includes hotel
          const trip = await db
            .select()
            .from(trips)
            .where(eq(trips.id, parseInt(booking.tripId)))
            .limit(1);
          
          if (trip[0]) {
            hotelBookings.push({
              id: booking.id,
              type: booking.type,
              status: booking.status,
              amount: parseFloat(booking.amount),
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              createdAt: booking.createdAt,
              tripId: trip[0].id,
              tripTitle: trip[0].title,
              tripLocation: trip[0].location,
              tripImageUrl: trip[0].imageUrl,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              guests: booking.guests,
              specialRequests: booking.specialRequests
            });
          }
        }
      }
      
      const filteredHotelBookings = hotelBookings;

      res.json(createResponse(true, {
        hotels: filteredHotelBookings,
        totalHotels: filteredHotelBookings.length,
        totalSpent: filteredHotelBookings.reduce((sum, b) => sum + b.amount, 0)
      }, "Hotel bookings retrieved successfully"));
    } catch (error) {
      console.error("Hotel bookings error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve hotel bookings"));
    }
  });

  // Get user transport bookings - GET /api/bookings/transports
  app.get("/api/bookings/transports", requireUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Fetch all bookings for the user
      const userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt));
      
      // Process bookings to get transport-related data
      const transportBookings = [];
      for (const booking of userBookings) {
        if (booking.tripId) {
          // Trip booking with transport
          const trip = await db
            .select()
            .from(trips)
            .where(eq(trips.id, parseInt(booking.tripId)))
            .limit(1);
          
          if (trip[0]) {
            transportBookings.push({
              id: booking.id,
              type: booking.type,
              status: booking.status,
              amount: parseFloat(booking.amount),
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              createdAt: booking.createdAt,
              transportType: booking.transportMode, // Map transportMode to transportType
              tripId: trip[0].id,
              tripTitle: trip[0].title,
              tripLocation: trip[0].location,
              tripImageUrl: trip[0].imageUrl,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              guests: booking.guests,
              transportDetails: booking.transportDetails
            });
          }
        } else if (booking.type === 'transport') {
          // Direct transport booking
          transportBookings.push({
            id: booking.id,
            type: booking.type,
            status: booking.status,
            amount: parseFloat(booking.amount),
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            createdAt: booking.createdAt,
            transportType: booking.transportMode, // Map transportMode to transportType
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            guests: booking.guests,
            transportDetails: booking.transportDetails
          });
        }
      }

      // Group by transport type
      const flights = transportBookings.filter(b => b.transportType === 'flight');
      const trains = transportBookings.filter(b => b.transportType === 'train');
      const buses = transportBookings.filter(b => b.transportType === 'bus');

      res.json(createResponse(true, {
        flights,
        trains,
        buses,
        allTransports: transportBookings,
        stats: {
          totalTransports: transportBookings.length,
          totalSpent: transportBookings.reduce((sum, b) => sum + b.amount, 0),
          flightCount: flights.length,
          trainCount: trains.length,
          busCount: buses.length
        }
      }, "Transport bookings retrieved successfully"));
    } catch (error) {
      console.error("Transport bookings error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve transport bookings"));
    }
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

  // PATCH trip - PATCH /api/admin/trips/:id (Admin only)
  app.patch("/api/admin/trips/:id", requireAdmin, async (req, res) => {
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

  // PATCH hotel - PATCH /api/admin/hotels/:id (Admin only)
  app.patch("/api/admin/hotels/:id", requireAdmin, async (req, res) => {
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
        amount: trip.price,
        currency: req.body.currency || 'USD',
        checkIn: req.body.checkIn ? new Date(req.body.checkIn) : null,
        checkOut: req.body.checkOut ? new Date(req.body.checkOut) : null,
      };
      
      const booking = await storage.createBooking(bookingData);
      
      // Send booking confirmation email
      const bookedTrip = await storage.getTrip(tripId);
      if (bookedTrip && req.user) {
        emailService.sendBookingConfirmation(
          req.user.email,
          req.user.name,
          {
            type: 'trip',
            itemName: bookedTrip.title,
            totalPrice: booking.amount || '0',
            checkIn: req.body.checkIn || '',
            checkOut: req.body.checkOut || '',
            bookingId: booking.id.toString()
          }
        );
      }
      
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
        amount: totalPrice.toString(),
        currency: req.body.currency || 'USD',
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
      };
      
      const booking = await storage.createBooking(bookingData);
      
      // Send booking confirmation email
      const bookedHotel = await storage.getHotel(hotelId);
      if (bookedHotel && req.user) {
        emailService.sendBookingConfirmation(
          req.user.email,
          req.user.name,
          {
            type: 'hotel',
            itemName: bookedHotel.name,
            totalPrice: booking.amount || '0',
            checkIn: checkIn || '',
            checkOut: checkOut || '',
            bookingId: booking.id.toString()
          }
        );
      }
      
      res.status(201).json(createResponse(true, booking, "Hotel booked successfully"));
    } catch (error) {
      console.error("Book hotel error:", error);
      res.status(500).json(createResponse(false, null, "Failed to book hotel"));
    }
  });

  // New streamlined booking endpoint - POST /api/bookings
  app.post("/api/bookings", requireUser, async (req, res) => {
    try {
      const { 
        tripId, 
        hotelId, 
        transportType,
        cost,
        customerName,
        customerEmail,
        customerPhone,
        checkIn,
        checkOut,
        guests
      } = req.body;
      
      // Validation - transportType is optional, cost is required
      if (!cost || isNaN(parseFloat(cost))) {
        return res.status(400).json(createResponse(false, null, "Valid cost is required"));
      }
      
      if (!tripId && !hotelId) {
        return res.status(400).json(createResponse(false, null, "Either trip ID or hotel ID is required"));
      }
      
      if (!customerName || !customerEmail || !customerPhone) {
        return res.status(400).json(createResponse(false, null, "Customer details (name, email, phone) are required"));
      }
      
      // Determine booking type based on what's provided
      const bookingType = tripId ? 'trip' : 'hotel';
      
      // Verify item exists
      if (bookingType === 'trip' && tripId) {
        const trip = await storage.getTrip(tripId);
        if (!trip) {
          return res.status(404).json(createResponse(false, null, "Trip not found"));
        }
      } else if (bookingType === 'hotel' && hotelId) {
        const hotel = await storage.getHotel(hotelId);
        if (!hotel) {
          return res.status(404).json(createResponse(false, null, "Hotel not found"));
        }
      }
      
      const bookingData = {
        userId: req.user!.id,
        tripId: bookingType === 'trip' ? tripId : null,
        hotelId: bookingType === 'hotel' ? hotelId : null,
        type: bookingType as 'trip' | 'hotel',
        amount: cost?.toString() || '0',
        currency: req.body.currency || 'USD',
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        guests: guests || 1,
        customerName: customerName || req.user!.name,
        customerEmail: customerEmail || req.user!.email,
        customerPhone: customerPhone || '',
        specialRequests: req.body.specialRequests || '',
        emergencyContact: req.body.emergencyContact || '',
        emergencyPhone: req.body.emergencyPhone || '',
        transportMode: transportType || '',
        status: 'confirmed'
      };
      
      const booking = await storage.createBooking(bookingData);
      
      // Send booking confirmation email
      const itemName = bookingType === 'trip' 
        ? (await storage.getTrip(tripId))?.title || 'Trip'
        : (await storage.getHotel(hotelId))?.name || 'Hotel';
        
      if (req.user) {
        emailService.sendBookingConfirmation(
          customerEmail || req.user.email,
          customerName || req.user.name,
          {
            type: bookingType,
            itemName,
            totalPrice: booking.amount || '0',
            checkIn: checkIn || '',
            checkOut: checkOut || '',
            bookingId: booking.id.toString()
          }
        );
      }
      
      res.status(201).json(createResponse(true, booking, "Booking created successfully"));
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json(createResponse(false, null, "Failed to create booking"));
    }
  });

  // Legacy detailed booking flow - POST /api/bookings/detailed
  app.post("/api/bookings/detailed", requireUser, async (req, res) => {
    try {
      const { tripId, hotelId, type, checkInDate, checkOutDate, guests, customerDetails, amount, currency } = req.body;
      
      // Validation
      if (!type || (type !== 'trip' && type !== 'hotel')) {
        return res.status(400).json(createResponse(false, null, "Invalid booking type"));
      }
      
      if (type === 'trip' && !tripId) {
        return res.status(400).json(createResponse(false, null, "Trip ID is required for trip bookings"));
      }
      
      if (type === 'hotel' && !hotelId) {
        return res.status(400).json(createResponse(false, null, "Hotel ID is required for hotel bookings"));
      }
      
      if (!checkInDate || !checkOutDate) {
        return res.status(400).json(createResponse(false, null, "Check-in and check-out dates are required"));
      }
      
      if (!customerDetails || !customerDetails.customerName || !customerDetails.customerEmail) {
        return res.status(400).json(createResponse(false, null, "Customer details are required"));
      }
      
      // Verify item exists
      if (type === 'trip') {
        const trip = await storage.getTrip(tripId);
        if (!trip) {
          return res.status(404).json(createResponse(false, null, "Trip not found"));
        }
      } else {
        const hotel = await storage.getHotel(hotelId);
        if (!hotel) {
          return res.status(404).json(createResponse(false, null, "Hotel not found"));
        }
      }
      
      const bookingData = {
        userId: req.user!.id,
        tripId: type === 'trip' ? tripId : null,
        hotelId: type === 'hotel' ? hotelId : null,
        type: type as 'trip' | 'hotel',
        amount: amount.toString(),
        currency: currency || 'USD',
        checkIn: new Date(checkInDate),
        checkOut: new Date(checkOutDate),
        guests: guests || 1,
        customerName: customerDetails?.customerName || req.user!.name,
        customerEmail: customerDetails?.customerEmail || req.user!.email,
        customerPhone: customerDetails?.customerPhone,
        specialRequests: customerDetails?.specialRequests,
        emergencyContact: customerDetails?.emergencyContact,
        emergencyPhone: customerDetails?.emergencyPhone,
        status: 'confirmed'
      };
      
      const booking = await storage.createBooking(bookingData);
      
      // Send booking confirmation email with detailed customer information
      const itemName = type === 'trip' 
        ? (await storage.getTrip(tripId))?.title || 'Trip'
        : (await storage.getHotel(hotelId))?.name || 'Hotel';
        
      emailService.sendBookingConfirmation(
        customerDetails?.customerEmail || req.user!.email,
        customerDetails?.customerName || req.user!.name,
        {
          type,
          itemName,
          totalPrice: booking.amount || '0',
          checkIn: checkInDate,
          checkOut: checkOutDate,
          bookingId: booking.id.toString()
        }
      );
      
      res.status(201).json(createResponse(true, booking, "Detailed booking created successfully"));
    } catch (error) {
      console.error("Detailed booking error:", error);
      res.status(500).json(createResponse(false, null, "Failed to create detailed booking"));
    }
  });
  
  // ============================================
  // ADMIN ROUTES
  // ============================================
  
  // Get all bookings (Admin only) - GET /api/admin/bookings
  app.get("/api/admin/bookings", requireAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(createResponse(true, bookings, "All bookings retrieved successfully"));
    } catch (error) {
      console.error("Get all bookings error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve all bookings"));
    }
  });

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

  // User dashboard - GET /api/user/bookings (User only)
  app.get("/api/user/bookings", requireUser, async (req, res) => {
    try {
      const bookings = await storage.getUserBookings(req.user!.id);
      res.json(createResponse(true, bookings, "User bookings retrieved successfully"));
    } catch (error) {
      console.error("Get user bookings error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve user bookings"));
    }
  });
  
  // ============================================
  // CURRENCY CONVERSION UTILITY
  // ============================================
  
  // Convert currency - GET /api/utils/convert-currency
  app.get("/api/utils/convert-currency", convertCurrency);

  // Get exchange rates - GET /api/utils/exchange-rates
  app.get("/api/utils/exchange-rates", async (req, res) => {
    try {
      const { base = 'USD' } = req.query;
      const baseCurrency = (base as string).toUpperCase();
      
      // Validate currency code
      if (baseCurrency.length !== 3) {
        return res.status(400).json(
          createResponse(false, null, "Base currency must be a 3-letter code")
        );
      }

      // Try to fetch live rates
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const apiUrl = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
        const response = await fetch(apiUrl, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'ExploreNow-API/1.0' }
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          return res.json(
            createResponse(true, {
              base: baseCurrency,
              rates: data.rates,
              date: data.date || new Date().toISOString().split('T')[0],
              source: "live"
            }, "Exchange rates retrieved successfully")
          );
        }
      } catch (fetchError) {
        console.log("Live exchange rates API failed, using fallback:", fetchError);
      }

      // Fallback rates based on USD
      const fallbackRates: Record<string, Record<string, number>> = {
        'USD': {
          'USD': 1.0, 'EUR': 0.85, 'GBP': 0.75, 'INR': 85.0, 'JPY': 110.0,
          'CAD': 1.25, 'AUD': 1.40, 'CHF': 0.92, 'CNY': 7.2, 'KRW': 1300.0
        },
        'EUR': {
          'USD': 1.18, 'EUR': 1.0, 'GBP': 0.88, 'INR': 100.0, 'JPY': 129.0,
          'CAD': 1.47, 'AUD': 1.65, 'CHF': 1.08, 'CNY': 8.5, 'KRW': 1530.0
        },
        'INR': {
          'USD': 0.012, 'EUR': 0.010, 'GBP': 0.009, 'INR': 1.0, 'JPY': 1.29,
          'CAD': 0.015, 'AUD': 0.016, 'CHF': 0.011, 'CNY': 0.085, 'KRW': 15.3
        }
      };

      const rates = fallbackRates[baseCurrency] || fallbackRates['USD'];
      
      res.json(
        createResponse(true, {
          base: baseCurrency,
          rates,
          date: new Date().toISOString().split('T')[0],
          source: "fallback"
        }, "Exchange rates retrieved successfully (fallback)")
      );
    } catch (error) {
      console.error("Exchange rates error:", error);
      res.status(500).json(
        createResponse(false, null, "Failed to retrieve exchange rates")
      );
    }
  });
  
  // ============================================
  // TRIP FILTERING & SEARCH ROUTES
  // ============================================

  // Filter trips - POST /api/trips/filter
  app.post("/api/trips/filter", async (req, res) => {
    try {
      const validation = tripFilterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, null, `Invalid filter data: ${validation.error.errors.map(e => e.message).join(', ')}`)
        );
      }

      const trips = await storage.getFilteredTrips(validation.data);
      res.json(createResponse(true, trips, "Trips filtered successfully"));
    } catch (error) {
      console.error("Filter trips error:", error);
      res.status(500).json(createResponse(false, null, "Failed to filter trips"));
    }
  });

  // Get trips by budget - POST /api/trips/budget
  app.post("/api/trips/budget", async (req, res) => {
    try {
      const validation = budgetFilterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, null, `Invalid budget data: ${validation.error.errors.map(e => e.message).join(', ')}`)
        );
      }

      const { budget, currency } = validation.data;
      const trips = await storage.getTripsByBudget(budget, currency);
      res.json(createResponse(true, trips, "Budget-filtered trips retrieved successfully"));
    } catch (error) {
      console.error("Budget filter error:", error);
      res.status(500).json(createResponse(false, null, "Failed to filter trips by budget"));
    }
  });



  // Get user's trip suggestions - GET /api/user/suggestions
  app.get("/api/user/suggestions", requireUser, async (req, res) => {
    try {
      const suggestions = await storage.getUserSuggestions(req.user!.id);
      res.json(createResponse(true, suggestions, "User suggestions retrieved successfully"));
    } catch (error) {
      console.error("Get suggestions error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve suggestions"));
    }
  });

  // ============================================
  // USER PREFERENCES ROUTES
  // ============================================

  // Get user preferences - GET /api/user/preferences
  app.get("/api/user/preferences", requireUser, async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.user!.id);
      res.json(createResponse(true, preferences, "User preferences retrieved successfully"));
    } catch (error) {
      console.error("Get user preferences error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve user preferences"));
    }
  });

  // Create/update user preferences - POST /api/user/preferences
  app.post("/api/user/preferences", requireUser, async (req, res) => {
    try {
      const validation = insertUserPreferencesSchema.safeParse({
        ...req.body,
        userId: req.user!.id
      });
      
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, null, `Invalid preferences data: ${validation.error.errors.map(e => e.message).join(', ')}`)
        );
      }

      // Check if preferences exist
      const existing = await storage.getUserPreferences(req.user!.id);
      let preferences;
      
      if (existing) {
        preferences = await storage.updateUserPreferences(req.user!.id, validation.data);
      } else {
        preferences = await storage.createUserPreferences(validation.data);
      }

      res.json(createResponse(true, preferences, "User preferences saved successfully"));
    } catch (error) {
      console.error("Save user preferences error:", error);
      res.status(500).json(createResponse(false, null, "Failed to save user preferences"));
    }
  });

  // ============================================
  // REVIEWS ROUTES
  // ============================================
  
  // Get reviews - GET /api/reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const { type, itemId } = req.query;
      const reviews = await storage.getReviews(
        type as 'trip' | 'hotel' | undefined,
        itemId ? parseInt(itemId as string) : undefined
      );
      res.json(createResponse(true, reviews, "Reviews retrieved successfully"));
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve reviews"));
    }
  });
  
  // Create review - POST /api/reviews (Auth required)
  app.post("/api/reviews", requireUser, async (req, res) => {
    try {
      const { tripId, hotelId, type, rating, title, comment, bookingId } = req.body;
      
      // Validation
      if (!type || !rating || !title || !comment) {
        return res.status(400).json(createResponse(false, null, "Missing required fields"));
      }
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json(createResponse(false, null, "Rating must be between 1 and 5"));
      }
      
      if (type === 'trip' && !tripId) {
        return res.status(400).json(createResponse(false, null, "Trip ID is required for trip reviews"));
      }
      
      if (type === 'hotel' && !hotelId) {
        return res.status(400).json(createResponse(false, null, "Hotel ID is required for hotel reviews"));
      }
      
      // Check if user has booked this item (for verified reviews)
      let isVerified = false;
      if (bookingId) {
        const booking = await storage.getBooking(bookingId);
        if (booking && booking.userId === req.user!.id && booking.status === 'confirmed') {
          isVerified = true;
        }
      }
      
      const reviewData = {
        userId: req.user!.id,
        tripId: tripId || null,
        hotelId: hotelId || null,
        bookingId: bookingId || null,
        type,
        rating: parseInt(rating),
        title,
        comment,
        isVerified,
      };
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(createResponse(true, review, "Review created successfully"));
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json(createResponse(false, null, "Failed to create review"));
    }
  });
  
  // Get user's reviews - GET /api/reviews/my (Auth required)
  app.get("/api/reviews/my", requireUser, async (req, res) => {
    try {
      const reviews = await storage.getUserReviews(req.user!.id);
      res.json(createResponse(true, reviews, "User reviews retrieved successfully"));
    } catch (error) {
      console.error("Get user reviews error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve user reviews"));
    }
  });
  
  // ============================================
  // AI FEATURES - TRIP RECOMMENDATIONS & ROUTE PLANNING
  // ============================================
  
  // AI Trip Recommender - POST /api/ai/recommend
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { budget, interests, duration, destination, travelStyle } = req.body;
      
      // Input validation
      if (!budget || !interests || !duration) {
        return res.status(400).json(createResponse(false, null, "Budget, interests, and duration are required"));
      }

      const { GeminiTravelService } = await import("./services/geminiService.js");
      const geminiService = new GeminiTravelService();
      
      const recommendations = await geminiService.generateTripRecommendations(
        Number(budget),
        Array.isArray(interests) ? interests : [interests],
        Number(duration),
        destination,
        travelStyle
      );

      res.json(createResponse(true, {
        trips: recommendations,
        totalFound: recommendations.length,
        searchCriteria: { budget, interests, duration, destination, travelStyle },
        aiPowered: true
      }, "AI-powered trip recommendations generated successfully"));
    } catch (error) {
      console.error("AI recommend error:", error);
      res.status(500).json(createResponse(false, null, "Failed to generate AI recommendations: " + (error instanceof Error ? error.message : 'Unknown error')));
    }
  });

  // AI Budget Trip Suggestions - POST /api/ai/budget-suggestions
  app.post("/api/ai/budget-suggestions", async (req, res) => {
    try {
      const { budget, currency, preferences, duration } = req.body;
      
      // Input validation
      if (!budget) {
        return res.status(400).json(createResponse(false, null, "Budget is required"));
      }

      const { GeminiTravelService } = await import("./services/geminiService.js");
      const geminiService = new GeminiTravelService();
      
      const recommendations = await geminiService.generateBudgetTripSuggestions(
        Number(budget),
        currency || "USD",
        Array.isArray(preferences) ? preferences : preferences ? [preferences] : undefined,
        duration ? Number(duration) : undefined
      );

      res.json(createResponse(true, {
        trips: recommendations,
        totalFound: recommendations.length,
        searchCriteria: { budget, currency, preferences, duration },
        aiPowered: true
      }, "AI-powered budget trip suggestions generated successfully"));
    } catch (error) {
      console.error("AI budget suggestions error:", error);
      res.status(500).json(createResponse(false, null, "Failed to generate budget suggestions: " + (error instanceof Error ? error.message : 'Unknown error')));
    }
  });

  // AI Route Planner - POST /api/ai/route-planner
  app.post("/api/ai/route-planner", requireUser, async (req, res) => {
    try {
      const { destinations, startLocation, travelMode, duration, budget } = req.body;
      
      // Input validation
      if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
        return res.status(400).json(createResponse(false, null, "At least one destination is required"));
      }
      if (!startLocation || !travelMode || !duration) {
        return res.status(400).json(createResponse(false, null, "Start location, travel mode, and duration are required"));
      }

      const { geminiService } = await import("./services/geminiService.js");
      
      const optimizedRoute = await geminiService.optimizeRoute(
        destinations,
        startLocation,
        travelMode,
        Number(duration),
        budget ? Number(budget) : undefined
      );

      res.json(createResponse(true, {
        ...optimizedRoute,
        aiPowered: true,
        searchCriteria: { destinations, startLocation, travelMode, duration, budget }
      }, "AI-optimized route generated successfully"));
    } catch (error) {
      console.error("Route planner error:", error);
      res.status(500).json(createResponse(false, null, "Failed to generate AI route plan: " + (error instanceof Error ? error.message : 'Unknown error')));
    }
  });

  // AI Travel Assistant - POST /api/ai/assistant
  app.post("/api/ai/assistant", async (req, res) => {
    try {
      const { query, userContext } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json(createResponse(false, null, "Query is required"));
      }

      const { geminiService } = await import("./services/geminiService.js");
      
      const assistance = await geminiService.provideTravelAssistance(query, userContext);

      res.json(createResponse(true, {
        ...assistance,
        aiPowered: true,
        timestamp: new Date().toISOString()
      }, "AI travel assistance provided successfully"));
    } catch (error) {
      console.error("AI assistant error:", error);
      res.status(500).json(createResponse(false, null, "Failed to provide AI assistance: " + (error instanceof Error ? error.message : 'Unknown error')));
    }
  });

  // AI Destination Insights - GET /api/ai/destination/:destination
  app.get("/api/ai/destination/:destination", async (req, res) => {
    try {
      const { destination } = req.params;
      
      if (!destination) {
        return res.status(400).json(createResponse(false, null, "Destination parameter is required"));
      }

      const { geminiService } = await import("./services/geminiService.js");
      
      const insights = await geminiService.generateDestinationInsights(decodeURIComponent(destination));

      res.json(createResponse(true, {
        destination,
        ...insights,
        aiPowered: true,
        generatedAt: new Date().toISOString()
      }, "AI destination insights generated successfully"));
    } catch (error) {
      console.error("AI destination insights error:", error);
      res.status(500).json(createResponse(false, null, "Failed to generate destination insights: " + (error instanceof Error ? error.message : 'Unknown error')));
    }
  });

  // AI Chat Interface - POST /api/ai/chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json(createResponse(false, null, "Message is required"));
      }

      // Build context from conversation history
      let contextualQuery = message;
      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        const recentContext = conversationHistory
          .slice(-3) // Last 3 messages for context
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n');
        contextualQuery = `Previous conversation:\n${recentContext}\n\nCurrent question: ${message}`;
      }

      const { geminiService } = await import("./services/geminiService.js");
      
      const response = await geminiService.provideTravelAssistance(contextualQuery, {
        location: req.body.userLocation,
        budget: req.body.userBudget,
        travelDates: req.body.userTravelDates,
        groupSize: req.body.userGroupSize
      });

      res.json(createResponse(true, {
        message: response.response,
        category: response.category,
        confidence: response.confidence,
        suggestions: response.relatedSuggestions,
        aiPowered: true,
        timestamp: new Date().toISOString()
      }, "AI chat response generated successfully"));
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json(createResponse(false, null, "Failed to generate AI chat response: " + (error instanceof Error ? error.message : 'Unknown error')));
    }
  });
  
  // Simple booking endpoint for Phase 1 - POST /api/bookings/new
  app.post("/api/bookings/new", requireUser, async (req, res) => {
    try {
      const { 
        tripId, 
        hotelId, 
        transportType,
        cost,
        customerName,
        customerEmail,
        customerPhone,
        checkIn,
        checkOut,
        guests
      } = req.body;
      
      // Validation
      if (!cost || isNaN(parseFloat(cost))) {
        return res.status(400).json(createResponse(false, null, "Valid cost is required"));
      }
      
      if (!tripId && !hotelId) {
        return res.status(400).json(createResponse(false, null, "Either trip ID or hotel ID is required"));
      }
      
      if (!customerName || !customerEmail || !customerPhone) {
        return res.status(400).json(createResponse(false, null, "Customer details (name, email, phone) are required"));
      }
      
      if (!checkIn || !checkOut) {
        return res.status(400).json(createResponse(false, null, "Check-in and check-out dates are required"));
      }
      
      // Create booking with new schema
      const bookingResult = await sql`
        INSERT INTO bookings (
          trip_id, hotel_id, customer_name, email, phone, transport, 
          check_in, check_out, guests, total_cost, status, payment_status
        ) VALUES (
          ${tripId ? tripId.toString() : ''},
          ${hotelId ? hotelId.toString() : ''},
          ${customerName},
          ${customerEmail},
          ${customerPhone},
          ${transportType || 'flight'},
          ${checkIn},
          ${checkOut},
          ${parseInt((guests || 1).toString())},
          ${cost.toString()},
          ${'confirmed'},
          ${'dummy'}
        ) RETURNING *
      `;
      
      const booking = bookingResult[0];
      
      res.status(201).json(createResponse(true, booking, "Booking created successfully"));
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json(createResponse(false, null, "Failed to create booking"));
    }
  });



  // Get hotels by location - GET /api/hotels/location/:location
  app.get("/api/hotels/location/:location", async (req, res) => {
    try {
      const location = req.params.location;
      if (!location) {
        return res.status(400).json(createResponse(false, null, "Location parameter is required"));
      }
      
      const hotels = await storage.getHotelsByLocation(location);
      res.json(createResponse(true, hotels, "Hotels retrieved successfully"));
    } catch (error) {
      console.error("Get hotels by location error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve hotels"));
    }
  });

  // ============================================
  // PAYMENT ROUTES
  // ============================================

  // Process payment for booking - POST /api/payments
  // Simple payment endpoint for Phase 1 - always returns success
  app.post("/api/payments", (req, res) => {
    console.log('Payment request received:', req.body);
    
    const mockPayment = {
      id: Math.floor(Math.random() * 10000),
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: req.body.amount || 2500,
      status: 'completed',
      cardLastFour: '1234',
      cardType: 'visa'
    };

    console.log('Payment processed successfully (Phase 1 - Mock):', mockPayment);

    res.status(201).json(
      createResponse(true, {
        payment: mockPayment
      }, "Payment processed successfully")
    );
  });

  // Alternative payment endpoint for testing
  app.post("/api/payment-test", (req, res) => {
    console.log('Payment test request received:', req.body);
    
    res.status(200).json({
      success: true,
      message: "Payment test successful",
      data: {
        payment: {
          id: 12345,
          transactionId: "TXN_TEST_123",
          amount: 2500,
          status: 'completed'
        }
      }
    });
  });

  // Get payment details - GET /api/payments/:id
  app.get("/api/payments/:id", requireUser, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json(createResponse(false, null, "Invalid payment ID"));
      }

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json(createResponse(false, null, "Payment not found"));
      }

      // Check if payment belongs to user
      if (payment.userId !== req.user!.id) {
        return res.status(403).json(createResponse(false, null, "Unauthorized"));
      }

      res.json(createResponse(true, payment, "Payment retrieved successfully"));
    } catch (error) {
      console.error("Get payment error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve payment"));
    }
  });

  // Get user's payment history - GET /api/payments/user/history
  app.get("/api/payments/user/history", requireUser, async (req, res) => {
    try {
      const payments = await storage.getUserPayments(req.user!.id);
      res.json(createResponse(true, payments, "Payment history retrieved successfully"));
    } catch (error) {
      console.error("Get payment history error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve payment history"));
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
