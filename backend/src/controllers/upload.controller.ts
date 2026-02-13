import { Request, Response, NextFunction } from 'express';
import storageService from '../services/storage.service';

export class UploadController {
  /**
   * Upload image
   */
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            message: 'No file provided',
            code: 'NO_FILE'
          }
        });
      }

      const userId = req.user!.userId;
      const url = await storageService.uploadImage(req.file, userId);

      res.status(200).json({ url });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
