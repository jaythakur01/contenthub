import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character')
});

export const googleAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Article validation schemas
export const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
  slug: z.string().optional(),
  excerpt: z.string().max(500, 'Excerpt must be at most 500 characters').optional(),
  content: z.string().min(1, 'Content is required'),
  featured_image_url: z.string().url('Invalid image URL').optional().nullable(),
  category_id: z.string().uuid('Invalid category ID'),
  tag_ids: z.array(z.string().uuid()).optional(),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  publish_date: z.string().datetime().optional().nullable(),
  schedule_date: z.string().datetime().optional().nullable(),
  stick_to_front_page: z.boolean().optional().default(false)
});

export const updateArticleSchema = createArticleSchema.partial();

export const articleQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  search: z.string().optional(),
  sort: z.enum(['publish_date', 'view_count', 'title']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent_category_id: z.string().uuid('Invalid parent category ID').optional().nullable(),
  sort_order: z.number().optional()
});

export const updateCategorySchema = createCategorySchema.partial();

export const deleteCategorySchema = z.object({
  article_action: z.enum(['move_to_parent', 'move_to_uncategorized', 'delete'])
});

export const reorderCategoriesSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    sort_order: z.number(),
    parent_category_id: z.string().uuid().nullable()
  }))
});

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Comment must be at most 2000 characters'),
  parent_comment_id: z.string().uuid().optional().nullable()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Comment must be at most 2000 characters')
});

// User validation schemas
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  preferences: z.object({
    font_size: z.enum(['small', 'medium', 'large']).optional(),
    theme: z.enum(['light', 'dark']).optional(),
    simplified_view: z.boolean().optional(),
    email_notifications: z.object({
      weekly_newsletter: z.boolean().optional(),
      favorite_categories: z.boolean().optional(),
      comment_replies: z.boolean().optional()
    }).optional()
  }).optional()
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character')
});

// Admin validation schemas
export const updateUserRoleSchema = z.object({
  role: z.enum(['reader', 'author', 'admin'])
});

export const createUserByAdminSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['reader', 'author', 'admin']),
  send_invitation: z.boolean().optional().default(true)
});

// Bookmark validation schemas
export const createBookmarkSchema = z.object({
  article_id: z.string().uuid('Invalid article ID')
});

// Reading list validation schemas
export const createReadingListSchema = z.object({
  article_id: z.string().uuid('Invalid article ID')
});

// Tag validation schemas
export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().optional()
});

// Generic pagination schema
export const paginationSchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional()
});

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'articles', 'categories', 'authors']).optional().default('all'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional()
});
