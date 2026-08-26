import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';

/**
 * Enforce tenant isolation - ensure organization_id in request matches user's organization
 * Use this middleware on routes that accept organization_id in params or body
 */
export function enforceTenantIsolation(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      throw new AppError('Authentication required', 401);
    }

    const userOrgId = authReq.user.organizationId;
    
    // Check organization_id in route params
    const paramOrgId = req.params.organization_id || req.params.organizationId;
    if (paramOrgId && paramOrgId !== userOrgId) {
      logger.warn(`Tenant isolation violation: User ${authReq.user.email} attempted to access org ${paramOrgId}`);
      throw new AppError('Access to resource outside your organization is forbidden', 403);
    }

    // Check organization_id in request body
    const bodyOrgId = (req.body as any)?.organization_id || (req.body as any)?.organizationId;
    if (bodyOrgId && bodyOrgId !== userOrgId) {
      logger.warn(`Tenant isolation violation: User ${authReq.user.email} attempted to create resource in org ${bodyOrgId}`);
      throw new AppError('Cannot create resources in other organizations', 403);
    }

    // Check organization_id in query params
    const queryOrgId = req.query.organization_id || req.query.organizationId;
    if (queryOrgId && queryOrgId !== userOrgId) {
      logger.warn(`Tenant isolation violation: User ${authReq.user.email} attempted to query org ${queryOrgId}`);
      throw new AppError('Cannot query resources from other organizations', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Inject user's organization_id into request context
 * Use this for routes that need to filter by organization but don't accept it as parameter
 */
export function injectOrganizationId(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  
  if (authReq.user) {
    // Store in res.locals for access in controllers
    res.locals.organizationId = authReq.user.organizationId;
  }
  
  next();
}
