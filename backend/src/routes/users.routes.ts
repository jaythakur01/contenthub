import { Router } from 'express';
import usersController from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { updateUserSchema, changePasswordSchema } from '../models/validation';

const router = Router();

/**
 * GET /api/users/me
 * Get current user profile (auth required)
 */
router.get('/me', authenticateToken, usersController.getCurrentUser);

/**
 * PUT /api/users/me
 * Update current user profile (auth required)
 */
router.put('/me', authenticateToken, validate(updateUserSchema, 'body'), usersController.updateUser);

/**
 * PUT /api/users/me/password
 * Change password (auth required)
 */
router.put('/me/password', authenticateToken, validate(changePasswordSchema, 'body'), usersController.changePassword);

/**
 * DELETE /api/users/me
 * Delete user account (auth required)
 */
router.delete('/me', authenticateToken, usersController.deleteAccount);

export default router;
