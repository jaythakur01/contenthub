import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;

      const result = await authService.register(name, email, password);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google OAuth callback
   */
  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      // Google profile is attached by Passport middleware
      const googleProfile = req.user as any;

      if (!googleProfile) {
        throw new AppError('Google authentication failed', 401, 'GOOGLE_AUTH_FAILED');
      }

      const result = await authService.googleAuth(googleProfile);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.logout(refreshToken);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;

      const result = await authService.resetPassword(token, newPassword);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
