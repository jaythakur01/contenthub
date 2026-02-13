import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class BookmarksService {
  /**
   * Get user's bookmarks
   */
  async getUserBookmarks(userId: string, limit: number = 10, offset: number = 0) {
    const { data: bookmarks, error, count } = await supabase
      .from('bookmarks')
      .select(`
        created_at,
        article:articles!inner(
          id, title, slug, excerpt, featured_image_url,
          author:users!articles_author_id_fkey(id, name, avatar_url),
          category:categories!articles_category_id_fkey(name, slug),
          publish_date, read_time_minutes
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch bookmarks', 500, 'FETCH_FAILED');
    }

    return {
      bookmarks: bookmarks || [],
      total: count || 0
    };
  }

  /**
   * Add bookmark
   */
  async addBookmark(userId: string, articleId: string) {
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, article_id: articleId });

    if (error) {
      // Ignore duplicate errors
      if (error.code === '23505') {
        return { message: 'Article already bookmarked' };
      }
      throw new AppError('Failed to add bookmark', 500, 'CREATE_FAILED');
    }

    return { message: 'Bookmark added successfully' };
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(userId: string, articleId: string) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    if (error) {
      throw new AppError('Failed to remove bookmark', 500, 'DELETE_FAILED');
    }

    return { message: 'Bookmark removed successfully' };
  }

  /**
   * Get user's reading list
   */
  async getUserReadingList(userId: string, limit: number = 10, offset: number = 0) {
    const { data: readingList, error, count } = await supabase
      .from('reading_list')
      .select(`
        created_at,
        article:articles!inner(
          id, title, slug, excerpt, featured_image_url,
          author:users!articles_author_id_fkey(id, name, avatar_url),
          category:categories!articles_category_id_fkey(name, slug),
          publish_date, read_time_minutes
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch reading list', 500, 'FETCH_FAILED');
    }

    return {
      reading_list: readingList || [],
      total: count || 0
    };
  }

  /**
   * Add to reading list
   */
  async addToReadingList(userId: string, articleId: string) {
    const { error } = await supabase
      .from('reading_list')
      .insert({ user_id: userId, article_id: articleId });

    if (error) {
      if (error.code === '23505') {
        return { message: 'Article already in reading list' };
      }
      throw new AppError('Failed to add to reading list', 500, 'CREATE_FAILED');
    }

    return { message: 'Added to reading list successfully' };
  }

  /**
   * Remove from reading list
   */
  async removeFromReadingList(userId: string, articleId: string) {
    const { error } = await supabase
      .from('reading_list')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    if (error) {
      throw new AppError('Failed to remove from reading list', 500, 'DELETE_FAILED');
    }

    return { message: 'Removed from reading list successfully' };
  }
}

export default new BookmarksService();
