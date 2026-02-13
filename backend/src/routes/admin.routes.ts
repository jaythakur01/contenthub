import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { updateUserRoleSchema, createUserByAdminSchema } from '../models/validation';

const router = Router();

// Get dashboard metrics (admin/author only)
router.get(
  '/dashboard',
  authenticateToken,
  requireRole(['author', 'admin']),
  adminController.getDashboardMetrics
);

// List all users (admin only)
router.get(
  '/users',
  authenticateToken,
  requireRole(['admin']),
  adminController.listUsers
);

// Update user role (admin only)
router.put(
  '/users/:id/role',
  authenticateToken,
  requireRole(['admin']),
  validate(updateUserRoleSchema, 'body'),
  adminController.updateUserRole
);

// Create user (admin only)
router.post(
  '/users',
  authenticateToken,
  requireRole(['admin']),
  validate(createUserByAdminSchema, 'body'),
  adminController.createUser
);

export default router;
