import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { Incident, IncidentEvent, Service, Project } from '../models';
import { AppError } from '../errors/AppError';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  detected: ['investigating', 'closed'],
  investigating: ['identified', 'closed'],
  identified: ['remediation_pending', 'closed'],
  remediation_pending: ['remediating', 'closed'],
  remediating: ['resolved', 'closed'],
  resolved: ['closed', 'detected'], // Can reopen
  closed: ['detected'] // Can reopen
};

export class IncidentController {
  /**
   * GET /api/v1/incidents
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = res.locals.organizationId;
      const { status, severity, service_id, limit = '50', offset = '0' } = req.query;

      const where: any = { organization_id: organizationId };
      
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (service_id) where.service_id = service_id;

      const incidents = await Incident.findAndCountAll({
        where,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['detected_at', 'DESC']],
        include: [
          { model: Service, as: 'service', attributes: ['id', 'name', 'environment'] },
          { model: Project, as: 'project', attributes: ['id', 'name'] }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          incidents: incidents.rows,
          pagination: {
            total: incidents.count,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/incidents/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;

      const incident = await Incident.findOne({
        where: { 
          id,
          organization_id: organizationId 
        },
        include: [
          { model: Service, as: 'service' },
          { model: Project, as: 'project' }
        ]
      });

      if (!incident) {
        throw new AppError('Incident not found', 404);
      }

      res.status(200).json({
        success: true,
        data: { incident }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/incidents
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = res.locals.organizationId;
      const { service_id, project_id, title, description, severity } = req.body;

      // Generate incident number
      const incidentNumber = await sequelize.query(
        'SELECT generate_incident_number() as number',
        { type: 'SELECT' }
      ) as any[];
      
      const incident = await Incident.create({
        organization_id: organizationId,
        service_id,
        project_id,
        incident_number: incidentNumber[0].number,
        title,
        description,
        severity,
        status: 'detected',
        detected_at: new Date()
      });

      // Create initial event
      await IncidentEvent.create({
        incident_id: incident.id,
        event_type: 'detected',
        description: 'Incident detected',
        metadata: { severity, service_id }
      });

      res.status(201).json({
        success: true,
        data: { incident }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/incidents/:id/status
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, root_cause, confidence } = req.body;
      const organizationId = res.locals.organizationId;
      const authReq = req as AuthenticatedRequest;

      const incident = await Incident.findOne({
        where: { 
          id,
          organization_id: organizationId 
        }
      });

      if (!incident) {
        throw new AppError('Incident not found', 404);
      }

      // Validate status transition
      const validTransitions = VALID_STATUS_TRANSITIONS[incident.status];
      if (!validTransitions || !validTransitions.includes(status)) {
        throw new AppError(
          `Invalid status transition from ${incident.status} to ${status}`,
          400
        );
      }

      // Update incident
      const updates: any = { status };
      if (status === 'investigating' && !incident.acknowledged_at) {
        updates.acknowledged_at = new Date();
      }
      if (status === 'resolved') {
        updates.resolved_at = new Date();
      }
      if (root_cause) updates.root_cause = root_cause;
      if (confidence !== undefined) updates.confidence = confidence;

      await incident.update(updates);

      // Create status change event
      await IncidentEvent.create({
        incident_id: incident.id,
        event_type: 'status_changed',
        description: `Status changed from ${incident.status} to ${status}`,
        actor_id: authReq.user.userId,
        metadata: { from: incident.status, to: status }
      });

      res.status(200).json({
        success: true,
        data: { incident }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/incidents/:id/events
   */
  static async addEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { event_type, description, metadata } = req.body;
      const organizationId = res.locals.organizationId;
      const authReq = req as AuthenticatedRequest;

      // Verify incident exists and belongs to organization
      const incident = await Incident.findOne({
        where: { 
          id,
          organization_id: organizationId 
        }
      });

      if (!incident) {
        throw new AppError('Incident not found', 404);
      }

      const event = await IncidentEvent.create({
        incident_id: id,
        event_type,
        description,
        actor_id: authReq.user.userId,
        metadata
      });

      res.status(201).json({
        success: true,
        data: { event }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/incidents/:id/events
   */
  static async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;

      // Verify incident exists and belongs to organization
      const incident = await Incident.findOne({
        where: { 
          id,
          organization_id: organizationId 
        }
      });

      if (!incident) {
        throw new AppError('Incident not found', 404);
      }

      const events = await IncidentEvent.findAll({
        where: { incident_id: id },
        order: [['created_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: { events }
      });
    } catch (error) {
      next(error);
    }
  }
}
