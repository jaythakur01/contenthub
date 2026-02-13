import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';

export class AdminController {
  async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getDashboardMetrics();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        role: req.query.role as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };
      const result = await adminService.listUsers(filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const result = await adminService.updateUserRole(id, role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createUser(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
