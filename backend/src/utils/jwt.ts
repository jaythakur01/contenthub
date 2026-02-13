import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { JWTPayload } from '../models/types';

/**
 * Generate a JWT access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn
  });
}

/**
 * Verify a JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, authConfig.jwtSecret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate a refresh token (random string)
 */
export function generateRefreshToken(): string {
  return Array.from({ length: 64 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
}

/**
 * Calculate refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
  const days = parseInt(authConfig.refreshTokenExpiresIn.replace('d', ''));
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
