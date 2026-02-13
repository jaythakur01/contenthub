import { Request, Response, NextFunction } from 'express';
import bookmarksService from '../services/bookmarks.service';

export class BookmarksController {
  async getUserBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const result = await bookmarksService.getUserBookmarks(req.user!.userId, limit, offset);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async addBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const { article_id } = req.body;
      const result = await bookmarksService.addBookmark(req.user!.userId, article_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async removeBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const { articleId } = req.params;
      const result = await bookmarksService.removeBookmark(req.user!.userId, articleId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserReadingList(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const result = await bookmarksService.getUserReadingList(req.user!.userId, limit, offset);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async addToReadingList(req: Request, res: Response, next: NextFunction) {
    try {
      const { article_id } = req.body;
      const result = await bookmarksService.addToReadingList(req.user!.userId, article_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async removeFromReadingList(req: Request, res: Response, next: NextFunction) {
    try {
      const { articleId } = req.params;
      const result = await bookmarksService.removeFromReadingList(req.user!.userId, articleId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new BookmarksController();
