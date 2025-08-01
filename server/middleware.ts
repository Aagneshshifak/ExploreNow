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
    const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json(createResponse(false, null, "Authentication required"));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json(createResponse(false, null, "User not found"));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(createResponse(false, null, "Invalid token"));
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
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json(createResponse(false, null, message));
};