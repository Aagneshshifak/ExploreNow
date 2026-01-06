import express from 'express';
import { storage } from './prisma-storage';
import { requireUser, requireAdmin } from './middleware-prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { convertCurrency } from './controllers/utils';

const app = express();

// Helper function for consistent API responses
function createResponse(success: boolean, data: any, message: string) {
  return { success, data, message };
}

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register - POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json(createResponse(false, null, "Email and password are required"));
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json(createResponse(false, null, "User already exists"));
    }

    // Create user
    const user = await storage.createUser({
      name,
      email,
      password,
      role: role || 'user',
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie for token
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(createResponse(true, {
      user: userWithoutPassword,
      token: accessToken,
      refreshToken,
    }, "Registration successful"));
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json(createResponse(false, null, "Registration failed"));
  }
});

// Login - POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(createResponse(false, null, "Email and password are required"));
    }

    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json(createResponse(false, null, "Invalid credentials"));
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(createResponse(false, null, "Invalid credentials"));
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie for token
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(createResponse(true, {
      user: userWithoutPassword,
      token: accessToken,
      refreshToken,
    }, "Login successful"));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json(createResponse(false, null, "Login failed"));
  }
});

// Get current user - GET /api/auth/me
app.get("/api/auth/me", requireUser, async (req, res) => {
  try {
    const user = await storage.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json(createResponse(false, null, "User not found"));
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(createResponse(true, userWithoutPassword, "User retrieved successfully"));
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json(createResponse(false, null, "Failed to get user"));
  }
});

// Logout - POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('token');
  res.json(createResponse(true, null, "Logout successful"));
});

// ============================================
// TRIPS ROUTES (Admin can create/edit, all can view)
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

// Get trip by ID - GET /api/trips/:id
app.get("/api/trips/:id", async (req, res) => {
  try {
    const trip = await storage.getTripById(req.params.id);
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
    const trip = await storage.createTrip(req.body);
    res.status(201).json(createResponse(true, trip, "Trip created successfully"));
  } catch (error) {
    console.error("Create trip error:", error);
    res.status(500).json(createResponse(false, null, "Failed to create trip"));
  }
});

// Update trip - PUT /api/trips/:id (Admin only)
app.put("/api/trips/:id", requireAdmin, async (req, res) => {
  try {
    const trip = await storage.updateTrip(req.params.id, req.body);
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
    const deleted = await storage.deleteTrip(req.params.id);
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
// HOTELS ROUTES (Admin can create/edit, all can view)
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

// Get hotel by ID - GET /api/hotels/:id
app.get("/api/hotels/:id", async (req, res) => {
  try {
    const hotel = await storage.getHotelById(req.params.id);
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
    const hotel = await storage.createHotel(req.body);
    res.status(201).json(createResponse(true, hotel, "Hotel created successfully"));
  } catch (error) {
    console.error("Create hotel error:", error);
    res.status(500).json(createResponse(false, null, "Failed to create hotel"));
  }
});

// Update hotel - PUT /api/hotels/:id (Admin only)
app.put("/api/hotels/:id", requireAdmin, async (req, res) => {
  try {
    const hotel = await storage.updateHotel(req.params.id, req.body);
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
    const deleted = await storage.deleteHotel(req.params.id);
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
      return sum + booking.amount;
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
      const month = new Date(booking.createdAt!).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, count: 0, spent: 0 };
      }
      acc[month].count += 1;
      acc[month].spent += booking.amount;
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

// Create a booking - POST /api/bookings (General booking endpoint)
app.post("/api/bookings", requireUser, async (req, res) => {
  try {
    const { tripId, hotelId, type, amount, checkIn, checkOut } = req.body;
    
    if (!type || (type !== 'trip' && type !== 'hotel')) {
      return res.status(400).json(createResponse(false, null, "Invalid booking type"));
    }
    
    if (type === 'trip' && !tripId) {
      return res.status(400).json(createResponse(false, null, "Trip ID is required for trip bookings"));
    }
    
    if (type === 'hotel' && !hotelId) {
      return res.status(400).json(createResponse(false, null, "Hotel ID is required for hotel bookings"));
    }

    const bookingData = {
      userId: req.user!.id.toString(),
      tripId: tripId || null,
      hotelId: hotelId || null,
      type,
      amount: amount || 0,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
    };

    const booking = await storage.createBooking(bookingData);
    res.status(201).json(createResponse(true, booking, "Booking created successfully"));
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json(createResponse(false, null, "Failed to create booking"));
  }
});

// Book a trip - POST /api/bookings/trip/:tripId
app.post("/api/bookings/trip/:tripId", requireUser, async (req, res) => {
  try {
    const trip = await storage.getTripById(req.params.tripId);
    if (!trip) {
      return res.status(404).json(createResponse(false, null, "Trip not found"));
    }

    const bookingData = {
      userId: req.user!.id.toString(),
      tripId: req.params.tripId,
      type: "trip",
      amount: trip.price,
      checkIn: req.body.checkIn ? new Date(req.body.checkIn) : undefined,
      checkOut: req.body.checkOut ? new Date(req.body.checkOut) : undefined,
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
    const hotel = await storage.getHotelById(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json(createResponse(false, null, "Hotel not found"));
    }

    const { checkIn, checkOut, nights } = req.body;
    const totalAmount = hotel.price * (nights || 1);

    const bookingData = {
      userId: req.user!.id.toString(),
      hotelId: req.params.hotelId,
      type: "hotel",
      amount: totalAmount,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
    };

    const booking = await storage.createBooking(bookingData);
    res.status(201).json(createResponse(true, booking, "Hotel booked successfully"));
  } catch (error) {
    console.error("Book hotel error:", error);
    res.status(500).json(createResponse(false, null, "Failed to book hotel"));
  }
});

// Update booking status - PATCH /api/bookings/:id/status
app.patch("/api/bookings/:id/status", requireUser, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await storage.updateBookingStatus(req.params.id, status);
    if (!booking) {
      return res.status(404).json(createResponse(false, null, "Booking not found"));
    }
    res.json(createResponse(true, booking, "Booking status updated successfully"));
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json(createResponse(false, null, "Failed to update booking status"));
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

// Get all bookings - GET /api/admin/bookings (Admin only)
app.get("/api/admin/bookings", requireAdmin, async (req, res) => {
  try {
    const bookings = await storage.getAllBookings();
    res.json(createResponse(true, bookings, "All bookings retrieved successfully"));
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json(createResponse(false, null, "Failed to retrieve all bookings"));
  }
});

// Get user booking analytics - GET /api/bookings/analytics
app.get("/api/bookings/analytics", requireUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const bookings = await storage.getUserBookingsWithDetails(userId);
    
    // Calculate analytics
    const totalSpent = bookings.reduce((sum: number, booking: any) => {
      return sum + booking.amount;
    }, 0);
    
    const bookingsByStatus = bookings.reduce((acc: Record<string, number>, booking: any) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const analytics = {
      totalBookings: bookings.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      bookingsByStatus,
    };
    
    res.json(createResponse(true, analytics, "User analytics retrieved successfully"));
  } catch (error) {
    console.error("Get user analytics error:", error);
    res.status(500).json(createResponse(false, null, "Failed to retrieve user analytics"));
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
    
    // Get all trips from database for real data
    const allTrips = await storage.getAllTrips();
    
    // Convert to recommendation format and filter
    let filteredRecommendations = allTrips.map(trip => ({
      id: trip.id,
      name: trip.title,
      location: trip.location,
      cost: trip.price,
      duration: `${trip.duration} days`,
      tags: trip.tags,
      description: trip.description || 'Explore this amazing destination',
      rating: 4.5 + Math.random() * 0.5, // Mock rating between 4.5-5.0
      includes: trip.includes
    }));
    
    // Filter by budget
    if (budget) {
      filteredRecommendations = filteredRecommendations.filter(trip => trip.cost <= budget);
    }
    
    // Filter by interests
    if (interests && interests.length > 0) {
      filteredRecommendations = filteredRecommendations.filter(trip => 
        trip.tags.some((tag: string) => interests.some((interest: string) => 
          tag.toLowerCase().includes(interest.toLowerCase()) || 
          interest.toLowerCase().includes(tag.toLowerCase())
        ))
      );
    }

    // Sort by rating (highest first)
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

export default app;