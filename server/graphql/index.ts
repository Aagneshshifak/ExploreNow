import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs, resolvers } from './schema';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Map to store Express req/res for each request (keyed by request URL + timestamp)
// Using WeakMap would be better, but we need a way to generate keys
const requestStore = new Map<string, { req: ExpressRequest; res: ExpressResponse }>();

// Helper to parse cookies from cookie header string
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}

// Create Yoga instance with context that expects Express req/res
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  landingPage: false,
  context: async ({ request }: { request: Request }) => {
    // Try multiple methods to get Express req/res:
    // 1. From attached properties (if preserved)
    let expressReq = (request as any).__expressReq as ExpressRequest | undefined;
    let expressRes = (request as any).__expressRes as ExpressResponse | undefined;
    
    // 2. If not found, try to get from request store using a unique identifier
    if (!expressReq) {
      // Try to match by URL and cookie header as a fallback
      const cookieHeader = request.headers.get('cookie');
      const requestId = `${request.url}_${cookieHeader?.substring(0, 50) || 'no-cookies'}`;
      const stored = requestStore.get(requestId);
      if (stored) {
        expressReq = stored.req;
        expressRes = stored.res;
        // Clean up after use
        requestStore.delete(requestId);
      }
    }
    
    // 3. If still not found, parse cookies from Fetch Request headers
    let cookies: Record<string, string> = {};
    let headers: Record<string, any> = {};
    
    if (expressReq) {
      // Use Express parsed cookies (from cookie-parser middleware) - preferred method
      cookies = expressReq.cookies || {};
      headers = expressReq.headers || {};
    } else {
      // Fallback: Parse cookies from Fetch Request Cookie header
      const cookieHeader = request.headers.get('cookie');
      cookies = parseCookies(cookieHeader);
      
      // Convert Headers object to plain object
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      console.warn('GraphQL context - Using fallback cookie parsing (Express req not found)');
    }
    
    // Log authentication info
    console.log('=== GraphQL Context Debug ===');
    console.log('Express req found:', !!expressReq);
    console.log('Has cookies object:', !!expressReq?.cookies);
    console.log('Parsed cookies count:', Object.keys(cookies).length);
    console.log('Cookie token exists:', !!cookies.token);
    if (cookies.token) {
      console.log('✅ Cookie token found (first 30 chars):', cookies.token.substring(0, 30) + '...');
    } else {
      console.log('❌ NO TOKEN FOUND in cookies');
      console.log('All cookie keys:', Object.keys(cookies));
      const cookieHeader = request.headers.get('cookie');
      console.log('Cookie header from Fetch Request:', cookieHeader ? cookieHeader.substring(0, 100) + '...' : 'No cookie header');
    }
    console.log('===========================');
    
    return {
      req: {
        ...(expressReq || {}),
        cookies: cookies,
        headers: headers,
        method: expressReq?.method || request.method,
        path: expressReq?.path || expressReq?.url || new URL(request.url).pathname
      },
      res: expressRes || null
    };
  },
});

// Express middleware wrapper that captures req/res and passes to Yoga
export const yogaMiddleware = async (expressReq: ExpressRequest, expressRes: ExpressResponse, next: any) => {
  try {
    // Convert Express request to Fetch API Request
    const protocol = expressReq.protocol || 'http';
    const host = expressReq.get('host') || 'localhost:5000';
    const path = expressReq.originalUrl || expressReq.url || '/graphql';
    const url = `${protocol}://${host}${path}`;
    
    // Get request body - Express json() middleware should have parsed it
    let body: string | undefined;
    if (expressReq.body) {
      // Body is already parsed by express.json()
      body = typeof expressReq.body === 'string' 
        ? expressReq.body 
        : JSON.stringify(expressReq.body);
    }
    
    // Create headers object from Express request - CRITICAL: Ensure Cookie header is included
    const headers: HeadersInit = {};
    Object.keys(expressReq.headers).forEach((key) => {
      const value = expressReq.headers[key];
      if (value) {
        // Convert array to string for headers
        headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    });
    
    // CRITICAL: If cookie-parser has parsed cookies, ensure they're in the Cookie header
    // This is a fallback to ensure cookies are always available in Fetch Request
    if (expressReq.cookies && Object.keys(expressReq.cookies).length > 0) {
      // Reconstruct cookie header from parsed cookies
      const cookieStrings = Object.entries(expressReq.cookies).map(([name, value]) => `${name}=${value}`);
      headers['cookie'] = cookieStrings.join('; ');
      console.log('GraphQL middleware - Reconstructed cookie header from parsed cookies');
    }
    
    // Create Fetch API Request
    const fetchRequestInit: RequestInit = {
      method: expressReq.method,
      headers: headers,
    };
    
    // Only add body for methods that support it
    if (body && ['POST', 'PUT', 'PATCH'].includes(expressReq.method)) {
      fetchRequestInit.body = body;
    }
    
    const fetchRequest = new Request(url, fetchRequestInit);
    
    // Store Express req/res in request store as fallback (keyed by URL + cookie header)
    const cookieHeader = headers['cookie'] as string | undefined;
    const requestId = `${url}_${cookieHeader?.substring(0, 50) || 'no-cookies'}`;
    requestStore.set(requestId, { req: expressReq, res: expressRes });
    
    // Attach Express req/res to Fetch Request so context can access them (primary method)
    (fetchRequest as any).__expressReq = expressReq;
    (fetchRequest as any).__expressRes = expressRes;
    
    // Log middleware execution
    console.log('GraphQL middleware - Request received:', {
      method: expressReq.method,
      url: path,
      hasBody: !!body,
      hasCookies: !!expressReq.cookies,
      cookieCount: expressReq.cookies ? Object.keys(expressReq.cookies).length : 0,
      hasToken: !!expressReq.cookies?.token,
      cookieHeaderInRequest: !!headers['cookie'],
      cookieHeaderLength: headers['cookie'] ? String(headers['cookie']).length : 0
    });
    
    // Call Yoga's fetch handler
    const response = await yoga.fetch(fetchRequest, {
      req: expressReq,
      res: expressRes,
    } as any);
    
    // Clean up request store after processing
    requestStore.delete(requestId);
    
    // Copy response headers to Express response
    response.headers.forEach((value, key) => {
      expressRes.setHeader(key, value);
    });
    
    // Set status code
    expressRes.status(response.status);
    
    // Send response body
    const text = await response.text();
    expressRes.send(text);
  } catch (error: any) {
    console.error('GraphQL Yoga middleware error:', error);
    if (!expressRes.headersSent) {
      expressRes.status(500).json({
        success: false,
        message: 'GraphQL request failed',
        error: error?.message || 'Unknown error'
      });
    } else {
      next(error);
    }
  }
};
