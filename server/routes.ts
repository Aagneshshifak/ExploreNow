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
import { eq, desc, sql as drizzleSql, and, or, isNotNull, ne } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============================================
  // HEALTH CHECK & DEBUG ROUTES
  // ============================================
  
  // Health check endpoint - verify server and routes are working
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
      routes: {
        bookings: [
          "GET /api/bookings",
          "GET /api/bookings/debug",
          "GET /api/bookings/dashboard",
          "GET /api/bookings/hotels",
          "GET /api/bookings/transports",
          "GET /api/bookings/history",
          "GET /api/bookings/test/:id",
          "GET /api/bookings/:id"
        ]
      }
    });
  });
  
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
      
      // Set cookie with proper configuration
      // Note: sameSite: "none" requires secure: true
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction, // Must be true when sameSite is "none"
        sameSite: (isProduction ? "none" : "lax") as "none" | "lax" | "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/" // Explicitly set path
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
      console.log("[LOGIN] Login request received");
      console.log("[LOGIN] Request body:", { email: req.body?.email, hasPassword: !!req.body?.password });
      console.log("[LOGIN] Request headers:", { 
        origin: req.headers.origin, 
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      });
      
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        console.error("[LOGIN] ❌ Invalid request body - body is missing or not an object");
        return res.status(400).json(
          createResponse(false, null, "Invalid request. Please provide email and password.")
        );
      }
      
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(e => {
          const field = e.path.join('.');
          if (field === 'email') {
            return 'Please enter a valid email address.';
          } else if (field === 'password') {
            return 'Password must be at least 6 characters long.';
          }
          return `${field}: ${e.message}`;
        });
        console.error("[LOGIN] ❌ Validation errors:", validation.error.errors);
        return res.status(400).json(
          createResponse(false, null, errorMessages.join(' '))
        );
      }
      
      const { email, password } = validation.data;
      console.log(`[LOGIN] Attempting login for email: ${email}`);
      
      // Find user
      let user;
      try {
        user = await storage.getUserByEmail(email);
        if (!user) {
          console.log(`[LOGIN] ❌ User not found for email: ${email}`);
          // Use generic message for security (don't reveal if email exists)
          return res.status(401).json(
            createResponse(false, null, "Invalid email or password")
          );
        }
        console.log(`[LOGIN] ✅ User found: ${user.email} (ID: ${user.id}, type: ${typeof user.id}, role: ${user.role})`);
      } catch (dbError: any) {
        console.error("[LOGIN] ❌ Database error while fetching user:", dbError.message);
        console.error("[LOGIN] Database error stack:", dbError.stack);
        return res.status(500).json(
          createResponse(false, null, "Unable to process login request. Please try again later.")
        );
      }
      
      // Verify password
      let isValidPassword = false;
      try {
        if (!user.password) {
          console.error(`[LOGIN] ❌ User has no password hash: ${email}`);
          return res.status(500).json(
            createResponse(false, null, "Account configuration error. Please contact support.")
          );
        }
        
        isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          console.log(`[LOGIN] ❌ Invalid password for user: ${email}`);
          // Use generic message for security
          return res.status(401).json(
            createResponse(false, null, "Invalid email or password")
          );
        }
        console.log(`[LOGIN] ✅ Password verified for user: ${email}`);
      } catch (bcryptError: any) {
        console.error("[LOGIN] ❌ Password comparison error:", bcryptError.message);
        console.error("[LOGIN] Bcrypt error stack:", bcryptError.stack);
        return res.status(500).json(
          createResponse(false, null, "Unable to verify credentials. Please try again.")
        );
      }
      
      // Generate token
      let token: string;
      try {
        console.log(`[LOGIN] Generating JWT token for user: ${user.email} (ID: ${user.id})`);
        token = generateToken(user);
        console.log(`[LOGIN] ✅ Token generated successfully (length: ${token.length})`);
      } catch (tokenError: any) {
        console.error("[LOGIN] ❌ Token generation failed:", tokenError.message);
        return res.status(500).json(
          createResponse(false, null, `Token generation failed: ${tokenError.message}`)
        );
      }
      
      // Set cookie with proper configuration
      // Note: sameSite: "none" requires secure: true
      try {
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
          httpOnly: true,
          secure: isProduction, // Must be true when sameSite is "none"
          sameSite: (isProduction ? "none" : "lax") as "none" | "lax" | "strict",
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          path: "/" // Explicitly set path
        };
        
        res.cookie("token", token, cookieOptions);
        console.log(`[LOGIN] ✅ Cookie set successfully`, {
          httpOnly: cookieOptions.httpOnly,
          secure: cookieOptions.secure,
          sameSite: cookieOptions.sameSite,
          path: cookieOptions.path
        });
      } catch (cookieError: any) {
        console.error("[LOGIN] ⚠️  Cookie setting error (continuing anyway):", cookieError.message);
        // Continue even if cookie setting fails - token is still in response body
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      // Prepare response data matching frontend expectations
      // Frontend expects: data.data.user and data.data.token
      const responseData = {
        user: userWithoutPassword,
        token: token
      };
      
      console.log(`[LOGIN] ✅ Login successful for user: ${email}`);
      console.log(`[LOGIN] Response structure:`, {
        success: true,
        hasData: !!responseData,
        hasUser: !!responseData.user,
        hasToken: !!responseData.token,
        userId: responseData.user?.id,
        userEmail: responseData.user?.email
      });
      
      const response = createResponse(true, responseData, "Login successful");
      res.json(response);
    } catch (error: any) {
      console.error("[LOGIN] ❌ Unexpected login error:", error);
      console.error("[LOGIN] Error name:", error?.name);
      console.error("[LOGIN] Error message:", error?.message);
      console.error("[LOGIN] Error stack:", error?.stack);
      
      // Provide user-friendly error message
      let errorMessage = "Login failed. Please try again.";
      if (error?.message?.includes("ECONNREFUSED") || error?.message?.includes("database")) {
        errorMessage = "Database connection error. Please try again later.";
      } else if (error?.message) {
        // Log detailed error but send generic message to client
        errorMessage = "An unexpected error occurred. Please try again.";
      }
      
      res.status(500).json(
        createResponse(false, null, errorMessage)
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
    
    // Try to get user if token exists
    let userInfo = null;
    if (req.cookies.token) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
        const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
        userInfo = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          userIdType: typeof decoded.userId
        };
      } catch (error) {
        userInfo = { error: 'Token invalid' };
      }
    }
    
    res.json(createResponse(true, { 
      cookies: req.cookies, 
      hasToken: !!req.cookies.token,
      userAgent: req.headers['user-agent'],
      userInfo
    }, "Test endpoint"));
  });

  // Diagnostic endpoint for bookings - GET /api/bookings/debug
  app.get("/api/bookings/debug", requireUser, async (req, res) => {
    try {
      const currentUserId = req.user!.id;
      
      // Check actual database column names using raw SQL
      let dbColumnInfo = null;
      try {
        const columnResult = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          ORDER BY ordinal_position
        `;
        dbColumnInfo = columnResult.map((row: any) => ({
          columnName: row.column_name,
          dataType: row.data_type
        }));
      } catch (err) {
        console.error('Error fetching column info:', err);
      }
      
      // Get all bookings from database
      const allBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
      
      // Get bookings for current user
      const userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, currentUserId))
        .orderBy(desc(bookings.createdAt));
      
      // Try alternative query to check if column name is different
      let userBookingsAlt = [];
      try {
        const altResult = await sql`SELECT * FROM bookings WHERE "userId" = ${currentUserId} ORDER BY "createdAt" DESC`;
        userBookingsAlt = altResult;
      } catch (err) {
        console.error('Alternative query error:', err);
      }
      
      // Get current user info
      const currentUser = await storage.getUser(currentUserId);
      
      // Sample a few bookings to show their structure
      const sampleBookings = allBookings.slice(0, 5).map(b => ({
        id: b.id,
        userId: b.userId,
        userIdType: typeof b.userId,
        userIdValue: b.userId,
        tripId: b.tripId,
        tripIdType: typeof b.tripId,
        hotelId: b.hotelId,
        hotelIdType: typeof b.hotelId,
        type: b.type,
        status: b.status,
        amount: b.amount,
        createdAt: b.createdAt
      }));
      
      res.json(createResponse(true, {
        databaseSchema: {
          columnInfo: dbColumnInfo,
          note: 'Actual database column names and types'
        },
        currentUser: {
          id: currentUser?.id,
          email: currentUser?.email,
          name: currentUser?.name,
          idType: typeof currentUser?.id,
          idValue: currentUser?.id
        },
        stats: {
          totalBookingsInDb: allBookings.length,
          bookingsForCurrentUser: userBookings.length,
          bookingsForCurrentUserAlt: userBookingsAlt.length,
          currentUserId: currentUserId,
          currentUserIdType: typeof currentUserId,
          currentUserIdValue: currentUserId
        },
        allBookingsUserIds: allBookings.map(b => ({
          bookingId: b.id,
          userId: b.userId,
          userIdType: typeof b.userId,
          userIdValue: b.userId,
          matchesCurrentUser: b.userId === currentUserId,
          matchesCurrentUserLoose: b.userId == currentUserId,
          matchesCurrentUserCoerced: String(b.userId) === String(currentUserId)
        })),
        sampleBookings,
        userBookings: userBookings.map(b => ({
          id: b.id,
          tripId: b.tripId,
          hotelId: b.hotelId,
          type: b.type,
          status: b.status,
          amount: b.amount,
          checkIn: b.checkIn,
          checkOut: b.checkOut
        })),
        userBookingsAlt: userBookingsAlt.slice(0, 5).map((b: any) => ({
          id: b.id,
          userId: b.userId || b.user_id,
          tripId: b.tripId || b.trip_id,
          hotelId: b.hotelId || b.hotel_id,
          type: b.type,
          status: b.status
        }))
      }, "Diagnostic data retrieved successfully"));
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json(createResponse(false, null, "Failed to retrieve diagnostic data: " + (error instanceof Error ? error.message : String(error))));
    }
  });

  // Get user bookings with details - GET /api/bookings/dashboard
  console.log('[ROUTE REGISTRATION] Registering GET /api/bookings/dashboard route');
  app.get("/api/bookings/dashboard", requireUser, async (req, res) => {
    try {
      console.log('[GET /api/bookings/dashboard] Route handler called!');
      const userId = req.user!.id;
      console.log('[GET /api/bookings/dashboard] Fetching bookings for userId:', userId);
      
      // First, fetch all bookings for the user to see what we have
      let allUserBookings = [];
      try {
        allUserBookings = await db
          .select()
          .from(bookings)
          .where(eq(bookings.userId, userId))
          .orderBy(desc(bookings.createdAt));
        
        console.log(`[GET /api/bookings/dashboard] Found ${allUserBookings.length} bookings for user ${userId}`);
      } catch (fetchError: any) {
        console.error('[GET /api/bookings/dashboard] Error fetching user bookings:', fetchError);
        throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
      }
      
      // Fetch bookings with trip and hotel details using Drizzle
      // Note: bookings.tripId and bookings.hotelId are varchar, trips.id and hotels.id are serial (integer)
      // Use NULLIF to handle empty strings, then CAST to integer
      // Only join when tripId/hotelId is not null and not empty
      let userBookings = [];
      try {
        userBookings = await db
          .select({
            id: bookings.id,
            type: bookings.type,
            status: bookings.status,
            amount: bookings.amount,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
            createdAt: bookings.createdAt,
            transportMode: bookings.transportMode,
            transportDetails: bookings.transportDetails,
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
          .leftJoin(
            trips, 
            drizzleSql`CAST(COALESCE(NULLIF(TRIM(${bookings.tripId}), ''), NULL) AS INTEGER) = ${trips.id}`
          )
          .leftJoin(
            hotels, 
            drizzleSql`CAST(COALESCE(NULLIF(TRIM(${bookings.hotelId}), ''), NULL) AS INTEGER) = ${hotels.id}`
          )
          .where(eq(bookings.userId, userId))
          .orderBy(desc(bookings.createdAt));
        
        console.log(`[GET /api/bookings/dashboard] After JOINs, found ${userBookings.length} bookings with trip/hotel data`);
        
        // Log sample booking to verify data is populated
        if (userBookings.length > 0) {
          console.log('[GET /api/bookings/dashboard] Sample booking from JOIN:', {
            id: userBookings[0].id,
            type: userBookings[0].type,
            tripId: userBookings[0].tripId,
            tripTitle: userBookings[0].tripTitle,
            tripLocation: userBookings[0].tripLocation,
            hotelId: userBookings[0].hotelId,
            hotelName: userBookings[0].hotelName,
            hotelLocation: userBookings[0].hotelLocation,
          });
        }
      } catch (joinError: any) {
        console.error('[GET /api/bookings/dashboard] Error in JOIN query:', joinError);
        console.error('[GET /api/bookings/dashboard] Error details:', {
          message: joinError.message,
          stack: joinError.stack
        });
        // Fall through to manual join fallback
        userBookings = [];
      }
      
      // Check if JOIN results have missing hotel data for hotel bookings
      // If JOIN succeeded but hotel data is missing for hotel bookings, use manual join
      const hasHotelBookingsWithoutData = userBookings.length > 0 && allUserBookings.some(b => {
        if (b.type === 'hotel' && b.hotelId) {
          const joinedBooking = userBookings.find(jb => jb.id === b.id);
          return !joinedBooking || !joinedBooking.hotelName;
        }
        return false;
      });
      
      // If JOINs failed or returned fewer bookings, or hotel data is missing, fallback to manual join
      if ((userBookings.length === 0 && allUserBookings.length > 0) || hasHotelBookingsWithoutData) {
        if (hasHotelBookingsWithoutData) {
          console.log('[GET /api/bookings/dashboard] JOIN succeeded but hotel data missing for hotel bookings, using fallback manual join');
        } else {
          console.log('[GET /api/bookings/dashboard] JOINs returned no results, using fallback manual join');
        }
        const manualJoinedBookings = [];
        
        for (const booking of allUserBookings) {
          try {
            // Log raw booking data to see what we're working with
            console.log(`[GET /api/bookings/dashboard] Processing booking ${booking.id}:`, {
              id: booking.id,
              type: booking.type,
              tripId: booking.tripId,
              tripIdType: typeof booking.tripId,
              hotelId: booking.hotelId,
              hotelIdType: typeof booking.hotelId,
              status: booking.status,
            });
            
            const bookingData: any = {
              id: booking.id,
              type: booking.type || 'trip',
              status: booking.status || 'pending',
              amount: booking.amount || '0',
              checkIn: booking.checkIn || null,
              checkOut: booking.checkOut || null,
              createdAt: booking.createdAt || new Date(),
              transportMode: booking.transportMode || null,
              transportDetails: booking.transportDetails || null,
              tripId: null,
              tripTitle: null,
              tripLocation: null,
              tripImageUrl: null,
              hotelId: null,
              hotelName: null,
              hotelLocation: null,
              hotelImageUrl: null,
            };
            
            // Try to get trip data if tripId exists - handle both string and number types
            const tripIdValue = booking.tripId;
            if (tripIdValue !== null && tripIdValue !== undefined && tripIdValue !== '') {
              try {
                const tripIdStr = String(tripIdValue).trim();
                if (tripIdStr !== '') {
                  const tripIdInt = parseInt(tripIdStr);
                  console.log(`[GET /api/bookings/dashboard] Attempting to fetch trip with ID: ${tripIdInt} (from booking.tripId: ${booking.tripId}, type: ${typeof booking.tripId})`);
                  if (!isNaN(tripIdInt) && tripIdInt > 0) {
                    const trip = await storage.getTrip(tripIdInt);
                    if (trip) {
                      console.log(`[GET /api/bookings/dashboard] ✅ Found trip: ${trip.title} in ${trip.location}`);
                      bookingData.tripId = trip.id;
                      bookingData.tripTitle = trip.title || null;
                      bookingData.tripLocation = trip.location || null;
                      bookingData.tripImageUrl = trip.imageUrl || null;
                    } else {
                      console.warn(`[GET /api/bookings/dashboard] ⚠️ Trip with ID ${tripIdInt} not found in database`);
                    }
                  } else {
                    console.warn(`[GET /api/bookings/dashboard] ⚠️ Invalid tripId format: ${tripIdStr} (parsed as ${tripIdInt})`);
                  }
                } else {
                  console.warn(`[GET /api/bookings/dashboard] ⚠️ Empty tripId string after trimming`);
                }
              } catch (tripParseError: any) {
                console.error(`[GET /api/bookings/dashboard] ❌ Error parsing tripId ${booking.tripId}:`, tripParseError.message);
              }
            } else {
              console.log(`[GET /api/bookings/dashboard] No tripId for booking ${booking.id}:`, booking.tripId);
            }
            
            // Try to get hotel data if hotelId exists - handle both string and number types
            const hotelIdValue = booking.hotelId;
            if (hotelIdValue !== null && hotelIdValue !== undefined && hotelIdValue !== '') {
              try {
                const hotelIdStr = String(hotelIdValue).trim();
                if (hotelIdStr !== '') {
                  const hotelIdInt = parseInt(hotelIdStr);
                  console.log(`[GET /api/bookings/dashboard] Attempting to fetch hotel with ID: ${hotelIdInt} (from booking.hotelId: ${booking.hotelId}, type: ${typeof booking.hotelId})`);
                  if (!isNaN(hotelIdInt) && hotelIdInt > 0) {
                    const hotel = await storage.getHotel(hotelIdInt);
                    if (hotel) {
                      console.log(`[GET /api/bookings/dashboard] ✅ Found hotel: ${hotel.name} in ${hotel.location}`);
                      bookingData.hotelId = hotel.id;
                      bookingData.hotelName = hotel.name || null;
                      bookingData.hotelLocation = hotel.location || null;
                      bookingData.hotelImageUrl = hotel.imageUrl || null;
                    } else {
                      console.warn(`[GET /api/bookings/dashboard] ⚠️ Hotel with ID ${hotelIdInt} not found in database`);
                    }
                  } else {
                    console.warn(`[GET /api/bookings/dashboard] ⚠️ Invalid hotelId format: ${hotelIdStr} (parsed as ${hotelIdInt})`);
                  }
                } else {
                  console.warn(`[GET /api/bookings/dashboard] ⚠️ Empty hotelId string after trimming`);
                }
              } catch (hotelParseError: any) {
                console.error(`[GET /api/bookings/dashboard] ❌ Error parsing hotelId ${booking.hotelId}:`, hotelParseError.message);
              }
            } else {
              console.log(`[GET /api/bookings/dashboard] No hotelId for booking ${booking.id}:`, booking.hotelId);
            }
            
            manualJoinedBookings.push(bookingData);
          } catch (bookingError: any) {
            console.error(`[GET /api/bookings/dashboard] Error processing booking ${booking.id}:`, bookingError.message);
            // Continue with next booking
          }
        }
        
        const now = new Date();
        const upcoming = manualJoinedBookings.filter(b => {
          // Include both confirmed and pending bookings as upcoming
          if (b.status !== 'confirmed' && b.status !== 'pending') return false;
          if (!b.checkIn) return true;
          const checkInDate = new Date(b.checkIn);
          return checkInDate >= now;
        });
        const completed = manualJoinedBookings.filter(b => b.status === 'completed');
        const cancelled = manualJoinedBookings.filter(b => b.status === 'cancelled');

        console.log(`[GET /api/bookings/dashboard] Manual join results: ${upcoming.length} upcoming, ${completed.length} completed, ${cancelled.length} cancelled`);
        
        return res.json(createResponse(true, {
          upcoming,
          completed,
          cancelled,
          all: manualJoinedBookings, // Include all bookings for easier access
          stats: {
            totalBookings: manualJoinedBookings.length,
            totalSpent: manualJoinedBookings.reduce((sum, b) => {
              try {
                return sum + parseFloat(String(b.amount || '0'));
              } catch {
                return sum;
              }
            }, 0),
            upcomingTrips: upcoming.length,
            completedTrips: completed.length,
            cancelledTrips: cancelled.length
          }
        }, "Dashboard data retrieved successfully"));
      }

      // Group bookings by status
      // Fix: Handle null checkIn dates and consider confirmed/pending bookings as upcoming
      const now = new Date();
      const upcoming = userBookings.filter(b => {
        try {
          // Include both confirmed and pending bookings as upcoming
          if (b.status !== 'confirmed' && b.status !== 'pending') return false;
          if (!b.checkIn) return true; // If no checkIn date, consider it upcoming
          const checkInDate = new Date(b.checkIn);
          return checkInDate >= now;
        } catch {
          return false;
        }
      });
      const completed = userBookings.filter(b => b.status === 'completed');
      const cancelled = userBookings.filter(b => b.status === 'cancelled');

      console.log(`[GET /api/bookings/dashboard] Final results: ${upcoming.length} upcoming, ${completed.length} completed, ${cancelled.length} cancelled`);

      res.json(createResponse(true, {
        upcoming,
        completed,
        cancelled,
        all: userBookings, // Include all bookings for easier access
        stats: {
          totalBookings: userBookings.length,
          totalSpent: userBookings.reduce((sum, b) => {
            try {
              return sum + parseFloat(String(b.amount || '0'));
            } catch {
              return sum;
            }
          }, 0),
          upcomingTrips: upcoming.length,
          completedTrips: completed.length,
          cancelledTrips: cancelled.length
        }
      }, "Dashboard data retrieved successfully"));
    } catch (error: any) {
      console.error("[GET /api/bookings/dashboard] Error:", error);
      console.error("[GET /api/bookings/dashboard] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("[GET /api/bookings/dashboard] Error details:", {
        message: error.message,
        name: error.name,
        userId: req.user?.id
      });
      res.status(500).json(createResponse(false, null, `Failed to retrieve dashboard data: ${error.message || 'Unknown error'}`));
    }
  });

  // Get user hotel bookings - GET /api/bookings/hotels
  app.get("/api/bookings/hotels", requireUser, async (req, res) => {
    try {
      console.log('[GET /api/bookings/hotels] Route handler called');
      const userId = req.user!.id;
      console.log('[GET /api/bookings/hotels] Fetching hotel bookings for userId:', userId);
      
      // Fetch all bookings for the user
      let userBookings = [];
      try {
        userBookings = await db
          .select()
          .from(bookings)
          .where(eq(bookings.userId, userId))
          .orderBy(desc(bookings.createdAt));
        
        console.log(`[GET /api/bookings/hotels] Found ${userBookings.length} total bookings for user`);
      } catch (fetchError: any) {
        console.error('[GET /api/bookings/hotels] Error fetching user bookings:', fetchError);
        throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
      }
      
      // Process bookings to get hotel-related data
      const hotelBookings = [];
      for (const booking of userBookings) {
        try {
          // Check for direct hotel bookings or trip bookings that include hotels
          if (booking.hotelId && typeof booking.hotelId === 'string' && booking.hotelId.trim() !== '') {
            // Direct hotel booking - convert varchar to integer
            const hotelIdInt = parseInt(booking.hotelId.trim());
            if (!isNaN(hotelIdInt) && hotelIdInt > 0) {
              try {
                const hotel = await db
                  .select()
                  .from(hotels)
                  .where(eq(hotels.id, hotelIdInt))
                  .limit(1);
                
                if (hotel[0]) {
                  console.log(`[GET /api/bookings/hotels] ✅ Found hotel: ${hotel[0].name} for booking ${booking.id}`);
                  hotelBookings.push({
                    id: booking.id,
                    type: booking.type,
                    status: booking.status,
                    amount: parseFloat(booking.amount?.toString() || '0'),
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut,
                    createdAt: booking.createdAt,
                    hotelId: hotel[0].id,
                    hotelName: hotel[0].name,
                    hotelLocation: hotel[0].location,
                    hotelImageUrl: hotel[0].imageUrl,
                    hotelRating: hotel[0].rating ? parseFloat(hotel[0].rating.toString()) : null,
                    hotelPrice: hotel[0].price ? parseFloat(hotel[0].price.toString()) : null,
                    customerName: booking.customerName,
                    customerEmail: booking.customerEmail,
                    guests: booking.guests,
                    specialRequests: booking.specialRequests,
                    transportMode: booking.transportMode,
                    transportDetails: booking.transportDetails
                  });
                } else {
                  console.warn(`[GET /api/bookings/hotels] ⚠️ Hotel with ID ${hotelIdInt} not found for booking ${booking.id}`);
                }
              } catch (hotelError: any) {
                console.error(`[GET /api/bookings/hotels] ❌ Error fetching hotel ${hotelIdInt}:`, hotelError.message);
                // Continue with next booking
              }
            } else {
              console.warn(`[GET /api/bookings/hotels] ⚠️ Invalid hotelId format: ${booking.hotelId} for booking ${booking.id}`);
            }
          } else if (booking.type === 'hotel' && booking.tripId && typeof booking.tripId === 'string' && booking.tripId.trim() !== '') {
            // Trip booking that includes hotel - convert varchar to integer
            const tripIdInt = parseInt(booking.tripId.trim());
            if (!isNaN(tripIdInt) && tripIdInt > 0) {
              try {
                const trip = await db
                  .select()
                  .from(trips)
                  .where(eq(trips.id, tripIdInt))
                  .limit(1);
                
                if (trip[0]) {
                  console.log(`[GET /api/bookings/hotels] ✅ Found trip: ${trip[0].title} for hotel booking ${booking.id}`);
                  hotelBookings.push({
                    id: booking.id,
                    type: booking.type,
                    status: booking.status,
                    amount: parseFloat(booking.amount?.toString() || '0'),
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
                    specialRequests: booking.specialRequests,
                    transportMode: booking.transportMode,
                    transportDetails: booking.transportDetails
                  });
                } else {
                  console.warn(`[GET /api/bookings/hotels] ⚠️ Trip with ID ${tripIdInt} not found for booking ${booking.id}`);
                }
              } catch (tripError: any) {
                console.error(`[GET /api/bookings/hotels] ❌ Error fetching trip ${tripIdInt}:`, tripError.message);
                // Continue with next booking
              }
            }
          }
        } catch (bookingError: any) {
          console.error(`[GET /api/bookings/hotels] ❌ Error processing booking ${booking.id}:`, bookingError.message);
          // Continue with next booking
        }
      }
      
      console.log(`[GET /api/bookings/hotels] Found ${hotelBookings.length} hotel bookings`);
      
      const totalSpent = hotelBookings.reduce((sum, b) => {
        try {
          return sum + (typeof b.amount === 'number' ? b.amount : parseFloat(String(b.amount || '0')));
        } catch {
          return sum;
        }
      }, 0);

      res.json(createResponse(true, {
        hotels: hotelBookings,
        totalHotels: hotelBookings.length,
        totalSpent: totalSpent
      }, "Hotel bookings retrieved successfully"));
    } catch (error: any) {
      console.error("[GET /api/bookings/hotels] Error:", error);
      console.error("[GET /api/bookings/hotels] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("[GET /api/bookings/hotels] Error details:", {
        message: error.message,
        name: error.name,
        userId: req.user?.id
      });
      res.status(500).json(createResponse(false, null, `Failed to retrieve hotel bookings: ${error.message || 'Unknown error'}`));
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
  
  // Add middleware to log all /api/bookings requests for debugging
  // IMPORTANT: This must come BEFORE route definitions to log all requests
  app.use('/api/bookings', (req, res, next) => {
    console.log(`[BOOKINGS MIDDLEWARE] ${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
    console.log(`[BOOKINGS MIDDLEWARE] Request will be matched against routes...`);
    next();
  });
  
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

  // Get single booking by ID with details - GET /api/bookings/:id
  // IMPORTANT: This route must be placed AFTER all specific routes like /api/bookings/history, /api/bookings/hotels, etc.
  // to avoid route conflicts
  console.log('[ROUTE REGISTRATION] Registering GET /api/bookings/:id route');
  
  // Test route without authentication to verify routing works
  app.get("/api/bookings/test/:id", (req, res) => {
    console.log(`[TEST ROUTE] GET /api/bookings/test/:id called with id: ${req.params.id}`);
    res.json({ success: true, message: 'Test route works', id: req.params.id });
  });
  
  // Register the route with explicit logging
  app.get("/api/bookings/:id", requireUser, async (req, res) => {
    try {
      console.log(`[GET /api/bookings/:id] ✅ ROUTE MATCHED! Route handler called!`);
      console.log(`[GET /api/bookings/:id] Request path: ${req.path}, originalUrl: ${req.originalUrl}, params:`, req.params);
      const bookingId = req.params.id;
      const userId = req.user!.id;
      
      console.log(`[GET /api/bookings/:id] Fetching booking ${bookingId} for user ${userId}`);
      
      if (!bookingId || bookingId.trim() === '') {
        console.error(`[GET /api/bookings/:id] Invalid booking ID: ${bookingId}`);
        return res.status(400).json(createResponse(false, null, "Booking ID is required"));
      }
      
      // Get the booking
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        console.error(`[GET /api/bookings/:id] Booking not found: ${bookingId}`);
        return res.status(404).json(createResponse(false, null, "Booking not found"));
      }
      
      console.log(`[GET /api/bookings/:id] Booking found: ${booking.id}, userId: ${booking.userId}, type: ${typeof booking.userId}`);
      
      // Verify booking belongs to user
      if (booking.userId !== userId) {
        console.error(`[GET /api/bookings/:id] Unauthorized: Booking ${bookingId} belongs to user ${booking.userId}, but request is from user ${userId}`);
        return res.status(403).json(createResponse(false, null, "Unauthorized: Booking does not belong to you"));
      }
      
      // Get trip details if tripId exists
      let tripDetails = null;
      if (booking.tripId && booking.tripId.trim() !== '') {
        try {
          const tripIdInt = parseInt(booking.tripId);
          if (!isNaN(tripIdInt)) {
            tripDetails = await storage.getTrip(tripIdInt);
            if (tripDetails) {
              console.log(`[GET /api/bookings/:id] Trip details loaded: ${tripDetails.title}`);
            }
          } else {
            console.warn(`[GET /api/bookings/:id] Invalid tripId format: ${booking.tripId}`);
          }
        } catch (tripError: any) {
          console.error(`[GET /api/bookings/:id] Error fetching trip ${booking.tripId}:`, tripError.message);
          // Continue without trip details
        }
      }
      
      // Get hotel details if hotelId exists
      let hotelDetails = null;
      if (booking.hotelId && booking.hotelId.trim() !== '') {
        try {
          const hotelIdInt = parseInt(booking.hotelId);
          if (!isNaN(hotelIdInt)) {
            hotelDetails = await storage.getHotel(hotelIdInt);
            if (hotelDetails) {
              console.log(`[GET /api/bookings/:id] Hotel details loaded: ${hotelDetails.name}`);
            }
          } else {
            console.warn(`[GET /api/bookings/:id] Invalid hotelId format: ${booking.hotelId}`);
          }
        } catch (hotelError: any) {
          console.error(`[GET /api/bookings/:id] Error fetching hotel ${booking.hotelId}:`, hotelError.message);
          // Continue without hotel details
        }
      }
      
      // Combine booking with trip/hotel details
      const bookingWithDetails = {
        ...booking,
        tripTitle: tripDetails?.title || null,
        tripLocation: tripDetails?.location || null,
        tripImageUrl: tripDetails?.imageUrl || null,
        hotelName: hotelDetails?.name || null,
        hotelLocation: hotelDetails?.location || null,
        hotelImageUrl: hotelDetails?.imageUrl || null,
      };
      
      console.log(`[GET /api/bookings/:id] Successfully retrieved booking ${bookingId} with details`);
      res.json(createResponse(true, bookingWithDetails, "Booking retrieved successfully"));
    } catch (error: any) {
      console.error(`[GET /api/bookings/:id] Error:`, error);
      console.error(`[GET /api/bookings/:id] Error stack:`, error.stack);
      res.status(500).json(createResponse(false, null, `Failed to retrieve booking: ${error.message || 'Unknown error'}`));
    }
  });
  
  // Catch-all for unmatched booking routes (for debugging)
  // This should never be hit if routes are registered correctly
  app.use('/api/bookings', (req, res, next) => {
    // Only handle if this is a GET request that didn't match any route above
    if (req.method === 'GET' && !res.headersSent) {
      console.error(`[BOOKINGS CATCH-ALL] ⚠️  Unmatched GET request to ${req.originalUrl}`);
      console.error(`[BOOKINGS CATCH-ALL] This means the route /api/bookings/:id did not match!`);
      console.error(`[BOOKINGS CATCH-ALL] Request path: ${req.path}, originalUrl: ${req.originalUrl}`);
      console.error(`[BOOKINGS CATCH-ALL] This is a 404 - route not found`);
      // Don't send response here, let Express 404 handler handle it
    }
    next();
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
      // Basic validation - userPreferences table not in schema yet
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json(
          createResponse(false, null, "Invalid preferences data")
        );
      }

      // Check if preferences exist
      const existing = await storage.getUserPreferences(req.user!.id);
      let preferences;
      
      const preferencesData = {
        ...req.body,
        userId: req.user!.id
      };
      
      if (existing) {
        preferences = await storage.updateUserPreferences(req.user!.id, preferencesData);
      } else {
        preferences = await storage.createUserPreferences(preferencesData);
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
        tripId: tripId ? parseInt(tripId) : null,
        hotelId: hotelId ? parseInt(hotelId) : null,
        rating: parseInt(rating),
        title,
        comment,
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
      console.log("[AI ASSISTANT] Request received");
      const { query, userContext } = req.body;
      
      if (!query || typeof query !== 'string') {
        console.error("[AI ASSISTANT] Invalid query:", { query, type: typeof query });
        return res.status(400).json(createResponse(false, null, "Query is required and must be a string"));
      }

      console.log("[AI ASSISTANT] Processing query:", query.substring(0, 50) + "...");
      console.log("[AI ASSISTANT] User context:", userContext);

      const { geminiService } = await import("./services/geminiService.js");
      console.log("[AI ASSISTANT] Gemini service imported successfully");
      
      const assistance = await geminiService.provideTravelAssistance(query, userContext);
      console.log("[AI ASSISTANT] Assistance generated successfully, category:", assistance.category);

      res.json(createResponse(true, {
        ...assistance,
        aiPowered: true,
        timestamp: new Date().toISOString()
      }, "AI travel assistance provided successfully"));
    } catch (error: any) {
      console.error("[AI ASSISTANT] Error occurred");
      console.error("[AI ASSISTANT] Error type:", error?.constructor?.name || typeof error);
      console.error("[AI ASSISTANT] Error message:", error?.message || "Unknown error");
      console.error("[AI ASSISTANT] Error stack:", error?.stack);
      
      // Determine appropriate status code and message
      let statusCode = 500;
      let errorMessage = "Failed to provide AI assistance";
      
      if (error?.message?.includes("API key") || error?.message?.includes("GEMINI_API_KEY")) {
        statusCode = 503; // Service Unavailable
        errorMessage = "AI service is not configured. Please contact support.";
        console.error("[AI ASSISTANT] API key configuration issue");
      } else if (error?.message?.includes("quota") || error?.message?.includes("limit")) {
        statusCode = 429; // Too Many Requests
        errorMessage = "AI service quota exceeded. Please try again later.";
        console.error("[AI ASSISTANT] API quota issue");
      } else if (error?.message?.includes("network") || error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
        statusCode = 503; // Service Unavailable
        errorMessage = "Unable to connect to AI service. Please try again later.";
        console.error("[AI ASSISTANT] Network error");
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      res.status(statusCode).json(createResponse(false, null, errorMessage));
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
  app.post("/api/payments", requireUser, async (req, res) => {
    try {
      console.log('Payment request received:', req.body);
      
      const {
        bookingId,
        amount,
        currency = 'USD',
        cardHolderName,
        cardNumber,
        cardType = 'visa',
        expiryMonth,
        expiryYear,
        cvv,
        billingAddress,
        city,
        zipCode,
        country
      } = req.body;

      if (!bookingId || !amount) {
        return res.status(400).json(
          createResponse(false, null, "Booking ID and amount are required")
        );
      }

      // Verify booking exists and belongs to user
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json(
          createResponse(false, null, "Booking not found")
        );
      }

      if (booking.userId !== req.user!.id) {
        return res.status(403).json(
          createResponse(false, null, "Unauthorized: Booking does not belong to you")
        );
      }

      // Generate transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract last 4 digits of card number
      const cardLastFour = cardNumber && cardNumber.length >= 4 
        ? cardNumber.slice(-4).replace(/\D/g, '') 
        : '1234';

      // Create payment record
      const paymentData = {
        bookingId: bookingId,
        userId: req.user!.id,
        amount: amount.toString(),
        currency: currency,
        paymentMethod: 'credit_card',
        cardHolderName: cardHolderName || 'Card Holder',
        cardLastFour: cardLastFour,
        cardType: cardType,
        expiryMonth: expiryMonth || '12', // Default to 12 if not provided (for dummy payments)
        expiryYear: expiryYear || new Date().getFullYear().toString(), // Default to current year if not provided
        status: 'completed',
        transactionId: transactionId,
      };

      console.log('Creating payment with data:', {
        bookingId,
        amount,
        expiryMonth: paymentData.expiryMonth,
        expiryYear: paymentData.expiryYear,
        cardLastFour: paymentData.cardLastFour,
      });

      const payment = await storage.createPayment(paymentData);

      // Update booking status to confirmed
      await storage.updateBookingStatus(bookingId, 'confirmed');

      console.log('Payment processed successfully:', {
        paymentId: payment.id,
        bookingId: bookingId,
        amount: amount,
        transactionId: transactionId
      });

      res.status(201).json(
        createResponse(true, {
          payment: payment,
          booking: await storage.getBooking(bookingId)
        }, "Payment processed successfully")
      );
    } catch (error: any) {
      console.error('Payment processing error:', error);
      res.status(500).json(
        createResponse(false, null, `Failed to process payment: ${error.message || 'Unknown error'}`)
      );
    }
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
  
  // Log route registration completion
  console.log('[ROUTE REGISTRATION] ============================================');
  console.log('[ROUTE REGISTRATION] ✅ All routes registered, HTTP server created');
  console.log('[ROUTE REGISTRATION] Bookings GET routes registered in order:');
  console.log('[ROUTE REGISTRATION]   1. GET /api/bookings/debug');
  console.log('[ROUTE REGISTRATION]   2. GET /api/bookings/dashboard');
  console.log('[ROUTE REGISTRATION]   3. GET /api/bookings/hotels');
  console.log('[ROUTE REGISTRATION]   4. GET /api/bookings/transports');
  console.log('[ROUTE REGISTRATION]   5. GET /api/bookings');
  console.log('[ROUTE REGISTRATION]   6. GET /api/bookings/history');
  console.log('[ROUTE REGISTRATION]   7. GET /api/bookings/test/:id (test route, no auth)');
  console.log('[ROUTE REGISTRATION]   8. GET /api/bookings/:id ⭐ MAIN ROUTE (requires auth)');
  console.log('[ROUTE REGISTRATION] ============================================');
  console.log('[ROUTE REGISTRATION] Health check: GET /api/health');
  console.log('[ROUTE REGISTRATION] ============================================');
  console.log('[ROUTE REGISTRATION] ⚠️  IMPORTANT: Server must be restarted for route changes to take effect!');
  console.log('[ROUTE REGISTRATION] ============================================');
  
  return httpServer;
}
