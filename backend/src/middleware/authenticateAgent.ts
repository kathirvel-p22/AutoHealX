import { Request, Response, NextFunction } from 'express';
import { verifyAgentToken, getAgentById } from '../services/agentService';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';

// Extend Express Request to include agent data
declare global {
  namespace Express {
    interface Request {
      agent?: {
        id: string;
        organizationId: string;
        name?: string;
        hostname?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate agent requests via JWT token
 * Expects: Authorization: Bearer <token>
 */
export async function authenticateAgent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = await verifyAgentToken(token);

    // Get agent details
    const agent = await getAgentById(payload.agentId);

    // Check agent status
    if (agent.status === 'revoked') {
      throw new AppError('Agent has been revoked', 403);
    }

    if (agent.status === 'inactive') {
      throw new AppError('Agent is inactive', 403);
    }

    // Attach agent info to request
    req.agent = {
      id: agent.id,
      organizationId: agent.organizationId,
      name: agent.name,
      hostname: agent.hostname,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn(`Agent authentication failed: ${error.message}`);
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Agent authentication error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

/**
 * Middleware to ensure agent belongs to specific organization (for multi-tenant isolation)
 */
export function requireAgentOrganization(organizationId: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.agent) {
      res.status(401).json({ error: 'Agent not authenticated' });
      return;
    }

    if (req.agent.organizationId !== organizationId) {
      logger.warn(`Agent ${req.agent.id} attempted to access resources for organization ${organizationId}`);
      res.status(403).json({ error: 'Access denied: organization mismatch' });
      return;
    }

    next();
  };
}

export default authenticateAgent;

