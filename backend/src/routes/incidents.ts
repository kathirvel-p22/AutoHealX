import { Router } from 'express';
import { IncidentController } from '../controllers/incidentController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { enforceTenantIsolation, injectOrganizationId } from '../middleware/tenantIsolation';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(injectOrganizationId);

// GET /api/v1/incidents - List incidents
router.get(
  '/',
  authorize('view_incidents'),
  IncidentController.list
);

// GET /api/v1/incidents/:id - Get incident details
router.get(
  '/:id',
  authorize('view_incidents'),
  IncidentController.getById
);

// POST /api/v1/incidents - Create incident
router.post(
  '/',
  authorize('manage_services'),
  enforceTenantIsolation,
  IncidentController.create
);

// PUT /api/v1/incidents/:id/status - Update incident status
router.put(
  '/:id/status',
  authorize('investigate_incidents'),
  IncidentController.updateStatus
);

// POST /api/v1/incidents/:id/events - Add event to incident
router.post(
  '/:id/events',
  authorize('investigate_incidents'),
  IncidentController.addEvent
);

// GET /api/v1/incidents/:id/events - Get incident events
router.get(
  '/:id/events',
  authorize('view_incidents'),
  IncidentController.getEvents
);

export default router;
