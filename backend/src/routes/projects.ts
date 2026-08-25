import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { enforceTenantIsolation, injectOrganizationId } from '../middleware/tenantIsolation';
import { validateRequest } from '../middleware/validateRequest';
import { createProjectValidation, updateProjectValidation } from '../validators/projectValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(injectOrganizationId);

// GET /api/v1/projects - List projects
router.get(
  '/',
  authorize('view_incidents'),
  ProjectController.list
);

// GET /api/v1/projects/:id - Get project details
router.get(
  '/:id',
  authorize('view_incidents'),
  ProjectController.getById
);

// POST /api/v1/projects - Create project
router.post(
  '/',
  authorize('manage_projects'),
  enforceTenantIsolation,
  validateRequest(createProjectValidation),
  ProjectController.create
);

// PUT /api/v1/projects/:id - Update project
router.put(
  '/:id',
  authorize('manage_projects'),
  validateRequest(updateProjectValidation),
  ProjectController.update
);

// DELETE /api/v1/projects/:id - Delete project
router.delete(
  '/:id',
  authorize('manage_projects'),
  ProjectController.delete
);

export default router;
