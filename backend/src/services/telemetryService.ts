import TelemetryEvent from '../models/TelemetryEvent';
import DetectionResult from '../models/DetectionResult';
import Agent from '../models/Agent';
import { AppError } from '../errors/AppError';
import logger from '../logging/logger';
import { Op } from 'sequelize';

// Interface for telemetry ingestion
export interface TelemetryData {
  agentId: string;
  organizationId: string;
  serviceId?: string;
  eventType: string;
  timestamp: Date;
  data: Record<string, any>;
}

// Interface for detection data
export interface DetectionData {
  agentId: string;
  organizationId: string;
  serviceId?: string;
  detectionType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  message: string;
  suggestedAction?: string;
  metadata?: Record<string, any>;
  detectedAt: Date;
}

/**
 * Ingest telemetry event from agent
 */
export async function ingestTelemetry(data: TelemetryData): Promise<TelemetryEvent> {
  // Validate agent exists and is active
  const agent = await Agent.findByPk(data.agentId);
  
  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  if (agent.status !== 'active') {
    throw new AppError('Agent is not active', 403);
  }

  // Verify organization match (tenant isolation)
  if (agent.organization_id !== data.organizationId) {
    throw new AppError('Organization mismatch', 403);
  }

  // Create telemetry event
  const event = await TelemetryEvent.create({
    organization_id: data.organizationId,
    agent_id: data.agentId,
    event_type: data.eventType,
    timestamp: data.timestamp,
    metadata: {
      serviceId: data.serviceId,
      ...data.data
    },
  });

  logger.debug(`Telemetry ingested: ${data.eventType} from agent ${data.agentId}`);

  return event;
}

/**
 * Batch ingest telemetry events (more efficient)
 */
export async function batchIngestTelemetry(events: TelemetryData[]): Promise<number> {
  if (events.length === 0) {
    return 0;
  }

  // Validate all events belong to same agent
  const agentId = events[0].agentId;
  const organizationId = events[0].organizationId;

  if (!events.every(e => e.agentId === agentId && e.organizationId === organizationId)) {
    throw new AppError('All events must belong to same agent and organization', 400);
  }

  // Validate agent
  const agent = await Agent.findByPk(agentId);
  
  if (!agent || agent.status !== 'active' || agent.organization_id !== organizationId) {
    throw new AppError('Invalid agent', 403);
  }

  // Bulk create
  await TelemetryEvent.bulkCreate(
    events.map(e => ({
      organization_id: e.organizationId,
      agent_id: e.agentId,
      event_type: e.eventType,
      timestamp: e.timestamp,
      metadata: {
        serviceId: e.serviceId,
        ...e.data
      },
    }))
  );

  logger.info(`Batch telemetry ingested: ${events.length} events from agent ${agentId}`);

  return events.length;
}

/**
 * Query telemetry events with filters
 */
export async function queryTelemetry(filters: {
  organizationId: string;
  agentId?: string;
  serviceId?: string;
  eventType?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}): Promise<TelemetryEvent[]> {
  const where: any = {
    organization_id: filters.organizationId,
  };

  if (filters.agentId) {
    where.agent_id = filters.agentId;
  }

  if (filters.eventType) {
    where.event_type = filters.eventType;
  }

  if (filters.startTime || filters.endTime) {
    where.timestamp = {};
    if (filters.startTime) {
      where.timestamp[Op.gte] = filters.startTime;
    }
    if (filters.endTime) {
      where.timestamp[Op.lte] = filters.endTime;
    }
  }

  return TelemetryEvent.findAll({
    where,
    order: [['timestamp', 'DESC']],
    limit: filters.limit || 1000,
  });
}

/**
 * Record detection result from agent
 */
export async function recordDetection(data: DetectionData): Promise<DetectionResult> {
  // Validate agent exists and is active
  const agent = await Agent.findByPk(data.agentId);
  
  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  if (agent.status !== 'active') {
    throw new AppError('Agent is not active', 403);
  }

  // Verify organization match
  if (agent.organization_id !== data.organizationId) {
    throw new AppError('Organization mismatch', 403);
  }

  // Validate confidence score
  if (data.confidence < 0 || data.confidence > 1) {
    throw new AppError('Confidence must be between 0 and 1', 400);
  }

  // Create detection result
  const detection = await DetectionResult.create({
    organization_id: data.organizationId,
    agent_id: data.agentId,
    incident_id: undefined,
    detection_type: data.detectionType,
    severity: data.severity,
    confidence: data.confidence,
    message: data.message,
    suggested_action: data.suggestedAction,
    metadata: {
      serviceId: data.serviceId,
      ...(data.metadata || {})
    },
    detected_at: data.detectedAt,
  });

  logger.info(`Detection recorded: ${data.detectionType} (${data.severity}) from agent ${data.agentId}`);

  // TODO: Trigger detection processing pipeline (Phase 3)
  // This will create incidents from detections

  return detection;
}

/**
 * Get unprocessed detections for incident creation
 */
export async function getUnprocessedDetections(organizationId: string, limit: number = 100): Promise<DetectionResult[]> {
  const allDetections = await DetectionResult.findAll({
    where: {
      organization_id: organizationId,
    },
    order: [['detected_at', 'ASC']],
  });

  // Filter for unprocessed (no incident_id) in memory
  return allDetections.filter(d => !d.incident_id).slice(0, limit);
}

/**
 * Mark detection as processed
 */
export async function markDetectionProcessed(detectionId: string, incidentId?: string): Promise<void> {
  await DetectionResult.update(
    {
      incident_id: incidentId,
    },
    {
      where: { id: detectionId },
    }
  );

  logger.debug(`Detection ${detectionId} marked as processed (incident: ${incidentId})`);
}

/**
 * Get detection statistics for organization
 */
export async function getDetectionStats(organizationId: string, hours: number = 24): Promise<{
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  processed: number;
  unprocessed: number;
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const detections = await DetectionResult.findAll({
    where: {
      organization_id: organizationId,
      detected_at: {
        [Op.gte]: since,
      },
    },
    attributes: ['severity', 'detection_type', 'incident_id'],
  });

  const stats = {
    total: detections.length,
    bySeverity: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    processed: 0,
    unprocessed: 0,
  };

  for (const detection of detections) {
    // Count by severity
    stats.bySeverity[detection.severity] = (stats.bySeverity[detection.severity] || 0) + 1;

    // Count by type
    stats.byType[detection.detection_type] = (stats.byType[detection.detection_type] || 0) + 1;

    // Count processed/unprocessed
    if (detection.incident_id) {
      stats.processed++;
    } else {
      stats.unprocessed++;
    }
  }

  return stats;
}

/**
 * Get telemetry statistics
 */
export async function getTelemetryStats(organizationId: string, hours: number = 24): Promise<{
  total: number;
  byEventType: Record<string, number>;
  byAgent: Record<string, number>;
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const events = await TelemetryEvent.findAll({
    where: {
      organization_id: organizationId,
      timestamp: {
        [Op.gte]: since,
      },
    },
    attributes: ['event_type', 'agent_id'],
  });

  const stats = {
    total: events.length,
    byEventType: {} as Record<string, number>,
    byAgent: {} as Record<string, number>,
  };

  for (const event of events) {
    stats.byEventType[event.event_type] = (stats.byEventType[event.event_type] || 0) + 1;
    stats.byAgent[event.agent_id] = (stats.byAgent[event.agent_id] || 0) + 1;
  }

  return stats;
}

export default {
  ingestTelemetry,
  batchIngestTelemetry,
  queryTelemetry,
  recordDetection,
  getUnprocessedDetections,
  markDetectionProcessed,
  getDetectionStats,
  getTelemetryStats,
};
