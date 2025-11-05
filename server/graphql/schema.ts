import { sql } from '../db';
import { bookings } from '../../shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Helper function to get user from context (consistent with resolvers.ts)
const getUserFromContext = (context: any) => {
  if (!context || !context.req) return null;
  const token = context.req.cookies?.token || context.req.headers?.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

const typeDefs = `
  type Booking {
    id: ID!
    tripId: String
    hotelId: String
    customerName: String!
    customerEmail: String!
    customerPhone: String!
    transportMode: String
    checkIn: String!
    checkOut: String!
    guests: Int!
    amount: Float!
    status: String!
    currency: String
  }

  input BookingInput {
    tripId: String
    hotelId: String
    customerName: String!
    customerEmail: String!
    customerPhone: String!
    transportMode: String
    checkIn: String!
    checkOut: String!
    guests: Int!
    amount: Float!
    currency: String
    specialRequests: String
    emergencyContact: String
    emergencyPhone: String
    transportDetails: String
  }

  type Query {
    bookings: [Booking!]!
    booking(id: ID!): Booking
  }

  type Mutation {
    createBooking(input: BookingInput!): BookingResponse!
  }

  type BookingResponse {
    success: Boolean!
    booking: Booking
    message: String!
  }
`;

const resolvers = {
  Query: {
    bookings: async () => {
      // Use raw SQL to check what columns exist
      try {
        const result = await sql`SELECT * FROM bookings LIMIT 1`;
        console.log('Actual database columns:', result[0] ? Object.keys(result[0]) : 'No data found');
        return await sql`SELECT * FROM bookings ORDER BY id DESC`;
      } catch (error) {
        console.error('Error querying bookings:', error);
        return [];
      }
    },
    booking: async (_, { id }) => {
      const result = await sql`SELECT * FROM bookings WHERE id = ${id}`;
      return result[0];
    }
  },
  Booking: {
    id: (parent) => parent.id.toString(),
    tripId: (parent) => parent.tripId,
    hotelId: (parent) => parent.hotelId,
    customerName: (parent) => parent.customerName,
    customerEmail: (parent) => parent.customerEmail,
    customerPhone: (parent) => parent.customerPhone,
    transportMode: (parent) => parent.transportMode,
    checkIn: (parent) => {
      if (!parent.checkIn) return '';
      if (parent.checkIn instanceof Date) {
        return parent.checkIn.toISOString().split('T')[0];
      }
      return parent.checkIn.toString();
    },
    checkOut: (parent) => {
      if (!parent.checkOut) return '';
      if (parent.checkOut instanceof Date) {
        return parent.checkOut.toISOString().split('T')[0];
      }
      return parent.checkOut.toString();
    },
    guests: (parent) => parent.guests,
    amount: (parent) => parseFloat(parent.amount.toString()),
    status: (parent) => parent.status,
    currency: (parent) => parent.currency,
  },

  Mutation: {
    createBooking: async (_: any, { input }: { input: any }, context: any) => {
      try {
        // Log context structure for debugging
        console.log('GraphQL createBooking - Context received:', {
          hasContext: !!context,
          hasReq: !!context?.req,
          hasCookies: !!context?.req?.cookies,
          hasToken: !!context?.req?.cookies?.token,
          hasAuthHeader: !!context?.req?.headers?.authorization,
          contextKeys: context ? Object.keys(context) : []
        });
        
        // Get user from context - use consistent helper function
        const user = getUserFromContext(context);
        
        if (!user || !user.userId) {
          console.error('GraphQL createBooking - No authenticated user found', {
            userExists: !!user,
            userIdExists: !!user?.userId,
            contextStructure: context ? {
              hasReq: !!context.req,
              hasCookies: !!context.req?.cookies,
              cookieKeys: context.req?.cookies ? Object.keys(context.req.cookies) : []
            } : 'No context'
          });
          return {
            success: false,
            booking: null,
            message: 'Authentication required. Please log in to create a booking.'
          };
        }
        
        const userId = user.userId;
        console.log('GraphQL createBooking - Authenticated userId:', userId);
        
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
        
        // Determine booking type
        const type = tripId ? 'trip' : 'hotel';
        
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
        
        return {
          success: true,
          booking,
          message: 'Booking created successfully'
        };
      } catch (error: any) {
        console.error("GraphQL createBooking error:", error);
        return {
          success: false,
          booking: null,
          message: 'Failed to create booking: ' + error.message
        };
      }
    }
  }
};

export { typeDefs, resolvers };
