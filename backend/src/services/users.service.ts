import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { hashPassword, comparePassword } from '../utils/password';

export class UsersService {
  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, role, preferences, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return { user };
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: {
    name?: string;
    avatar_url?: string;
    preferences?: any;
  }) {
    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select('id, name, email, avatar_url, role, preferences, created_at')
      .single();

    if (error || !user) {
      throw new AppError('Failed to update user', 500, 'UPDATE_FAILED');
    }

    return { user };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user with password hash
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (!user || !user.password_hash) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', userId);

    if (error) {
      throw new AppError('Failed to update password', 500, 'UPDATE_FAILED');
    }

    // Invalidate all sessions except current one (optional)
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    return { message: 'Password updated successfully' };
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new AppError('Failed to delete account', 500, 'DELETE_FAILED');
    }

    return { message: 'Account deleted successfully' };
  }
}

export default new UsersService();
