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
import { startPredictionUpdateJob } from "./jobs/updatePredictions";

const app = express();

// Add startup logging
console.log('🚀 Starting ExploreNow server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Node version:', process.version);
console.log('📦 Platform:', process.platform);

// Check critical environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('   Please set these environment variables and restart the server');
  process.exit(1);
}

console.log('✅ Environment variables check passed');

// CORS configuration for frontend compatibility
// Important: credentials: true is required for cookie-based authentication
const corsOptions = {
  origin: true, // Allow all origins in development
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
  try {
    console.log('🔧 Setting up routes...');
    // Use translation routes BEFORE registerRoutes to avoid conflicts
    app.use('/api', translateRoutes);
    
    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');
    
    // Setup GraphQL - must be before Vite setup
    // Use middleware wrapper to properly pass Express req/res with cookies
    app.use('/graphql', yogaMiddleware);
    console.log('✅ GraphQL middleware configured');

    // Add a simple test route to verify server is working
    app.get('/api/test', (req, res) => {
      res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
    });

    app.use(errorHandler);

    // Check if we're running in integrated mode (Vite + Express together)
    const isIntegratedMode = process.env.INTEGRATED_MODE === 'true';
    
    if (app.get("env") === "development" && isIntegratedMode) {
      console.log('🔧 Setting up Vite development server in integrated mode...');
      await setupVite(app, server);
    } else if (app.get("env") === "development") {
      console.log('🔧 Running in separate mode - Vite dev server should be running on port 5173');
      // Serve static files for development when running separately
      app.use(express.static(path.resolve(import.meta.dirname, '..', 'client', 'public')));
    } else {
      console.log('🔧 Setting up static file serving for production...');
      try {
        serveStatic(app);
        console.log('✅ Static file serving configured');
      } catch (staticError) {
        console.error('❌ Failed to setup static file serving:', staticError);
        throw staticError;
      }
    }

    // Serve the app on a configurable port (defaults to 5000)
    // This allows running the server on an alternate port if 5000 is in use.
    const port = process.env.PORT ? Number(process.env.PORT) : 5000;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    console.log(`🚀 Starting server on ${host}:${port}...`);
    
    server.listen(port, host, () => {
      log(`serving on ${host}:${port}`);
      if (app.get("env") === "development") {
        console.log('\n🚀 Development servers running:');
        console.log('   Frontend (Vite): http://localhost:5173/');
        console.log('   Backend (API):   http://localhost:5000/');
        console.log('   GraphQL:         http://localhost:5000/graphql');
        console.log('   Test endpoint:   http://localhost:5000/test');
        console.log('\n💡 Use http://localhost:5173/ for the main application\n');
      } else {
        console.log(`🚀 Production server running on ${host}:${port}`);
        console.log('✅ Server startup completed successfully');
      }
      
      // Start prediction update job after server is listening
      try {
        startPredictionUpdateJob();
        console.log('✅ Prediction update job started');
      } catch (jobError) {
        console.error('⚠️  Failed to start prediction update job:', jobError);
        // Don't exit - this is not critical for basic functionality
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
    
  } catch (setupError) {
    console.error('❌ Failed during server setup:', setupError);
    console.error('Stack trace:', setupError instanceof Error ? setupError.stack : setupError);
    process.exit(1);
  }
})().catch((error) => {
  console.error('❌ Failed to start server:', error);
  console.error('Stack trace:', error instanceof Error ? error.stack : error);
  process.exit(1);
});
