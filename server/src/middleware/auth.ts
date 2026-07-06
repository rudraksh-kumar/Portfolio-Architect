import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include userId
export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ error: 'Authentication failed. Token is invalid or expired.' });
  }
};
