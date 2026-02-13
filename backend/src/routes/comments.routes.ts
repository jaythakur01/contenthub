import { Router } from 'express';
import commentsController from '../controllers/comments.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createCommentSchema, updateCommentSchema } from '../models/validation';

const router = Router();

// Get comments for article
router.get('/articles/:articleId/comments', commentsController.getArticleComments);

// Create comment (auth required)
router.post(
  '/articles/:articleId/comments',
  authenticateToken,
  validate(createCommentSchema, 'body'),
  commentsController.createComment
);

// Update comment (auth required, own comment)
router.put(
  '/:id',
  authenticateToken,
  validate(updateCommentSchema, 'body'),
  commentsController.updateComment
);

// Delete comment (auth required, own comment or admin)
router.delete('/:id', authenticateToken, commentsController.deleteComment);

// Flag comment (auth required)
router.post('/:id/flag', authenticateToken, commentsController.flagComment);

export default router;
