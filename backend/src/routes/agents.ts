import express from 'express';
import { body, param, query } from 'express-validator';
import * as agentController from '../controllers/agentController';
import { authenticate } from '../middleware/authenticate';
import { authenticateAgent } from '../middleware/authenticateAgent';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// ============================================================
// AGENT AUTHENTICATION (Public - No Auth Required)
// ============================================================

/**
 * POST /api/v1/agents/authenticate
 * Exchange API key for JWT token
 */
router.post(
  '/authenticate',
  [
    body('apiKey')
      .isString()
      .notEmpty()
      .withMessage('API key is required'),
  ],
  validateRequest,
  agentController.authenticate
);

// ============================================================
// AGENT MANAGEMENT (Admin Only)
// ============================================================

/**
 * POST /api/v1/agents/register
 * Register a new agent (requires admin authentication)
 */
router.post(
  '/register',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  [
    body('organizationId')
      .isUUID()
      .withMessage('Valid organization ID required'),
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Agent name must be 1-255 characters'),
    body('hostname')
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Hostname required'),
    body('platform')
      .isString()
      .trim()
      .isIn(['win32', 'darwin', 'linux', 'freebsd', 'openbsd', 'sunos', 'aix'])
      .withMessage('Valid platform required'),
    body('version')
      .isString()
      .trim()
      .matches(/^\d+\.\d+\.\d+$/)
      .withMessage('Version must be semver format (e.g., 2.0.0)'),
    body('capabilities')
      .optional()
      .isArray()
      .withMessage('Capabilities must be an array'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  validateRequest,
  agentController.register
);

/**
 * GET /api/v1/agents/organizations/:organizationId
 * List all agents in organization
 */
router.get(
  '/organizations/:organizationId',
  authenticate,
  authorize('OWNER', 'ADMIN', 'OPERATOR'),
  [
    param('organizationId')
      .isUUID()
      .withMessage('Valid organization ID required'),
    query('status')
      .optional()
      .isIn(['pending', 'active', 'inactive', 'revoked'])
      .withMessage('Invalid status filter'),
    query('platform')
      .optional()
      .isString()
      .withMessage('Invalid platform filter'),
  ],
  validateRequest,
  agentController.list
);

/**
 * GET /api/v1/agents/:id
 * Get agent details
 */
router.get(
  '/:id',
  authenticate,
  authorize('OWNER', 'ADMIN', 'OPERATOR'),
  [
    param('id')
      .isUUID()
      .withMessage('Valid agent ID required'),
  ],
  validateRequest,
  agentController.get
);

/**
 * PATCH /api/v1/agents/:id/status
 * Update agent status
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  [
    param('id')
      .isUUID()
      .withMessage('Valid agent ID required'),
    body('status')
      .isIn(['pending', 'active', 'inactive', 'revoked'])
      .withMessage('Invalid status'),
  ],
  validateRequest,
  agentController.updateStatus
);

/**
 * POST /api/v1/agents/:id/revoke
 * Revoke agent (permanent)
 */
router.post(
  '/:id/revoke',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  [
    param('id')
      .isUUID()
      .withMessage('Valid agent ID required'),
  ],
  validateRequest,
  agentController.revoke
);

/**
 * POST /api/v1/agents/:id/rotate-key
 * Rotate agent API key
 */
router.post(
  '/:id/rotate-key',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  [
    param('id')
      .isUUID()
      .withMessage('Valid agent ID required'),
  ],
  validateRequest,
  agentController.rotateKey
);

/**
 * GET /api/v1/agents/:id/health
 * Get agent health history
 */
router.get(
  '/:id/health',
  authenticate,
  authorize('OWNER', 'ADMIN', 'OPERATOR'),
  [
    param('id')
      .isUUID()
      .withMessage('Valid agent ID required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  validateRequest,
  agentController.getHealth
);

// ============================================================
// AGENT-AUTHENTICATED ENDPOINTS
// ============================================================

/**
 * POST /api/v1/agents/heartbeat
 * Record agent heartbeat (requires agent authentication)
 */
router.post(
  '/heartbeat',
  authenticateAgent,
  [
    body('status')
      .isIn(['online', 'offline', 'degraded'])
      .withMessage('Invalid status'),
    body('cpuUsage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('CPU usage must be 0-100'),
    body('memoryUsage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Memory usage must be 0-100'),
    body('processCount')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Process count must be non-negative'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  validateRequest,
  agentController.heartbeat
);

export default router;
