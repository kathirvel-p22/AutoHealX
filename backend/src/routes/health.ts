import { Router, Request, Response } from 'express';
import sequelize from '../config/database';

const router = Router();

/**
 * GET /health - Basic health check
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'autohealx-backend'
  });
});

/**
 * GET /ready - Readiness check (includes database)
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.status(200).json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'autohealx-backend',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not ready',
      timestamp: new Date().toISOString(),
      service: 'autohealx-backend',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
