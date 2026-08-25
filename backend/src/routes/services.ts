import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { enforceTenantIsolation, injectOrganizationId } from '../middleware/tenantIsolation';
import { validateRequest } from '../middleware/validateRequest';
import { createServiceValidation, updateServiceValidation } from '../validators/serviceValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(injectOrganizationId);

// GET /api/v1/services - List services
router.get(
  '/',
  authorize('view_services'),
  ServiceController.list
);

// GET /api/v1/services/:id - Get service details
router.get(
  '/:id',
  authorize('view_services'),
  ServiceController.getById
);

// GET /api/v1/services/:id/health - Get service health
router.get(
  '/:id/health',
  authorize('view_services'),
  ServiceController.getHealth
);

// POST /api/v1/services - Create service
router.post(
  '/',
  authorize('manage_services'),
  enforceTenantIsolation,
  validateRequest(createServiceValidation),
  ServiceController.create
);

// PUT /api/v1/services/:id - Update service
router.put(
  '/:id',
  authorize('manage_services'),
  validateRequest(updateServiceValidation),
  ServiceController.update
);

// DELETE /api/v1/services/:id - Delete service
router.delete(
  '/:id',
  authorize('manage_services'),
  ServiceController.delete
);

export default router;
