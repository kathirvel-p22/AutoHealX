import dotenv from 'dotenv';

dotenv.config();

export const serverConfig = {
  port: parseInt(process.env.PORT || '4000'),
  env: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    expiry: process.env.JWT_EXPIRY || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-in-production',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  },
  
  features: {
    auditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true',
    requestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true'
  }
};

export function validateConfig(): void {
  if (serverConfig.env === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be set and at least 32 characters in production');
    }
    if (!process.env.DB_PASSWORD) {
      throw new Error('DB_PASSWORD must be set in production');
    }
  }
}
