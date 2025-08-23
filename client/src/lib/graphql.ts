import { createClient } from 'graphql-ws';
import { GraphQLClient } from 'graphql-request';

// Get the API URL from environment variables or fallback to localhost
const getApiUrl = () => {
  // In Vite, environment variables are prefixed with VITE_
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  
  if (apiUrl && apiUrl.trim() !== '') {
    return apiUrl;
  }
  
  // Always use absolute URL for development
  return 'http://localhost:5000';
};

const baseUrl = getApiUrl();

// Ensure the base URL is always valid
if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
  console.warn('Invalid GraphQL base URL, using fallback:', baseUrl);
}

// GraphQL HTTP client for queries and mutations
export const graphqlClient = new GraphQLClient(`${baseUrl}/graphql`, {
  credentials: 'include', // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// GraphQL WebSocket client for subscriptions (if needed later)
export const wsClient = createClient({
  url: `${baseUrl.replace('http', 'ws')}/graphql`,
});

// Common GraphQL queries
export const TRIPS_QUERY = `
  query GetTrips {
    trips {
      id
      title
      location
      description
      price
      imageUrl
      duration
      tags
      includes
      createdAt
    }
  }
`;

export const HOTELS_QUERY = `
  query GetHotels {
    hotels {
      id
      name
      location
      description
      price
      imageUrl
      rating
      tags
      includes
      amenities
      createdAt
    }
  }
`;

export const TRIP_QUERY = `
  query GetTrip($id: ID!) {
    trip(id: $id) {
      id
      title
      location
      description
      price
      imageUrl
      duration
      tags
      includes
      createdAt
    }
  }
`;

export const HOTEL_QUERY = `
  query GetHotel($id: ID!) {
    hotel(id: $id) {
      id
      name
      location
      description
      price
      imageUrl
      rating
      tags
      includes
      amenities
      createdAt
    }
  }
`;

export const USER_BOOKINGS_QUERY = `
  query GetUserBookings {
    userBookings {
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
      createdAt
      trip {
        id
        title
        location
        price
      }
      hotel {
        id
        name
        location
        price
      }
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      message
      user {
        id
        name
        email
        role
      }
      token
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
      user {
        id
        name
        email
        role
      }
      token
    }
  }
`;

export const CREATE_BOOKING_MUTATION = `
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
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
    }
  }
`;

export const CREATE_PAYMENT_MUTATION = `
  mutation CreatePayment($input: PaymentInput!) {
    createPayment(input: $input) {
      success
      message
      payment {
        id
        bookingId
        userId
        amount
        currency
        paymentMethod
        cardHolderName
        cardLastFour
        status
        transactionId
        createdAt
      }
    }
  }
`;

export const CREATE_REVIEW_MUTATION = `
  mutation CreateReview($input: ReviewInput!) {
    createReview(input: $input) {
      id
      userId
      tripId
      hotelId
      rating
      title
      comment
      createdAt
    }
  }
`;

// Helper function to execute GraphQL queries
export const executeQuery = async (query: string, variables?: any) => {
  try {
    const data = await graphqlClient.request(query, variables);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Helper function to execute GraphQL mutations
export const executeMutation = async (mutation: string, variables?: any) => {
  try {
    const data = await graphqlClient.request(mutation, variables);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
