import express from 'express';
import { body, query } from 'express-validator';
import * as telemetryController from '../controllers/telemetryController';
import { authenticate } from '../middleware/authenticate';
import { authenticateAgent } from '../middleware/authenticateAgent';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// ============================================================
// AGENT-AUTHENTICATED ENDPOINTS (Telemetry Ingestion)
// ============================================================

/**
 * POST /api/v1/telemetry
 * Ingest single telemetry event
 */
router.post(
  '/',
  authenticateAgent,
  [
    body('eventType')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Event type must be 1-100 characters'),
    body('timestamp')
      .optional()
      .isISO8601()
      .withMessage('Timestamp must be ISO8601 format'),
    body('data')
      .isObject()
      .withMessage('Data must be an object'),
    body('serviceId')
      .optional()
      .isUUID()
      .withMessage('Service ID must be UUID'),
  ],
  validateRequest,
  telemetryController.ingest
);

/**
 * POST /api/v1/telemetry/batch
 * Ingest multiple telemetry events
 */
router.post(
  '/batch',
  authenticateAgent,
  [
    body('events')
      .isArray({ min: 1, max: 1000 })
      .withMessage('Events must be array of 1-1000 items'),
    body('events.*.eventType')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Each event must have eventType'),
    body('events.*.data')
      .isObject()
      .withMessage('Each event must have data object'),
  ],
  validateRequest,
  telemetryController.batchIngest
);

/**
 * POST /api/v1/telemetry/detections
 * Record detection result from agent
 */
router.post(
  '/detections',
  authenticateAgent,
  [
    body('detectionType')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Detection type required'),
    body('severity')
      .isIn(['critical', 'high', 'medium', 'low', 'info'])
      .withMessage('Invalid severity'),
    body('confidence')
      .isFloat({ min: 0, max: 1 })
      .withMessage('Confidence must be 0-1'),
    body('message')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Message required'),
    body('suggestedAction')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Suggested action max 100 chars'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be object'),
    body('serviceId')
      .optional()
      .isUUID()
      .withMessage('Service ID must be UUID'),
    body('detectedAt')
      .optional()
      .isISO8601()
      .withMessage('Detected at must be ISO8601'),
  ],
  validateRequest,
  telemetryController.recordDetection
);

// ============================================================
// ADMIN-AUTHENTICATED ENDPOINTS (Query & Analytics)
// ============================================================

/**
 * GET /api/v1/telemetry
 * Query telemetry events
 */
router.get(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN', 'OPERATOR'),
  [
    query('organizationId')
      .isUUID()
      .withMessage('Organization ID required'),
    query('agentId')
      .optional()
      .isUUID()
      .withMessage('Invalid agent ID'),
    query('serviceId')
      .optional()
      .isUUID()
      .withMessage('Invalid service ID'),
    query('eventType')
      .optional()
      .isString()
      .withMessage('Invalid event type'),
    query('startTime')
      .optional()
      .isISO8601()
      .withMessage('Start time must be ISO8601'),
    query('endTime')
      .optional()
      .isISO8601()
      .withMessage('End time must be ISO8601'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Limit must be 1-10000'),
  ],
  validateRequest,
  telemetryController.query
);

/**
 * GET /api/v1/telemetry/detections
 * Get unprocessed detections
 */
router.get(
  '/detections',
  authenticate,
  authorize('OWNER', 'ADMIN', 'OPERATOR'),
  [
    query('organizationId')
      .isUUID()
      .withMessage('Organization ID required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be 1-1000'),
  ],
  validateRequest,
  telemetryController.getDetections
);

/**
 * GET /api/v1/telemetry/stats
 * Get telemetry and detection statistics
 */
router.get(
  '/stats',
  authenticate,
  authorize('OWNER', 'ADMIN', 'OPERATOR'),
  [
    query('organizationId')
      .isUUID()
      .withMessage('Organization ID required'),
    query('hours')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('Hours must be 1-168 (7 days)'),
  ],
  validateRequest,
  telemetryController.getStats
);

export default router;
