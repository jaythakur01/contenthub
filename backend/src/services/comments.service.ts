import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class CommentsService {
  /**
   * Get article comments with threading
   */
  async getArticleComments(articleId: string, limit: number = 10, offset: number = 0) {
    const { data: comments, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        user:users!comments_user_id_fkey(id, name, avatar_url)
      `, { count: 'exact' })
      .eq('article_id', articleId)
      .eq('status', 'visible')
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch comments', 500, 'FETCH_FAILED');
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async comment => {
        const replies = await this.getReplies(comment.id);
        return { ...comment, replies };
      })
    );

    return {
      comments: commentsWithReplies,
      total: count || 0
    };
  }

  /**
   * Get replies for a comment (recursive, max 3 levels)
   */
  private async getReplies(commentId: string, level: number = 1): Promise<any[]> {
    if (level > 3) return [];

    const { data: replies } = await supabase
      .from('comments')
      .select(`
        *,
        user:users!comments_user_id_fkey(id, name, avatar_url)
      `)
      .eq('parent_comment_id', commentId)
      .eq('status', 'visible')
      .order('created_at', { ascending: true });

    if (!replies || replies.length === 0) return [];

    return await Promise.all(
      replies.map(async reply => {
        const nestedReplies = await this.getReplies(reply.id, level + 1);
        return { ...reply, replies: nestedReplies };
      })
    );
  }

  /**
   * Create comment
   */
  async createComment(data: {
    article_id: string;
    content: string;
    parent_comment_id?: string;
  }, userId: string) {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        article_id: data.article_id,
        user_id: userId,
        parent_comment_id: data.parent_comment_id,
        content: data.content
      })
      .select(`
        *,
        user:users!comments_user_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error || !comment) {
      throw new AppError('Failed to create comment', 500, 'CREATE_FAILED');
    }

    return { comment };
  }

  /**
   * Update comment
   */
  async updateComment(id: string, userId: string, content: string) {
    const { data: comment, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !comment) {
      throw new AppError('Failed to update comment', 500, 'UPDATE_FAILED');
    }

    return { comment };
  }

  /**
   * Delete comment
   */
  async deleteComment(id: string, userId: string, isAdmin: boolean) {
    let query = supabase.from('comments').delete().eq('id', id);

    // Non-admins can only delete their own comments
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      throw new AppError('Failed to delete comment', 500, 'DELETE_FAILED');
    }

    return { message: 'Comment deleted successfully' };
  }

  /**
   * Flag comment for moderation
   */
  async flagComment(id: string) {
    const { error } = await supabase
      .from('comments')
      .update({ status: 'flagged' })
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to flag comment', 500, 'FLAG_FAILED');
    }

    return { message: 'Comment flagged for review' };
  }
}

export default new CommentsService();
