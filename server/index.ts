import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import cors from "cors";
// import { registerRoutes } from "./routes"; // Switched to Prisma
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./middleware-prisma";
// import { seedDatabase } from "./seed"; // Switched to Prisma
import { seedDatabase } from "./prisma-seed-runner";
import prismaRoutes from "./prisma-routes";
import translateRoutes from "./routes/translate";

const app = express();

// CORS configuration for frontend compatibility
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://explorenow.vercel.app', 'https://*.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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

  next();
});

(async () => {
  // const server = await registerRoutes(app); // Switched to Prisma
  const server = createServer(app);
  
  // Use Prisma routes
  app.use(prismaRoutes);
  
  // Use translation routes
  app.use('/api', translateRoutes);

  // Seed database with sample data (only if empty)
  try {
    await seedDatabase();
  } catch (error) {
    log("Database seeding skipped or failed - this is normal if data already exists");
  }

  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
