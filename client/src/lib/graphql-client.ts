import { GraphQLClient } from 'graphql-request';

const endpoint = '/graphql';

export const graphqlClient = new GraphQLClient(endpoint, {
  credentials: 'include',
});

export const CREATE_BOOKING_MUTATION = `
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
      success
      booking {
        id
        tripId
        hotelId
        customerName
        email
        phone
        transport
        checkIn
        checkOut
        guests
        totalCost
        status
        paymentStatus
        createdAt
      }
      message
    }
  }
`;
