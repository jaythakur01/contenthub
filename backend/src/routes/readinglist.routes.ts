import { Router } from 'express';
import bookmarksController from '../controllers/bookmarks.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createReadingListSchema } from '../models/validation';

const router = Router();

// Reading list routes
router.get('/', authenticateToken, bookmarksController.getUserReadingList);
router.post('/', authenticateToken, validate(createReadingListSchema, 'body'), bookmarksController.addToReadingList);
router.delete('/:articleId', authenticateToken, bookmarksController.removeFromReadingList);

export default router;
