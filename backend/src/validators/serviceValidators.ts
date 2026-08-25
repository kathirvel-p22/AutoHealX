import { body } from 'express-validator';

export const createServiceValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Service name must be between 2 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  
  body('project_id')
    .optional()
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
  
  body('environment')
    .optional()
    .isIn(['development', 'staging', 'production'])
    .withMessage('Environment must be one of: development, staging, production'),
  
  body('version')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Version must not exceed 50 characters'),
  
  body('status')
    .optional()
    .isIn(['healthy', 'degraded', 'unhealthy', 'unknown'])
    .withMessage('Status must be one of: healthy, degraded, unhealthy, unknown')
];

export const updateServiceValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Service name must be between 2 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  
  body('project_id')
    .optional()
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
  
  body('environment')
    .optional()
    .isIn(['development', 'staging', 'production'])
    .withMessage('Environment must be one of: development, staging, production'),
  
  body('version')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Version must not exceed 50 characters'),
  
  body('status')
    .optional()
    .isIn(['healthy', 'degraded', 'unhealthy', 'unknown'])
    .withMessage('Status must be one of: healthy, degraded, unhealthy, unknown')
];
