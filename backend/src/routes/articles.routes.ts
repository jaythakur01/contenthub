import { Router } from 'express';
import articlesController from '../controllers/articles.controller';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createArticleSchema, updateArticleSchema, articleQuerySchema } from '../models/validation';

const router = Router();

/**
 * GET /api/articles
 * List articles with filters
 */
router.get('/', optionalAuth, validate(articleQuerySchema, 'query'), articlesController.listArticles);

/**
 * GET /api/articles/:slug
 * Get article by slug
 */
router.get('/:slug', optionalAuth, articlesController.getArticleBySlug);

/**
 * POST /api/articles
 * Create new article (auth required, author/admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['author', 'admin']),
  validate(createArticleSchema, 'body'),
  articlesController.createArticle
);

/**
 * PUT /api/articles/:id
 * Update article (auth required, author/admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['author', 'admin']),
  validate(updateArticleSchema, 'body'),
  articlesController.updateArticle
);

/**
 * DELETE /api/articles/:id
 * Delete article (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  articlesController.deleteArticle
);

/**
 * GET /api/articles/:id/revisions
 * Get article revisions (auth required, author/admin only)
 */
router.get(
  '/:id/revisions',
  authenticateToken,
  requireRole(['author', 'admin']),
  articlesController.getArticleRevisions
);

export default router;
