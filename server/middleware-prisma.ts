import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from './prisma-storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const requireUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "User not found"
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Invalid token"
    });
  }
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await requireUser(req, res, () => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Admin access required"
        });
      }
      next();
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "Admin access required"
    });
  }
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  res.status(500).json({
    success: false,
    data: null,
    message: "Internal server error"
  });
};