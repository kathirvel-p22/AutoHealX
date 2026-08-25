import winston from 'winston';
import { serverConfig } from '../config/server';
import * as path from 'path';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: serverConfig.logging.level,
  format: logFormat,
  defaultMeta: { service: 'autohealx-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0 && meta.service !== 'autohealx-backend') {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      )
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(serverConfig.logging.filePath, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(serverConfig.logging.filePath, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Add production-specific transports
if (serverConfig.env === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(serverConfig.logging.filePath, 'audit.log'),
    level: 'info',
    maxsize: 10485760,
    maxFiles: 10
  }));
}

export default logger;
