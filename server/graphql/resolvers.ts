import { storage } from '../storage';
import { db } from '../db';
import { sql } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createResponse } from '../middleware';

interface UserPayload {
  userId: number; // db uses number or string? Schema check required, but typically number in SQL. Previous code used parseInt.
  email: string;
  role: string;
}

// Helper function to get user from context
const getUserFromContext = (context: any): UserPayload | null => {
  if (!context || !context.req) return null;
  const token = context.req.cookies?.token;
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    // Ensure the decoded object matches our expected payload structure
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return decoded as UserPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const resolvers = {
  Query: {
    // User queries
    me: async (_: any, __: any, context: any) => {
      const user = getUserFromContext(context);
      if (!user) return null;
      
      const result = await sql`SELECT * FROM users WHERE id = ${user.userId}`;
      return result[0] || null;
    },

    users: async () => {
      const result = await sql`SELECT * FROM users ORDER BY "createdAt" DESC`;
      return result;
    },

    user: async (_: any, { id }: { id: string }) => {
      const result = await sql`SELECT * FROM users WHERE id = ${parseInt(id)}`;
      return result[0] || null;
    },

    // Trip queries
    trips: async () => {
      const result = await sql`SELECT * FROM trips ORDER BY "createdAt" DESC`;
      return result;
    },

    trip: async (_: any, { id }: { id: string }) => {
      const result = await sql`SELECT * FROM trips WHERE id = ${parseInt(id)}`;
      return result[0] || null;
    },

    tripsByLocation: async (_: any, { location }: { location: string }) => {
      const result = await sql`SELECT * FROM trips WHERE location ILIKE ${`%${location}%`} ORDER BY created_at DESC`;
      return result;
    },

    // Hotel queries
    hotels: async () => {
      const result = await sql`SELECT * FROM hotels ORDER BY "createdAt" DESC`;
      return result;
    },

    hotel: async (_: any, { id }: { id: string }) => {
      const result = await sql`SELECT * FROM hotels WHERE id = ${parseInt(id)}`;
      return result[0] || null;
    },

    hotelsByLocation: async (_: any, { location }: { location: string }) => {
      const result = await sql`SELECT * FROM hotels WHERE location ILIKE ${`%${location}%`} ORDER BY created_at DESC`;
      return result;
    },

    // Booking queries
    bookings: async (_: any, __: any, context: any) => {
      // Temporarily allow access without authentication for testing
      // const user = getUserFromContext(context);
      // if (!user || user.role !== 'admin') {
      //   throw new Error('Unauthorized');
      // }
      
      const result = await sql`SELECT * FROM bookings ORDER BY "created_at" DESC`;
      return result;
    },

    booking: async (_: any, { id }: { id: string }) => {
      const result = await sql`SELECT * FROM bookings WHERE id = ${parseInt(id)}`;
      return result[0] || null;
    },

    userBookings: async (_: any, __: any, context: any) => {
      const user = getUserFromContext(context);
      if (!user) throw new Error('Unauthorized');
      
      const result = await sql`SELECT * FROM bookings WHERE "userId" = ${user.userId} ORDER BY "createdAt" DESC`;
      return result;
    },

    // Payment queries
    payments: async (_: any, __: any, context: any) => {
      const user = getUserFromContext(context);
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const result = await sql`SELECT * FROM payments ORDER BY "created_at" DESC`;
      return result;
    },

    payment: async (_: any, { id }: { id: string }) => {
      const result = await sql`SELECT * FROM payments WHERE id = ${parseInt(id)}`;
      return result[0] || null;
    },

    bookingPayments: async (_: any, { bookingId }: { bookingId: string }) => {
      const result = await sql`SELECT * FROM payments WHERE booking_id = ${parseInt(bookingId)} ORDER BY "created_at" DESC`;
      return result;
    },

    // Review queries
    reviews: async () => {
      const result = await sql`SELECT * FROM reviews ORDER BY "created_at" DESC`;
      return result;
    },

    review: async (_: any, { id }: { id: string }) => {
      const result = await sql`SELECT * FROM reviews WHERE id = ${parseInt(id)}`;
      return result[0] || null;
    },

    tripReviews: async (_: any, { tripId }: { tripId: string }) => {
      const result = await sql`SELECT * FROM reviews WHERE trip_id = ${parseInt(tripId)} ORDER BY "created_at" DESC`;
      return result;
    },

    hotelReviews: async (_: any, { hotelId }: { hotelId: string }) => {
      const result = await sql`SELECT * FROM reviews WHERE hotel_id = ${parseInt(hotelId)} ORDER BY "created_at" DESC`;
      return result;
    },
  },

  Mutation: {
    // Auth mutations
    login: async (_: any, { input }: { input: { email: string; password: string } }, context: any) => {
      try {
        const { email, password } = input;
        
        const result = await sql`SELECT * FROM users WHERE email = ${email}`;
        const user = result[0];
        
        if (!user) {
          return {
            success: false,
            user: null,
            token: null,
            message: 'User not found'
          };
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return {
            success: false,
            user: null,
            token: null,
            message: 'Invalid password'
          };
        }
        
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'your-secret-key-change-in-production',
          { expiresIn: '24h' }
        );
        
        // Set cookie
        if (context.res) {
          context.res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        
        return {
          success: true,
          user: userWithoutPassword,
          token,
          message: 'Login successful'
        };
      } catch (error) {
        return {
          success: false,
          user: null,
          token: null,
          message: 'Login failed'
        };
      }
    },

    register: async (_: any, { input }: { input: { name: string; email: string; password: string; role?: string } }, context: any) => {
      try {
        const { name, email, password, role = 'user' } = input;
        
        // Check if user already exists
        const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (existingUser.length > 0) {
          return {
            success: false,
            user: null,
            token: null,
            message: 'User already exists with this email'
          };
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const result = await sql`
          INSERT INTO users (name, email, password, role)
          VALUES (${name}, ${email}, ${hashedPassword}, ${role})
          RETURNING *
        `;
        
        const newUser = result[0];
        
        // Generate token
        const token = jwt.sign(
          { userId: newUser.id, email: newUser.email, role: newUser.role },
          process.env.JWT_SECRET || 'your-secret-key-change-in-production',
          { expiresIn: '24h' }
        );
        
        // Set cookie
        if (context.res) {
          context.res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });
        }
        
        const { password: _, ...userWithoutPassword } = newUser;
        
        return {
          success: true,
          user: userWithoutPassword,
          token,
          message: 'User registered successfully'
        };
      } catch (error) {
        return {
          success: false,
          user: null,
          token: null,
          message: 'Registration failed'
        };
      }
    },

    logout: async (_: any, __: any, context: any) => {
      context.res.clearCookie('token');
      return {
        success: true,
        user: null,
        token: null,
        message: 'Logged out successfully'
      };
    },

    // Booking mutations
    createBooking: async (_: any, { input }: { input: any }, context: any) => {
      try {
        // Get user from context - properly authenticate
        const user = getUserFromContext(context);
        if (!user || !user.userId) {
          console.error('GraphQL createBooking - No authenticated user found');
          return {
            success: false,
            booking: null,
            message: 'Authentication required. Please log in to create a booking.'
          };
        }
        // Ensure userId is an integer (handle type mismatches)
        const rawUserId = user.userId;
        const userId = typeof rawUserId === 'string' ? parseInt(rawUserId, 10) : Number(rawUserId);
        
        console.log('GraphQL createBooking - User info:', {
          rawUserId,
          rawUserIdType: typeof rawUserId,
          userId,
          userIdType: typeof userId,
          userEmail: user.email
        });
        
        if (isNaN(userId) || userId <= 0) {
          console.error(`GraphQL createBooking - ❌ Invalid userId: ${rawUserId} (parsed as ${userId})`);
          return {
            success: false,
            booking: null,
            message: 'Invalid user ID'
          };
        }
        
        const {
          tripId,
          hotelId,
          customerName,
          customerEmail,
          customerPhone,
          transportMode,
          checkIn,
          checkOut,
          guests,
          amount,
          currency = 'USD',
          specialRequests,
          emergencyContact,
          emergencyPhone,
          transportDetails
        } = input;
        
        // Generate unique booking ID
        const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Determine booking type - if both tripId and hotelId exist, use 'trip' as default
        const type = tripId ? 'trip' : 'hotel';
        
        console.log('GraphQL createBooking - Creating booking:', {
          bookingId,
          userId,
          tripId: tripId || null,
          hotelId: hotelId || null,
          type,
          status: 'confirmed'
        });
        
        const result = await sql`
          INSERT INTO bookings (
            id, "userId", "tripId", "hotelId", type, "customerName", "customerEmail", 
            "customerPhone", "transportMode", "checkIn", "checkOut", guests, amount, 
            status, "specialRequests", "emergencyContact", "emergencyPhone", 
            "transportDetails", currency
          ) VALUES (
            ${bookingId},
            ${userId},
            ${tripId || null},
            ${hotelId || null},
            ${type},
            ${customerName},
            ${customerEmail},
            ${customerPhone},
            ${transportMode || 'flight'},
            ${checkIn},
            ${checkOut},
            ${guests},
            ${amount},
            ${'confirmed'},
            ${specialRequests || null},
            ${emergencyContact || null},
            ${emergencyPhone || null},
            ${transportDetails || null},
            ${currency}
          ) RETURNING *
        `;
        
        const booking = result[0];
        
        console.log('GraphQL createBooking - ✅ Booking created successfully:', {
          bookingId: booking.id,
          userId: booking.userId,
          userIdType: typeof booking.userId,
          tripId: booking.tripId,
          hotelId: booking.hotelId,
          type: booking.type,
          status: booking.status
        });
        
        return {
          success: true,
          booking,
          message: 'Booking created successfully'
        };
      } catch (error) {
        console.error('Create booking error:', error);
        return {
          success: false,
          booking: null,
          message: 'Failed to create booking'
        };
      }
    },

    updateBookingStatus: async (_: any, { id, status }: { id: string; status: string }, context: any) => {
      try {
        const user = getUserFromContext(context);
        if (!user || user.role !== 'admin') {
          return {
            success: false,
            booking: null,
            message: 'Unauthorized'
          };
        }
        
        const result = await sql`
          UPDATE bookings 
          SET status = ${status}
          WHERE id = ${parseInt(id)}
          RETURNING *
        `;
        
        const booking = result[0];
        
        return {
          success: true,
          booking,
          message: 'Booking status updated successfully'
        };
      } catch (error) {
        return {
          success: false,
          booking: null,
          message: 'Failed to update booking status'
        };
      }
    },

    // Payment mutations
    createPayment: async (_: any, { input }: { input: any }, context: any) => {
      try {
        const user = getUserFromContext(context);
        if (!user) {
          return {
            success: false,
            payment: null,
            message: 'Unauthorized'
          };
        }
        
        const { bookingId, amount, cardHolderName, cardNumber, cvv } = input;
        
        // Create payment
        const paymentResult = await sql`
          INSERT INTO payments (
            booking_id, user_id, amount, currency, payment_method,
            card_holder_name, card_last_four, status, transaction_id
          ) VALUES (
            ${bookingId},
            ${user.userId},
            ${amount},
            ${'USD'},
            ${'credit_card'},
            ${cardHolderName},
            ${cardNumber.slice(-4)},
            ${'completed'},
            ${`TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}
          ) RETURNING *
        `;
        
        // Update booking status
        await sql`
          UPDATE bookings 
          SET status = ${'confirmed'}
          WHERE id = ${bookingId}
        `;
        
        const payment = paymentResult[0];
        
        return {
          success: true,
          payment,
          message: 'Payment processed successfully'
        };
      } catch (error) {
        return {
          success: false,
          payment: null,
          message: 'Failed to process payment'
        };
      }
    },

    // Review mutations
    createReview: async (_: any, { input }: { input: any }, context: any) => {
      try {
        const user = getUserFromContext(context);
        if (!user) throw new Error('Unauthorized');
        
        const { tripId, hotelId, rating, title, comment } = input;
        
        const result = await sql`
          INSERT INTO reviews (user_id, trip_id, hotel_id, rating, title, comment)
          VALUES (${user.userId}, ${tripId || null}, ${hotelId || null}, ${rating}, ${title}, ${comment})
          RETURNING *
        `;
        
        return result[0];
      } catch (error) {
        throw new Error('Failed to create review');
      }
    },

    updateReview: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
      try {
        const user = getUserFromContext(context);
        if (!user) throw new Error('Unauthorized');
        
        const { tripId, hotelId, rating, title, comment } = input;
        
        const result = await sql`
          UPDATE reviews 
          SET trip_id = ${tripId || null}, hotel_id = ${hotelId || null}, 
              rating = ${rating}, title = ${title}, comment = ${comment}
          WHERE id = ${parseInt(id)} AND user_id = ${user.userId}
          RETURNING *
        `;
        
        if (result.length === 0) throw new Error('Review not found or unauthorized');
        
        return result[0];
      } catch (error) {
        throw new Error('Failed to update review');
      }
    },

    deleteReview: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const user = getUserFromContext(context);
        if (!user) throw new Error('Unauthorized');
        
        const result = await sql`
          DELETE FROM reviews 
          WHERE id = ${parseInt(id)} AND user_id = ${user.userId}
        `;
        
        return result.length > 0;
      } catch (error) {
        throw new Error('Failed to delete review');
      }
    },
  },

  // Field resolvers for relationships
  Booking: {
    tripId: (parent: any) => parent.trip_id,
    hotelId: (parent: any) => parent.hotel_id,
    customerName: (parent: any) => parent.customer_name,
    checkIn: (parent: any) => parent.check_in,
    checkOut: (parent: any) => parent.check_out,
    totalCost: (parent: any) => parseFloat(parent.total_cost),
    paymentStatus: (parent: any) => parent.payment_status,
    createdAt: (parent: any) => parent.created_at,
    trip: async (parent: any) => {
      if (!parent.trip_id) return null;
      const result = await sql`SELECT * FROM trips WHERE id = ${parseInt(parent.trip_id)}`;
      return result[0] || null;
    },
    hotel: async (parent: any) => {
      if (!parent.hotel_id) return null;
      const result = await sql`SELECT * FROM hotels WHERE id = ${parseInt(parent.hotel_id)}`;
      return result[0] || null;
    },
  },

  Payment: {
    booking: async (parent: any) => {
      const result = await sql`SELECT * FROM bookings WHERE id = ${parent.booking_id}`;
      return result[0] || null;
    },
    user: async (parent: any) => {
      const result = await sql`SELECT * FROM users WHERE id = ${parent.user_id}`;
      return result[0] || null;
    },
  },

  Review: {
    user: async (parent: any) => {
      const result = await sql`SELECT * FROM users WHERE id = ${parent.user_id}`;
      return result[0] || null;
    },
    trip: async (parent: any) => {
      if (!parent.trip_id) return null;
      const result = await sql`SELECT * FROM trips WHERE id = ${parent.trip_id}`;
      return result[0] || null;
    },
    hotel: async (parent: any) => {
      if (!parent.hotel_id) return null;
      const result = await sql`SELECT * FROM hotels WHERE id = ${parent.hotel_id}`;
      return result[0] || null;
    },
  },
};
