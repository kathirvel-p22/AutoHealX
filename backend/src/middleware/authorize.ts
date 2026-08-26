import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { Role } from '../models';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';

/**
 * Role-based authorization middleware
 * Checks if user has required permission(s)
 * @param requiredPermissions - One or more permission strings
 */
export function authorize(...requiredPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw new AppError('Authentication required', 401);
      }

      // Get user's role and permissions
      const role = await Role.findByPk(authReq.user.roleId);
      
      if (!role) {
        throw new AppError('User role not found', 403);
      }

      // Check if role has any of the required permissions
      const permissions = role.permissions as string[];
      const hasPermission = permissions.includes('*') || 
                           requiredPermissions.some(perm => permissions.includes(perm));

      if (!hasPermission) {
        logger.warn(`Authorization failed: User ${authReq.user.email} missing permissions ${requiredPermissions.join(', ')}`);
        throw new AppError(`Insufficient permissions: one of [${requiredPermissions.join(', ')}] required`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user has specific role
 */
export function requireRole(roleName: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw new AppError('Authentication required', 401);
      }

      const role = await Role.findByPk(authReq.user.roleId);
      
      if (!role || role.name !== roleName) {
        throw new AppError(`Role ${roleName} required`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user has any of the specified roles
 */
export function requireAnyRole(roleNames: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw new AppError('Authentication required', 401);
      }

      const role = await Role.findByPk(authReq.user.roleId);
      
      if (!role || !roleNames.includes(role.name)) {
        throw new AppError(`One of roles [${roleNames.join(', ')}] required`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
