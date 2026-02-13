import { Request, Response, NextFunction } from 'express';
import commentsService from '../services/comments.service';

export class CommentsController {
  async getArticleComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { articleId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const result = await commentsService.getArticleComments(articleId, limit, offset);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { articleId } = req.params;
      const result = await commentsService.createComment(
        { ...req.body, article_id: articleId },
        req.user!.userId
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const result = await commentsService.updateComment(id, req.user!.userId, content);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const isAdmin = req.user!.role === 'admin';
      const result = await commentsService.deleteComment(id, req.user!.userId, isAdmin);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async flagComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await commentsService.flagComment(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentsController();
