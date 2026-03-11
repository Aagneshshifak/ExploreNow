import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

// Standard API response format
export const createResponse = (success: boolean, data: any = null, message: string = "") => {
  return { success, data, message };
};

// Middleware to verify JWT token
export const requireUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[requireUser] Checking auth for ${req.method} ${req.path}`);
    const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      console.log(`[requireUser] ❌ No token found for ${req.method} ${req.path}`);
      return res.status(401).json(createResponse(false, null, "Authentication required"));
    }

    console.log(`[requireUser] ✅ Token found, verifying...`);
    
    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      console.log(`[requireUser] Token decoded: userId=${decoded.userId} (type: ${typeof decoded.userId}), email=${decoded.email}, role=${decoded.role}`);
    } catch (verifyError: any) {
      console.error(`[requireUser] ❌ Token verification failed:`, verifyError.message);
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json(createResponse(false, null, "Token expired"));
      } else if (verifyError.name === 'JsonWebTokenError') {
        return res.status(401).json(createResponse(false, null, "Invalid token"));
      }
      return res.status(401).json(createResponse(false, null, "Token verification failed"));
    }
    
    // Ensure userId is a number (handle type mismatches)
    const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : Number(decoded.userId);
    if (isNaN(userId) || userId <= 0) {
      console.error(`[requireUser] ❌ Invalid userId in token: ${decoded.userId} (type: ${typeof decoded.userId})`);
      return res.status(401).json(createResponse(false, null, "Invalid token payload"));
    }
    
    // Get user from database
    let user;
    try {
      user = await storage.getUser(userId);
      if (!user) {
        console.error(`[requireUser] ❌ User not found for userId: ${userId} (from token: ${decoded.userId})`);
        return res.status(401).json(createResponse(false, null, "User not found"));
      }
      
      // Verify user ID matches (handle type mismatches)
      const userDbId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
      if (userDbId !== userId) {
        console.error(`[requireUser] ❌ User ID mismatch: token userId=${userId}, db userId=${userDbId} (raw: ${user.id})`);
        return res.status(401).json(createResponse(false, null, "User ID mismatch"));
      }
      
      console.log(`[requireUser] ✅ User authenticated: ${user.email} (ID: ${user.id}, role: ${user.role})`);
    } catch (dbError: any) {
      console.error(`[requireUser] ❌ Database error while fetching user:`, dbError.message);
      return res.status(500).json(createResponse(false, null, "Database error during authentication"));
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error(`[requireUser] ❌ Unexpected error:`, error.message);
    console.error(`[requireUser] Error stack:`, error.stack);
    return res.status(401).json(createResponse(false, null, "Authentication failed"));
  }
};

// Middleware to verify admin role
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // First check if user is authenticated
  await requireUser(req, res, () => {
    if (!req.user) {
      return res.status(401).json(createResponse(false, null, "Authentication required"));
    }

    if (req.user.role !== "admin") {
      return res.status(403).json(createResponse(false, null, "Admin access required"));
    }

    next();
  });
};

// Generate JWT token
export const generateToken = (user: User): string => {
  try {
    // Ensure user ID is a number (handle string/number type mismatches)
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
    
    if (isNaN(userId) || userId <= 0) {
      throw new Error(`Invalid user ID: ${user.id} (type: ${typeof user.id})`);
    }
    
    // Validate required fields
    if (!user.email || !user.role) {
      throw new Error(`Missing required user fields: email=${!!user.email}, role=${!!user.role}`);
    }
    
    // Verify JWT_SECRET is set
    if (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production") {
      console.warn("⚠️  Using default JWT_SECRET. This should be changed in production!");
    }
    
    const payload: JWTPayload = {
      userId: userId,
      email: user.email,
      role: user.role,
    };
    
    console.log(`[generateToken] Generating token for user: ${user.email} (ID: ${userId}, type: ${typeof userId})`);
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
    
    // Verify the token can be decoded (basic validation)
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      if (decoded.userId !== userId) {
        throw new Error(`Token userId mismatch: expected ${userId}, got ${decoded.userId}`);
      }
      console.log(`[generateToken] ✅ Token generated and verified successfully for user ${user.email}`);
    } catch (verifyError: any) {
      console.error(`[generateToken] ❌ Token verification failed:`, verifyError.message);
      throw new Error(`Failed to verify generated token: ${verifyError.message}`);
    }
    
    return token;
  } catch (error: any) {
    console.error(`[generateToken] ❌ Error generating token for user ${user.email}:`, error.message);
    throw error;
  }
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json(createResponse(false, null, message));
};