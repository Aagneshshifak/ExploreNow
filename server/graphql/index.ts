import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs, resolvers } from './schema';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  landingPage: false,
  context: async ({ request }: { request: Request }) => {
    // GraphQL Yoga v5 with Express - try multiple ways to access Express req/res
    // The request object might have Express req/res attached in different ways
    const req = (request as any).node?.req || 
                (request as any).raw || 
                (request as any).__expressReq ||
                (request as any).req ||
                request;
    
    const res = (request as any).node?.res || 
                (request as any).raw?.res || 
                (request as any).__expressRes ||
                (request as any).res;
    
    // Get cookies - prioritize Express parsed cookies, then parse from headers
    let cookies: any = {};
    let headers: any = {};
    
    // Check all possible locations for cookies
    if (req && typeof req === 'object') {
      if (req.cookies && typeof req.cookies === 'object') {
        // Express cookie-parser has parsed cookies
        cookies = req.cookies;
        headers = req.headers || {};
        console.log('GraphQL context - Using Express parsed cookies');
      } else if (req.headers) {
        // Try to get from headers
        headers = req.headers;
        const cookieHeader = headers.cookie || headers.Cookie || '';
        if (cookieHeader) {
          cookieHeader.split(';').forEach((cookie: string) => {
            const trimmed = cookie.trim();
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
              const key = trimmed.substring(0, equalIndex).trim();
              const value = trimmed.substring(equalIndex + 1).trim();
              if (key && value) {
                cookies[key] = decodeURIComponent(value);
              }
            }
          });
          console.log('GraphQL context - Parsed cookies from header');
        }
      }
    }
    
    // Also try to get cookies from Fetch API Request headers
    if (Object.keys(cookies).length === 0 && request.headers) {
      const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';
      if (cookieHeader) {
        cookieHeader.split(';').forEach((cookie: string) => {
          const trimmed = cookie.trim();
          const equalIndex = trimmed.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            const value = trimmed.substring(equalIndex + 1).trim();
            if (key && value) {
              cookies[key] = decodeURIComponent(value);
            }
          }
        });
        console.log('GraphQL context - Parsed cookies from Fetch Request headers');
      }
    }
    
    // Log comprehensive debugging info
    console.log('=== GraphQL Context Debug ===');
    console.log('Request type:', typeof request);
    console.log('Request keys:', Object.keys(request || {}));
    console.log('Has node.req:', !!(request as any).node?.req);
    console.log('Has raw:', !!(request as any).raw);
    console.log('Has req property:', !!(request as any).req);
    console.log('Express req type:', typeof req);
    console.log('Express req has cookies:', !!req?.cookies);
    console.log('Parsed cookies count:', Object.keys(cookies).length);
    console.log('Cookie token exists:', !!cookies.token);
    if (cookies.token) {
      console.log('Cookie token (first 30 chars):', cookies.token.substring(0, 30) + '...');
    } else {
      console.log('❌ NO TOKEN FOUND');
      console.log('All cookie keys:', Object.keys(cookies));
    }
    console.log('===========================');
    
    return {
      req: {
        ...(req || {}),
        cookies: cookies,
        headers: headers || {},
        method: req?.method || request.method,
        path: req?.path || req?.url || request.url
      },
      res: res
    };
  },
});
