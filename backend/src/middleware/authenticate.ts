import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from '../errors/AppError';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    organizationId: string;
    email: string;
    roleId: string;
  };
}

/**
 * Authenticate JWT token from Authorization header
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('No authorization header provided', 401);
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Invalid authorization header format', 401);
    }

    const token = parts[1];
    const payload = AuthService.verifyAccessToken(token);

    // Attach user info to request
    (req as AuthenticatedRequest).user = payload;

    next();
  } catch (error) {
    next(error);
  }
}
