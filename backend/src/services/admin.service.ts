import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { hashPassword, generateResetToken } from '../utils/password';

export class AdminService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics() {
    // Total articles
    const { count: totalArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    // Total categories
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // Total page views
    const { data: viewsData } = await supabase
      .from('articles')
      .select('view_count');

    const totalPageViews = viewsData?.reduce((sum, article) => sum + article.view_count, 0) || 0;

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Monthly views (current month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthlyArticles } = await supabase
      .from('articles')
      .select('view_count')
      .gte('publish_date', monthStart.toISOString());

    const monthlyViews = monthlyArticles?.reduce((sum, article) => sum + article.view_count, 0) || 0;

    // Recent articles (5 most recent)
    const { data: recentArticles } = await supabase
      .from('articles')
      .select(`
        id, title, status,
        author:users!articles_author_id_fkey(name),
        category:categories!articles_category_id_fkey(name),
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent activity (5 most recent)
    const { data: recentActivity } = await supabase
      .from('activity_logs')
      .select(`
        *,
        user:users!activity_logs_user_id_fkey(name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      metrics: {
        total_articles: totalArticles || 0,
        total_categories: totalCategories || 0,
        total_page_views: totalPageViews,
        total_users: totalUsers || 0
      },
      monthly_views: monthlyViews,
      recent_articles: recentArticles || [],
      recent_activity: recentActivity || []
    };
  }

  /**
   * List all users with filters
   */
  async listUsers(filters: {
    search?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }) {
    const { search, role, limit = 10, offset = 0 } = filters;

    let query = supabase
      .from('users')
      .select(`
        id, name, email, avatar_url, role, created_at,
        articles:articles(count)
      `, { count: 'exact' });

    // Search by name or email
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Filter by role
    if (role) {
      query = query.eq('role', role);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch users', 500, 'FETCH_FAILED');
    }

    return {
      users: users || [],
      total: count || 0
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: 'reader' | 'author' | 'admin') {
    const { data: user, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, name, email, role')
      .single();

    if (error || !user) {
      throw new AppError('Failed to update user role', 500, 'UPDATE_FAILED');
    }

    return { user };
  }

  /**
   * Create user (admin invitation)
   */
  async createUser(data: {
    name: string;
    email: string;
    role: 'reader' | 'author' | 'admin';
    send_invitation: boolean;
  }) {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingUser) {
      throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const password_hash = await hashPassword(tempPassword);

    // Generate reset token for first-time setup
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 24); // 24 hour expiry

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: data.name,
        email: data.email,
        password_hash,
        role: data.role,
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires.toISOString()
      })
      .select('id, name, email, role')
      .single();

    if (error || !user) {
      throw new AppError('Failed to create user', 500, 'CREATE_FAILED');
    }

    // TODO: Send invitation email with reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return {
      user,
      reset_link: resetLink
    };
  }
}

export default new AdminService();
