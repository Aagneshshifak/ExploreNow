import { GraphQLClient } from 'graphql-request';

// Get the API URL from environment variables or fallback to localhost
const getApiUrl = () => {
  // In Vite, environment variables are prefixed with VITE_
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  
  if (apiUrl && apiUrl.trim() !== '') {
    return `${apiUrl}/graphql`;
  }
  
  // Always use absolute URL for development
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
      hasCookieHeader: !!options.headers && typeof options.headers === 'object' && 'cookie' in options.headers,
      cookieHeader: options.headers && typeof options.headers === 'object' && 'cookie' in options.headers 
        ? (options.headers as any).cookie?.substring(0, 50) + '...' 
        : 'No cookie header',
    });
    
    // Ensure cookies are sent
    return fetch(url, {
      ...options,
      credentials: 'include',
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
