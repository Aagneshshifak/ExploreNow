import { sql } from '../db';
import { bookings } from '../../shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

const typeDefs = `
  type Booking {
    id: ID!
    tripId: String!
    hotelId: String!
    customerName: String!
    email: String!
    phone: String!
    transport: String!
    checkIn: String!
    checkOut: String!
    guests: Int!
    totalCost: Float!
    status: String!
  }

  input BookingInput {
    tripId: String!
    hotelId: String!
    customerName: String!
    email: String!
    phone: String!
    transport: String!
    checkIn: String!
    checkOut: String!
    guests: Int!
    totalCost: Float!
  }

  type Query {
    bookings: [Booking!]!
    booking(id: ID!): Booking
  }

  type Mutation {
    createBooking(input: BookingInput!): Booking!
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
    email: (parent) => parent.customerEmail,
    phone: (parent) => parent.customerPhone,
    transport: (parent) => parent.transportMode,
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
    totalCost: (parent) => parseFloat(parent.amount.toString()),
    status: (parent) => parent.status,
  },

  Mutation: {
    createBooking: async (_: any, { input }: { input: any }) => {
      try {
        const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const booking = await db.insert(bookings).values({
          id: bookingId,
          userId: 1, // Default user ID for Phase 1
          tripId: input.tripId,
          hotelId: input.hotelId,
          type: 'trip', // Default type for Phase 1
          customerName: input.customerName,
          customerEmail: input.email,
          customerPhone: input.phone,
          transportMode: input.transport,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guests: input.guests,
          amount: input.totalCost,
          status: "confirmed",
          currency: "USD", // Default currency for Phase 1
        }).returning();
        
        return booking[0];
      } catch (error: any) {
        console.error("GraphQL createBooking error:", error);
        throw new Error("Failed to create booking: " + error.message);
      }
    }
  }
};

export { typeDefs, resolvers };
