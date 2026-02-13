import { Request, Response, NextFunction } from 'express';
import categoriesService from '../services/categories.service';

export class CategoriesController {
  /**
   * List all categories
   */
  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const includeChildren = req.query.include_children !== 'false';

      const result = await categoriesService.listCategories(includeChildren);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const category = await categoriesService.getCategoryBySlug(slug);

      res.status(200).json({ category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create category
   */
  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const category = await categoriesService.createCategory(req.body, userId);

      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category
   */
  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const category = await categoriesService.updateCategory(id, req.body, userId);

      res.status(200).json({ category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { article_action } = req.query;
      const userId = req.user!.userId;

      const result = await categoriesService.deleteCategory(
        id,
        article_action as 'move_to_parent' | 'move_to_uncategorized' | 'delete',
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { updates } = req.body;

      const result = await categoriesService.reorderCategories(updates);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoriesController();
