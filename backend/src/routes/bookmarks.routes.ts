import { Router } from 'express';
import bookmarksController from '../controllers/bookmarks.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createBookmarkSchema } from '../models/validation';

const router = Router();

// Bookmark routes
router.get('/', authenticateToken, bookmarksController.getUserBookmarks);
router.post('/', authenticateToken, validate(createBookmarkSchema, 'body'), bookmarksController.addBookmark);
router.delete('/:articleId', authenticateToken, bookmarksController.removeBookmark);

export default router;
