import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Article, ArticleWithRelations } from '../models/types';
import { calculateReadTime } from '../utils/helpers';
import { generateSlug } from '../utils/slug';

export class ArticlesService {
  /**
   * List articles with filters and pagination
   */
  async listArticles(filters: {
    limit?: number;
    offset?: number;
    category?: string;
    tag?: string;
    status?: string;
    search?: string;
    sort?: string;
    order?: string;
    userId?: string;
  }) {
    const {
      limit = 10,
      offset = 0,
      category,
      tag,
      status = 'published',
      search,
      sort = 'publish_date',
      order = 'desc',
      userId
    } = filters;

    let query = supabase
      .from('articles')
      .select(`
        *,
        author:users!articles_author_id_fkey(id, name, avatar_url),
        category:categories!articles_category_id_fkey(id, name, slug),
        article_tags!inner(tag:tags(id, name, slug))
      `, { count: 'exact' });

    // Filter by status (non-admin users only see published)
    if (!userId || status) {
      query = query.eq('status', status);
    }

    // Filter by category slug
    if (category) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }

    // Filter by tag slug
    if (tag) {
      const { data: tagData } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', tag)
        .single();

      if (tagData) {
        query = query.contains('article_tags', [{ tag_id: tagData.id }]);
      }
    }

    // Search in title and excerpt
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    // Sorting
    const sortColumn = sort === 'view_count' ? 'view_count' : sort === 'title' ? 'title' : 'publish_date';
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: articles, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch articles', 500, 'FETCH_FAILED');
    }

    // Check if bookmarked for authenticated user
    const articlesWithBookmarks = await this.addBookmarkStatus(articles || [], userId);

    return {
      articles: articlesWithBookmarks,
      total: count || 0,
      limit,
      offset
    };
  }

  /**
   * Get article by slug
   */
  async getArticleBySlug(slug: string, userId?: string) {
    const { data: article, error } = await supabase
      .from('articles')
      .select(`
        *,
        author:users!articles_author_id_fkey(id, name, avatar_url),
        category:categories!articles_category_id_fkey(id, name, slug, parent_category_id),
        article_tags(tag:tags(id, name, slug))
      `)
      .eq('slug', slug)
      .single();

    if (error || !article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    // Increment view count
    await supabase
      .from('articles')
      .update({ view_count: article.view_count + 1 })
      .eq('id', article.id);

    // Get related articles (same category, limit 3)
    const { data: relatedArticles } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, featured_image_url, author:users!articles_author_id_fkey(id, name, avatar_url), category:categories!articles_category_id_fkey(name, slug), publish_date, read_time_minutes')
      .eq('category_id', article.category_id)
      .eq('status', 'published')
      .neq('id', article.id)
      .order('publish_date', { ascending: false })
      .limit(3);

    // Check if bookmarked
    let isBookmarked = false;
    if (userId) {
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('article_id')
        .eq('user_id', userId)
        .eq('article_id', article.id)
        .single();

      isBookmarked = !!bookmark;
    }

    // Extract tags from junction table result
    const tags = article.article_tags?.map((at: any) => at.tag) || [];

    return {
      ...article,
      tags,
      is_bookmarked: isBookmarked,
      related_articles: relatedArticles || []
    };
  }

  /**
   * Create new article
   */
  async createArticle(data: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    featured_image_url?: string;
    category_id: string;
    tag_ids?: string[];
    status: 'draft' | 'published' | 'scheduled';
    publish_date?: string;
    schedule_date?: string;
    stick_to_front_page?: boolean;
  }, authorId: string) {
    // Generate slug if not provided
    let slug = data.slug || generateSlug(data.title);

    // Ensure slug is unique
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingArticle) {
      slug = `${slug}-${Date.now()}`;
    }

    // Calculate read time
    const readTime = calculateReadTime(data.content);

    // Create article
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        featured_image_url: data.featured_image_url,
        author_id: authorId,
        category_id: data.category_id,
        status: data.status,
        publish_date: data.status === 'published' ? new Date().toISOString() : data.publish_date,
        schedule_date: data.schedule_date,
        stick_to_front_page: data.stick_to_front_page || false,
        read_time_minutes: readTime
      })
      .select()
      .single();

    if (error || !article) {
      throw new AppError('Failed to create article', 500, 'CREATE_FAILED');
    }

    // Add tags if provided
    if (data.tag_ids && data.tag_ids.length > 0) {
      const articleTags = data.tag_ids.map(tagId => ({
        article_id: article.id,
        tag_id: tagId
      }));

      await supabase.from('article_tags').insert(articleTags);
    }

    // Log activity
    await this.logActivity(authorId, 'article_created', article.id, `Created article "${data.title}"`);

    return article;
  }

  /**
   * Update article
   */
  async updateArticle(id: string, data: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image_url: string;
    category_id: string;
    tag_ids: string[];
    status: 'draft' | 'published' | 'scheduled';
    publish_date: string;
    schedule_date: string;
    stick_to_front_page: boolean;
  }>, userId: string) {
    // Get existing article
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingArticle) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    // Create revision before updating
    await supabase.from('revisions').insert({
      article_id: id,
      user_id: userId,
      title: existingArticle.title,
      content_snapshot: existingArticle.content
    });

    // Update read time if content changed
    if (data.content) {
      data['read_time_minutes' as keyof typeof data] = calculateReadTime(data.content) as any;
    }

    // Update article
    const { data: article, error } = await supabase
      .from('articles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error || !article) {
      throw new AppError('Failed to update article', 500, 'UPDATE_FAILED');
    }

    // Update tags if provided
    if (data.tag_ids !== undefined) {
      // Remove existing tags
      await supabase.from('article_tags').delete().eq('article_id', id);

      // Add new tags
      if (data.tag_ids.length > 0) {
        const articleTags = data.tag_ids.map(tagId => ({
          article_id: id,
          tag_id: tagId
        }));

        await supabase.from('article_tags').insert(articleTags);
      }
    }

    // Log activity
    await this.logActivity(userId, 'article_updated', id, `Updated article "${article.title}"`);

    return article;
  }

  /**
   * Delete article
   */
  async deleteArticle(id: string, userId: string) {
    const { data: article } = await supabase
      .from('articles')
      .select('title')
      .eq('id', id)
      .single();

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    // Delete article (cascade will handle related records)
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to delete article', 500, 'DELETE_FAILED');
    }

    // Log activity
    await this.logActivity(userId, 'article_deleted', id, `Deleted article "${article.title}"`);

    return { message: 'Article deleted successfully' };
  }

  /**
   * Get article revisions
   */
  async getArticleRevisions(id: string) {
    const { data: revisions, error } = await supabase
      .from('revisions')
      .select(`
        *,
        user:users!revisions_user_id_fkey(id, name, avatar_url)
      `)
      .eq('article_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch revisions', 500, 'FETCH_FAILED');
    }

    return { revisions: revisions || [] };
  }

  /**
   * Add bookmark status to articles
   */
  private async addBookmarkStatus(articles: any[], userId?: string) {
    if (!userId || articles.length === 0) {
      return articles.map(article => ({ ...article, is_bookmarked: false }));
    }

    const articleIds = articles.map(a => a.id);

    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('article_id')
      .eq('user_id', userId)
      .in('article_id', articleIds);

    const bookmarkedIds = new Set(bookmarks?.map(b => b.article_id) || []);

    return articles.map(article => ({
      ...article,
      is_bookmarked: bookmarkedIds.has(article.id)
    }));
  }

  /**
   * Log activity
   */
  private async logActivity(userId: string, actionType: string, targetId: string, description: string) {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action_type: actionType,
      target_type: 'article',
      target_id: targetId,
      description
    });
  }
}

export default new ArticlesService();
