import { Request, Response, NextFunction } from 'express';
import usersService from '../services/users.service';

export class UsersController {
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.getCurrentUser(req.user!.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.updateUser(req.user!.userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { current_password, new_password } = req.body;
      const result = await usersService.changePassword(req.user!.userId, current_password, new_password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.deleteAccount(req.user!.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();
