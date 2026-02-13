import { Request, Response, NextFunction } from 'express';
import articlesService from '../services/articles.service';

export class ArticlesController {
  /**
   * List articles
   */
  async listArticles(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        category: req.query.category as string,
        tag: req.query.tag as string,
        status: req.query.status as string,
        search: req.query.search as string,
        sort: req.query.sort as string,
        order: req.query.order as string,
        userId: req.user?.userId
      };

      const result = await articlesService.listArticles(filters);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get article by slug
   */
  async getArticleBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const userId = req.user?.userId;

      const article = await articlesService.getArticleBySlug(slug, userId);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create article
   */
  async createArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const authorId = req.user!.userId;

      const article = await articlesService.createArticle(req.body, authorId);

      res.status(201).json({ article });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update article
   */
  async updateArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const article = await articlesService.updateArticle(id, req.body, userId);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete article
   */
  async deleteArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const result = await articlesService.deleteArticle(id, userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get article revisions
   */
  async getArticleRevisions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await articlesService.getArticleRevisions(id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ArticlesController();
