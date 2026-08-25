import { Request, Response } from 'express';
import * as telemetryService from '../services/telemetryService';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';

/**
 * POST /api/v1/telemetry
 * Ingest single telemetry event (agent-authenticated)
 */
export async function ingest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.agent) {
      throw new AppError('Agent not authenticated', 401);
    }

    const { eventType, timestamp, data, serviceId } = req.body;

    if (!eventType || !data) {
      throw new AppError('eventType and data required', 400);
    }

    // Ingest telemetry
    await telemetryService.ingestTelemetry({
      agentId: req.agent.id,
      organizationId: req.agent.organizationId,
      serviceId,
      eventType,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      data,
    });

    res.status(201).json({
      message: 'Telemetry ingested',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Telemetry ingestion error:', error);
      res.status(500).json({ error: 'Failed to ingest telemetry' });
    }
  }
}

/**
 * POST /api/v1/telemetry/batch
 * Ingest multiple telemetry events (agent-authenticated)
 */
export async function batchIngest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.agent) {
      throw new AppError('Agent not authenticated', 401);
    }

    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      throw new AppError('events array required', 400);
    }

    if (events.length > 1000) {
      throw new AppError('Maximum 1000 events per batch', 400);
    }

    // Prepare events with agent context
    const telemetryEvents = events.map(e => ({
      agentId: req.agent!.id,
      organizationId: req.agent!.organizationId,
      serviceId: e.serviceId,
      eventType: e.eventType,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      data: e.data,
    }));

    // Batch ingest
    const count = await telemetryService.batchIngestTelemetry(telemetryEvents);

    res.status(201).json({
      message: 'Telemetry batch ingested',
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Batch telemetry ingestion error:', error);
      res.status(500).json({ error: 'Failed to ingest telemetry batch' });
    }
  }
}

/**
 * GET /api/v1/telemetry
 * Query telemetry events (admin-authenticated)
 */
export async function query(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId, agentId, serviceId, eventType, startTime, endTime, limit } = req.query;

    if (!organizationId) {
      throw new AppError('organizationId required', 400);
    }

    const events = await telemetryService.queryTelemetry({
      organizationId: organizationId as string,
      agentId: agentId as string,
      serviceId: serviceId as string,
      eventType: eventType as string,
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
      limit: limit ? parseInt(limit as string) : 1000,
    });

    res.json({
      events: events.map(e => ({
        id: e.id,
        agentId: e.agentId,
        serviceId: e.serviceId,
        eventType: e.eventType,
        timestamp: e.timestamp,
        data: e.data,
        createdAt: e.createdAt,
      })),
      total: events.length,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Query telemetry error:', error);
      res.status(500).json({ error: 'Failed to query telemetry' });
    }
  }
}

/**
 * POST /api/v1/telemetry/detections
 * Record detection result (agent-authenticated)
 */
export async function recordDetection(req: Request, res: Response): Promise<void> {
  try {
    if (!req.agent) {
      throw new AppError('Agent not authenticated', 401);
    }

    const { detectionType, severity, confidence, message, suggestedAction, metadata, serviceId, detectedAt } = req.body;

    if (!detectionType || !severity || confidence === undefined || !message) {
      throw new AppError('detectionType, severity, confidence, and message required', 400);
    }

    // Record detection
    const detection = await telemetryService.recordDetection({
      agentId: req.agent.id,
      organizationId: req.agent.organizationId,
      serviceId,
      detectionType,
      severity,
      confidence,
      message,
      suggestedAction,
      metadata,
      detectedAt: detectedAt ? new Date(detectedAt) : new Date(),
    });

    res.status(201).json({
      detection: {
        id: detection.id,
        detectionType: detection.detectionType,
        severity: detection.severity,
        confidence: detection.confidence,
        message: detection.message,
        detectedAt: detection.detectedAt,
      },
      message: 'Detection recorded',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Record detection error:', error);
      res.status(500).json({ error: 'Failed to record detection' });
    }
  }
}

/**
 * GET /api/v1/telemetry/detections
 * Get unprocessed detections (admin-authenticated)
 */
export async function getDetections(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId, limit } = req.query;

    if (!organizationId) {
      throw new AppError('organizationId required', 400);
    }

    const detections = await telemetryService.getUnprocessedDetections(
      organizationId as string,
      limit ? parseInt(limit as string) : 100
    );

    res.json({
      detections: detections.map(d => ({
        id: d.id,
        agentId: d.agentId,
        serviceId: d.serviceId,
        detectionType: d.detectionType,
        severity: d.severity,
        confidence: d.confidence,
        message: d.message,
        suggestedAction: d.suggestedAction,
        detectedAt: d.detectedAt,
        createdAt: d.createdAt,
      })),
      total: detections.length,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Get detections error:', error);
      res.status(500).json({ error: 'Failed to get detections' });
    }
  }
}

/**
 * GET /api/v1/telemetry/stats
 * Get telemetry and detection statistics (admin-authenticated)
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId, hours } = req.query;

    if (!organizationId) {
      throw new AppError('organizationId required', 400);
    }

    const hoursParsed = hours ? parseInt(hours as string) : 24;

    const [telemetryStats, detectionStats] = await Promise.all([
      telemetryService.getTelemetryStats(organizationId as string, hoursParsed),
      telemetryService.getDetectionStats(organizationId as string, hoursParsed),
    ]);

    res.json({
      organizationId,
      hours: hoursParsed,
      telemetry: telemetryStats,
      detections: detectionStats,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }
}

export default {
  ingest,
  batchIngest,
  query,
  recordDetection,
  getDetections,
  getStats,
};

