import { GraphQLClient } from 'graphql-request';

// Get the API URL from environment variables or fallback to localhost
const getApiUrl = () => {
  // In Vite, environment variables are prefixed with VITE_
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  
  // If environment variable is set and not localhost, use it
  if (apiUrl && apiUrl.trim() !== '' && !apiUrl.includes('localhost')) {
    return `${apiUrl}/graphql`;
  }
  
  // In production, use relative URL to avoid localhost issues
  if (import.meta.env.PROD) {
    // Use the current domain for GraphQL requests
    return `${window.location.origin}/graphql`;
  }
  
  // Development fallback
  return 'http://localhost:5000/graphql';
};

const endpoint = getApiUrl();

// Ensure the endpoint is always a valid URL
if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
  console.warn('Invalid GraphQL endpoint, using fallback:', endpoint);
}

export const graphqlClient = new GraphQLClient(endpoint, {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  fetch: (url, options = {}) => {
    // Log request details for debugging
    console.log('GraphQL fetch request:', {
      url,
      method: options.method || 'POST',
      credentials: options.credentials,
      environment: import.meta.env.MODE,
      isProduction: import.meta.env.PROD,
      hasCookieHeader: !!options.headers && typeof options.headers === 'object' && 'cookie' in options.headers,
    });
    
    // Ensure cookies are sent
    return fetch(url, {
      ...options,
      credentials: 'include',
    }).catch((error) => {
      console.error('GraphQL fetch error:', {
        url,
        error: error.message,
        stack: error.stack
      });
      throw error;
    });
  },
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
        customerEmail
        customerPhone
        transportMode
        checkIn
        checkOut
        guests
        amount
        status
        currency
      }
      message
    }
  }
`;
