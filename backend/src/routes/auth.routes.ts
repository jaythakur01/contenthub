import { Router } from 'express';
import passport from 'passport';
import authController from '../controllers/auth.controller';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from '../models/validation';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validate(registerSchema, 'body'), authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', validate(loginSchema, 'body'), authController.login);

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleAuth
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', validate(refreshTokenSchema, 'body'), authController.refreshToken);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', validate(refreshTokenSchema, 'body'), authController.logout);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', validate(forgotPasswordSchema, 'body'), authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', validate(resetPasswordSchema, 'body'), authController.resetPassword);

export default router;
