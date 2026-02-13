import { Router } from 'express';
import categoriesController from '../controllers/categories.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createCategorySchema, updateCategorySchema, deleteCategorySchema, reorderCategoriesSchema } from '../models/validation';

const router = Router();

/**
 * GET /api/categories
 * List all categories
 */
router.get('/', categoriesController.listCategories);

/**
 * GET /api/categories/:slug
 * Get category by slug
 */
router.get('/:slug', categoriesController.getCategoryBySlug);

/**
 * POST /api/categories
 * Create category (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  validate(createCategorySchema, 'body'),
  categoriesController.createCategory
);

/**
 * PUT /api/categories/:id
 * Update category (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  validate(updateCategorySchema, 'body'),
  categoriesController.updateCategory
);

/**
 * DELETE /api/categories/:id
 * Delete category (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  validate(deleteCategorySchema, 'query'),
  categoriesController.deleteCategory
);

/**
 * PUT /api/categories/reorder
 * Reorder categories for drag-and-drop (admin only)
 */
router.put(
  '/reorder',
  authenticateToken,
  requireRole(['admin']),
  validate(reorderCategoriesSchema, 'body'),
  categoriesController.reorderCategories
);

export default router;
