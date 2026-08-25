import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { Service, Project, Incident } from '../models';
import { AppError } from '../errors/AppError';

export class ServiceController {
  /**
   * GET /api/v1/services
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = res.locals.organizationId;
      const { status, environment, project_id, limit = '50', offset = '0' } = req.query;

      const where: any = { organization_id: organizationId };
      if (status) where.status = status;
      if (environment) where.environment = environment;
      if (project_id) where.project_id = project_id;

      const services = await Service.findAndCountAll({
        where,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['created_at', 'DESC']],
        include: [
          { 
            model: Project, 
            as: 'project',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          services: services.rows,
          pagination: {
            total: services.count,
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
   * GET /api/v1/services/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;

      const service = await Service.findOne({
        where: { 
          id,
          organization_id: organizationId 
        },
        include: [
          { 
            model: Project, 
            as: 'project'
          },
          { 
            model: Incident, 
            as: 'incidents',
            limit: 10,
            order: [['detected_at', 'DESC']],
            attributes: ['id', 'incident_number', 'title', 'severity', 'status', 'detected_at']
          }
        ]
      });

      if (!service) {
        throw new AppError('Service not found', 404);
      }

      res.status(200).json({
        success: true,
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/services
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = res.locals.organizationId;
      const { project_id, name, description, environment, version, status } = req.body;

      // Verify project exists and belongs to organization (if provided)
      if (project_id) {
        const project = await Project.findOne({
          where: { 
            id: project_id,
            organization_id: organizationId 
          }
        });
        
        if (!project) {
          throw new AppError('Project not found', 404);
        }
      }

      const service = await Service.create({
        organization_id: organizationId,
        project_id: project_id || null,
        name,
        description,
        environment: environment || 'development',
        version,
        status: status || 'unknown'
      });

      res.status(201).json({
        success: true,
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/services/:id
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;
      const { project_id, name, description, environment, version, status } = req.body;

      const service = await Service.findOne({
        where: { 
          id,
          organization_id: organizationId 
        }
      });

      if (!service) {
        throw new AppError('Service not found', 404);
      }

      // Verify project exists and belongs to organization (if changing project)
      if (project_id && project_id !== service.project_id) {
        const project = await Project.findOne({
          where: { 
            id: project_id,
            organization_id: organizationId 
          }
        });
        
        if (!project) {
          throw new AppError('Project not found', 404);
        }
      }

      await service.update({
        project_id: project_id !== undefined ? project_id : service.project_id,
        name: name || service.name,
        description: description !== undefined ? description : service.description,
        environment: environment || service.environment,
        version: version !== undefined ? version : service.version,
        status: status || service.status
      });

      res.status(200).json({
        success: true,
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/services/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;

      const service = await Service.findOne({
        where: { 
          id,
          organization_id: organizationId 
        }
      });

      if (!service) {
        throw new AppError('Service not found', 404);
      }

      await service.destroy();

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/services/:id/health
   */
  static async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;

      const service = await Service.findOne({
        where: { 
          id,
          organization_id: organizationId 
        },
        include: [
          { 
            model: Incident, 
            as: 'incidents',
            where: { status: ['detected', 'investigating', 'identified', 'remediation_pending', 'remediating'] },
            required: false,
            attributes: ['id', 'severity', 'status']
          }
        ]
      });

      if (!service) {
        throw new AppError('Service not found', 404);
      }

      const incidents = service.incidents || [];
      const criticalCount = incidents.filter(i => i.severity === 'critical').length;
      const highCount = incidents.filter(i => i.severity === 'high').length;

      res.status(200).json({
        success: true,
        data: {
          service_id: service.id,
          name: service.name,
          status: service.status,
          environment: service.environment,
          open_incidents: incidents.length,
          critical_incidents: criticalCount,
          high_incidents: highCount,
          last_updated: service.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
