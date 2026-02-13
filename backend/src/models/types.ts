// User types
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  avatar_url?: string;
  role: 'reader' | 'author' | 'admin';
  google_oauth_id?: string;
  preferences: UserPreferences;
  email_verified: boolean;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  font_size: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark';
  simplified_view: boolean;
  email_notifications: {
    weekly_newsletter?: boolean;
    favorite_categories?: boolean;
    comment_replies?: boolean;
  };
}

// Article types
export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  author_id: string;
  category_id: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date?: Date;
  schedule_date?: Date;
  stick_to_front_page: boolean;
  read_time_minutes: number;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ArticleWithRelations extends Article {
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  category?: Category;
  tags?: Tag[];
  is_bookmarked?: boolean;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_category_id?: string;
  article_count: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  parent?: Category;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
}

// Comment types
export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  status: 'visible' | 'hidden' | 'flagged';
  created_at: Date;
  updated_at: Date;
}

export interface CommentWithRelations extends Comment {
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  replies?: CommentWithRelations[];
}

// Bookmark types
export interface Bookmark {
  user_id: string;
  article_id: string;
  created_at: Date;
}

// Reading list types
export interface ReadingListItem {
  user_id: string;
  article_id: string;
  created_at: Date;
}

// Activity log types
export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id?: string;
  description: string;
  created_at: Date;
}

// Revision types
export interface Revision {
  id: string;
  article_id: string;
  user_id: string;
  title: string;
  content_snapshot: string;
  created_at: Date;
}

// Session types
export interface Session {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: Date;
  created_at: Date;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'reader' | 'author' | 'admin';
  iat?: number;
  exp?: number;
}

// Request extension for authenticated user
export interface AuthenticatedRequest extends Express.Request {
  user?: JWTPayload;
}
