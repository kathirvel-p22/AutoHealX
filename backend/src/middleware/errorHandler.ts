import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';
import { serverConfig } from '../config/server';

/**
 * Centralized error handling middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error (never log sensitive data)
  logger.error('Error occurred:', {
    message: error.message,
    stack: serverConfig.env === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle AppError (operational errors)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode
      }
    });
    return;
  }

  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: (error as any).errors?.map((e: any) => ({
          field: e.path,
          message: e.message
        }))
      }
    });
    return;
  }

  // Handle Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      success: false,
      error: {
        message: 'Resource already exists',
        details: (error as any).errors?.map((e: any) => e.message)
      }
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token'
      }
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'Token expired'
      }
    });
    return;
  }

  // Handle unknown errors (programming errors)
  res.status(500).json({
    success: false,
    error: {
      message: serverConfig.env === 'production' 
        ? 'Internal server error' 
        : error.message
    }
  });
}
