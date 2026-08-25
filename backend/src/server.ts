import app from './app';
import { serverConfig, validateConfig } from './config/server';
import { testConnection } from './config/database';
import logger from './logging/logger';
import * as fs from 'fs';
import * as path from 'path';

async function startServer() {
  try {
    // Validate configuration
    logger.info('Validating configuration...');
    validateConfig();
    
    // Ensure logs directory exists
    const logsDir = path.resolve(serverConfig.logging.filePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      logger.info(`Created logs directory: ${logsDir}`);
    }
    
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Start server
    app.listen(serverConfig.port, () => {
      logger.info('='.repeat(50));
      logger.info('🚀 AutoHealX Backend Started Successfully');
      logger.info('='.repeat(50));
      logger.info(`📡 Server running on port: ${serverConfig.port}`);
      logger.info(`📚 API version: ${serverConfig.apiVersion}`);
      logger.info(`🌍 Environment: ${serverConfig.env}`);
      logger.info(`🔐 Security: bcrypt rounds=${serverConfig.security.bcryptRounds}`);
      logger.info(`⏱️  Rate limit: ${serverConfig.security.rateLimitMaxRequests} requests per ${serverConfig.security.rateLimitWindowMs}ms`);
      logger.info(`📝 Logging: level=${serverConfig.logging.level}, path=${serverConfig.logging.filePath}`);
      logger.info(`✅ Health check: http://localhost:${serverConfig.port}/health`);
      logger.info(`✅ Readiness check: http://localhost:${serverConfig.port}/ready`);
      logger.info(`✅ API base: http://localhost:${serverConfig.port}/api/${serverConfig.apiVersion}`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
