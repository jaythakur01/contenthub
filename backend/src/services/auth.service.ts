import supabase from '../config/database';
import { hashPassword, comparePassword, generateResetToken } from '../utils/password';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { User, JWTPayload } from '../models/types';

export class AuthService {
  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string) {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        role: 'reader'
      })
      .select('id, name, email, role, avatar_url, preferences, created_at')
      .single();

    if (error || !user) {
      throw new AppError('Failed to create user', 500, 'USER_CREATION_FAILED');
    }

    // Generate tokens
    const tokens = await this.generateTokensForUser(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        preferences: user.preferences
      },
      ...tokens
    };
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string) {
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, role, avatar_url, preferences')
      .eq('email', email)
      .single();

    if (error || !user || !user.password_hash) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokens = await this.generateTokensForUser(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        preferences: user.preferences
      },
      ...tokens
    };
  }

  /**
   * Login or register user with Google OAuth
   */
  async googleAuth(googleProfile: { googleId: string; email: string; name: string; avatar: string }) {
    // Check if user exists with this Google ID
    let { data: user } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url, preferences')
      .eq('google_oauth_id', googleProfile.googleId)
      .single();

    if (!user) {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url, preferences, google_oauth_id')
        .eq('email', googleProfile.email)
        .single();

      if (existingUser) {
        // Link Google account to existing user
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ google_oauth_id: googleProfile.googleId })
          .eq('id', existingUser.id)
          .select('id, name, email, role, avatar_url, preferences')
          .single();

        user = updatedUser;
      } else {
        // Create new user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            name: googleProfile.name,
            email: googleProfile.email,
            google_oauth_id: googleProfile.googleId,
            avatar_url: googleProfile.avatar,
            email_verified: true,
            role: 'reader'
          })
          .select('id, name, email, role, avatar_url, preferences')
          .single();

        if (error || !newUser) {
          throw new AppError('Failed to create user', 500, 'USER_CREATION_FAILED');
        }

        user = newUser;
      }
    }

    if (!user) {
      throw new AppError('Authentication failed', 500, 'AUTH_FAILED');
    }

    // Generate tokens
    const tokens = await this.generateTokensForUser(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        preferences: user.preferences
      },
      ...tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    // Verify refresh token exists in database
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('refresh_token', refreshToken)
      .single();

    if (error || !session) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Check if token is expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await supabase
        .from('sessions')
        .delete()
        .eq('refresh_token', refreshToken);

      throw new AppError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
    }

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', session.user_id)
      .single();

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return { accessToken };
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string) {
    // Delete session from database
    await supabase
      .from('sessions')
      .delete()
      .eq('refresh_token', refreshToken);

    return { message: 'Logged out successfully' };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string) {
    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // Don't reveal if email exists
      return { message: "If that email exists, we've sent a reset link" };
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store reset token
    await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires: expiresAt.toISOString()
      })
      .eq('id', user.id);

    // TODO: Send email with reset link
    // await emailService.sendPasswordReset(email, resetToken);

    return { message: "If that email exists, we've sent a reset link" };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    // Find user with valid reset token
    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (error || !user) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    // Check if token is expired
    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      throw new AppError('Reset token expired', 400, 'RESET_TOKEN_EXPIRED');
    }

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update password and clear reset token
    await supabase
      .from('users')
      .update({
        password_hash,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('id', user.id);

    // Invalidate all existing sessions
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id);

    return { message: 'Password reset successfully' };
  }

  /**
   * Generate access and refresh tokens for a user
   */
  private async generateTokensForUser(userId: string, email: string, role: string) {
    // Generate access token
    const accessToken = generateAccessToken({
      userId,
      email,
      role: role as 'reader' | 'author' | 'admin'
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    // Store refresh token in database
    await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString()
      });

    return {
      accessToken,
      refreshToken
    };
  }
}

export default new AuthService();
