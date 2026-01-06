import fs from "fs";
const routesFileContent = fs.readFileSync("./server/routes.ts", "utf-8");
console.log("routes.ts content:", routesFileContent);
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./middleware";
import translateRoutes from "./routes/translate";
import { yogaMiddleware } from "./graphql";

const app = express();

// CORS configuration for frontend compatibility
// Important: credentials: true is required for cookie-based authentication
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://explorenow.vercel.app', 'https://*.vercel.app'] 
    : ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5000'],
  credentials: true, // Required for cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'], // Expose Set-Cookie header to frontend
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Log CORS configuration in development
if (process.env.NODE_ENV !== 'production') {
  console.log('[CORS] Configuration:', {
    credentials: corsOptions.credentials,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    origins: corsOptions.origin
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

  // Add debugging middleware to log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - User-Agent: ${req.headers['user-agent']}`);
    
    // Handle 403 errors more gracefully
    if (req.path.includes('.tsx') || req.path.includes('.ts') || req.path.includes('.jsx') || req.path.includes('.js')) {
      console.log(`Static file request: ${req.path}`);
    }
    
    next();
  });

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  // Log 403 errors for debugging
  if (res.statusCode === 403) {
    console.log(`403 Error: ${req.method} ${req.path} - ${req.headers['user-agent']}`);
  }

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Use translation routes
  app.use('/api', translateRoutes);
  
  // Setup GraphQL - must be before Vite setup
  // Use middleware wrapper to properly pass Express req/res with cookies
  app.use('/graphql', yogaMiddleware);

  // Add a simple test route to verify server is working
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
  });

  // Add root route to redirect to Vite dev server in development
  app.get('/', (req, res) => {
    if (app.get("env") === "development") {
      res.redirect('http://localhost:5173/');
    } else {
      res.json({ 
        message: 'ExploreNow API Server', 
        status: 'running',
        timestamp: new Date().toISOString(),
        docs: '/graphql'
      });
    }
  });

  app.use(errorHandler);



  // Check if we're running in integrated mode (Vite + Express together)
  const isIntegratedMode = process.env.INTEGRATED_MODE === 'true';
  
  if (app.get("env") === "development" && isIntegratedMode) {
    console.log('Setting up Vite development server in integrated mode...');
    await setupVite(app, server);
  } else if (app.get("env") === "development") {
    console.log('Running in separate mode - Vite dev server should be running on port 5173');
    // Serve static files for development when running separately
    app.use(express.static(path.resolve(import.meta.dirname, '..', 'client', 'public')));
  } else {
    console.log('Setting up static file serving for production...');
    serveStatic(app);
  }

  // Serve the app on a configurable port (defaults to 5000)
  // This allows running the server on an alternate port if 5000 is in use.
  const port = process.env.PORT ? Number(process.env.PORT) : 5000;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
    if (app.get("env") === "development") {
      console.log('\n🚀 Development servers running:');
      console.log('   Frontend (Vite): http://localhost:5173/');
      console.log('   Backend (API):   http://localhost:5000/');
      console.log('   GraphQL:         http://localhost:5000/graphql');
      console.log('   Test endpoint:   http://localhost:5000/test');
      console.log('\n💡 Use http://localhost:5173/ for the main application\n');
    }
  });

  // Add error handlers for the server
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Please stop the other server or use a different port.`);
      console.error(`   Try: lsof -ti:${port} | xargs kill -9`);
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1);
  });
})().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
