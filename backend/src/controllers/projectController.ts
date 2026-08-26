import { Request, Response, NextFunction } from 'express';
import { Project, Service } from '../models';
import { AppError } from '../errors/AppError';

export class ProjectController {
  /**
   * GET /api/v1/projects
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = res.locals.organizationId;
      const { status, limit = '50', offset = '0' } = req.query;

      const where: any = { organization_id: organizationId };
      if (status) where.status = status;

      const projects = await Project.findAndCountAll({
        where,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['created_at', 'DESC']],
        include: [
          { 
            model: Service, 
            as: 'services',
            attributes: ['id', 'name', 'status', 'environment']
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          projects: projects.rows,
          pagination: {
            total: projects.count,
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
   * GET /api/v1/projects/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;

      const project = await Project.findOne({
        where: { 
          id,
          organization_id: organizationId 
        },
        include: [
          { 
            model: Service, 
            as: 'services'
          }
        ]
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      res.status(200).json({
        success: true,
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/projects
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = res.locals.organizationId;
      const { name, description, status } = req.body;

      const project = await Project.create({
        organization_id: organizationId,
        name,
        description,
        status: status || 'active'
      });

      res.status(201).json({
        success: true,
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/projects/:id
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;
      const { name, description, status } = req.body;

      const project = await Project.findOne({
        where: { 
          id,
          organization_id: organizationId 
        }
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      await project.update({
        name: name || project.name,
        description: description !== undefined ? description : project.description,
        status: status || project.status
      });

      res.status(200).json({
        success: true,
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/projects/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = res.locals.organizationId;

      const project = await Project.findOne({
        where: { 
          id,
          organization_id: organizationId 
        }
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      await project.destroy();

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
