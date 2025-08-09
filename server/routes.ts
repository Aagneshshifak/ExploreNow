import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { requireUser, requireAdmin, generateToken, createResponse } from "./middleware";
import { convertCurrency } from "./controllers/utils";
import { emailService } from "./services/emailService";
import { 
  loginSchema, 
  registerSchema, 
  insertTripSchema, 
  insertHotelSchema, 
  insertBookingSchema,
  currencyConversionSchema,
  tripFilterSchema,
  budgetFilterSchema,
  aiRecommendationSchema,
  insertUserPreferencesSchema,
  type LoginRequest,
  type RegisterRequest,
  type TripFilterData,
  type BudgetFilterData,
  type AIRecommendationData
} from "@shared/schema";

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
            totalPrice: booking.amount,
            checkIn: req.body.checkIn,
            checkOut: req.body.checkOut,
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
            totalPrice: booking.amount,
            checkIn,
            checkOut,
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

  // Enhanced booking creation with comprehensive details - POST /api/bookings
  app.post("/api/bookings", requireUser, async (req, res) => {
    try {
      const { 
        tripId, 
        hotelId, 
        type, 
        amount, 
        checkIn, 
        checkOut, 
        guests,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests,
        emergencyContact,
        emergencyPhone,
        transportMode
      } = req.body;
      
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
        amount: amount?.toString() || '0',
        currency: req.body.currency || 'USD',
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        guests: guests || 1,
        customerName: customerName || req.user!.name,
        customerEmail: customerEmail || req.user!.email,
        customerPhone,
        specialRequests,
        emergencyContact,
        emergencyPhone,
        transportMode,
        status: 'confirmed'
      };
      
      const booking = await storage.createBooking(bookingData);
      
      // Send booking confirmation email
      const itemName = type === 'trip' 
        ? (await storage.getTrip(tripId))?.title || 'Trip'
        : (await storage.getHotel(hotelId))?.name || 'Hotel';
        
      if (req.user) {
        emailService.sendBookingConfirmation(
          customerEmail || req.user.email,
          customerName || req.user.name,
          {
            type,
            itemName,
            totalPrice: booking.amount,
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
        customerDetails.customerEmail,
        customerDetails.customerName,
        {
          type,
          itemName,
          totalPrice: booking.amount,
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

  // ============================================
  // AI RECOMMENDATION ROUTES
  // ============================================

  // Get AI trip recommendations - POST /api/ai/recommend
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const validation = aiRecommendationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(
          createResponse(false, null, `Invalid recommendation data: ${validation.error.errors.map(e => e.message).join(', ')}`)
        );
      }

      const recommendations = await storage.getRecommendedTrips(validation.data);
      
      // If user is authenticated, save suggestions
      if (req.user) {
        const userId = req.user.id;
        for (const trip of recommendations.slice(0, 3)) { // Save top 3 suggestions
          try {
            await storage.createTripSuggestion({
              userId,
              tripId: trip.id,
              reason: `Matches preferences: ${validation.data.preferences.join(', ')}`,
              score: (Math.random() * 0.5 + 0.5).toString(), // Mock confidence score 0.5-1.0
              preferences: validation.data.preferences,
            });
          } catch (suggestionError) {
            console.log("Failed to save suggestion:", suggestionError);
          }
        }
      }

      res.json(createResponse(true, recommendations, "Trip recommendations generated successfully"));
    } catch (error) {
      console.error("AI recommendation error:", error);
      res.status(500).json(createResponse(false, null, "Failed to generate recommendations"));
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
