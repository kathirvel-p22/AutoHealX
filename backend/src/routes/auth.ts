import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { 
  registerValidation, 
  loginValidation, 
  refreshTokenValidation,
  changePasswordValidation 
} from '../validators/authValidators';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  validateRequest(registerValidation),
  AuthController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  validateRequest(loginValidation),
  AuthController.login
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validateRequest(refreshTokenValidation),
  AuthController.refresh
);

// POST /api/v1/auth/logout (protected)
router.post(
  '/logout',
  authenticate,
  AuthController.logout
);

// GET /api/v1/auth/me (protected)
router.get(
  '/me',
  authenticate,
  AuthController.getCurrentUser
);

// POST /api/v1/auth/change-password (protected)
router.post(
  '/change-password',
  authenticate,
  validateRequest(changePasswordValidation),
  AuthController.changePassword
);

export default router;
