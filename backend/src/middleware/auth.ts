import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.token) {
    // 2. Check cookies
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to proceed.',
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }

  req.user = payload;
  next();
}

export function authorize(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}]. Your role is ${req.user.role}.`,
      });
    }

    next();
  };
}
