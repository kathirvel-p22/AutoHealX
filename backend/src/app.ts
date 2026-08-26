import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { serverConfig } from './config/server';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import authRoutes from './routes/auth';
import incidentRoutes from './routes/incidents';
import projectRoutes from './routes/projects';
import serviceRoutes from './routes/services';
import healthRoutes from './routes/health';
import agentRoutes from './routes/agents';
import telemetryRoutes from './routes/telemetry';
import logger from './logging/logger';

const app = express();

// Trust proxy (for rate limiting and IP detection behind load balancers)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({ 
  origin: serverConfig.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: serverConfig.security.rateLimitWindowMs,
  max: serverConfig.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request ID and logging
app.use(requestId);
if (serverConfig.features.requestLogging) {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// API routes
app.use('/health', healthRoutes);
app.use('/ready', healthRoutes);
app.use(`/api/${serverConfig.apiVersion}/auth`, authRoutes);
app.use(`/api/${serverConfig.apiVersion}/incidents`, incidentRoutes);
app.use(`/api/${serverConfig.apiVersion}/projects`, projectRoutes);
app.use(`/api/${serverConfig.apiVersion}/services`, serviceRoutes);
app.use(`/api/${serverConfig.apiVersion}/agents`, agentRoutes);
app.use(`/api/${serverConfig.apiVersion}/telemetry`, telemetryRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'AutoHealX Backend',
    version: serverConfig.apiVersion,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.path
    }
  });
});

// Error handling (must be last)
app.use(errorHandler);

export default app;
