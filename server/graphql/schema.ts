import { sql } from '../db';

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
    paymentStatus: String!
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

  type BookingResponse {
    success: Boolean!
    booking: Booking
    message: String
  }

  type Query {
    bookings: [Booking!]!
    booking(id: ID!): Booking
  }

  type Mutation {
    createBooking(input: BookingInput!): BookingResponse!
  }
`;

const resolvers = {
  Query: {
    bookings: async () => {
      const result = await sql`SELECT * FROM bookings ORDER BY id DESC`;
      return result;
    },
    booking: async (_, { id }) => {
      const result = await sql`SELECT * FROM bookings WHERE id = ${id}`;
      return result[0];
    }
  },
  Booking: {
    tripId: (parent) => parent.trip_id || '',
    hotelId: (parent) => parent.hotel_id || '',
    customerName: (parent) => parent.customer_name || '',
    checkIn: (parent) => parent.check_in || '',
    checkOut: (parent) => parent.check_out || '',
    totalCost: (parent) => parent.total_cost ? parseFloat(parent.total_cost.toString()) : 0,
    paymentStatus: (parent) => parent.payment_status || '',
  },

  Mutation: {
    createBooking: async (_, { input }) => {
      try {
        const { tripId, hotelId, customerName, email, phone, transport, 
                checkIn, checkOut, guests, totalCost } = input;
        
        // Validation
        if (!tripId || !hotelId || !customerName || !email || !phone) {
          return {
            success: false,
            booking: null,
            message: "Customer details (name, email, phone) are required"
          };
        }
        
        if (!checkIn || !checkOut) {
          return {
            success: false,
            booking: null,
            message: "Check-in and check-out dates are required"
          };
        }
        
        // Create booking
        const bookingResult = await sql`
          INSERT INTO bookings (
            trip_id, hotel_id, customer_name, email, phone, transport, 
            check_in, check_out, guests, total_cost, status, payment_status
          ) VALUES (
            ${tripId},
            ${hotelId},
            ${customerName},
            ${email},
            ${phone},
            ${transport || 'flight'},
            ${checkIn},
            ${checkOut},
            ${guests || 1},
            ${totalCost},
            'confirmed',
            'dummy'
          ) RETURNING *
        `;
        
        const booking = bookingResult[0];
        
        return {
          success: true,
          booking,
          message: "Booking created successfully"
        };
      } catch (error) {
        console.error("GraphQL createBooking error:", error);
        return {
          success: false,
          booking: null,
          message: "Failed to create booking"
        };
      }
    }
  }
};

export { typeDefs, resolvers };
