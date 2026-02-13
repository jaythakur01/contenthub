import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Category, CategoryWithChildren } from '../models/types';
import { generateSlug } from '../utils/slug';

export class CategoriesService {
  /**
   * List all categories with hierarchy
   */
  async listCategories(includeChildren: boolean = true) {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new AppError('Failed to fetch categories', 500, 'FETCH_FAILED');
    }

    if (!includeChildren) {
      return { categories: categories || [] };
    }

    // Build hierarchy
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First pass: create map of all categories
    (categories || []).forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build hierarchy
    categoryMap.forEach(cat => {
      if (cat.parent_category_id) {
        const parent = categoryMap.get(cat.parent_category_id);
        if (parent) {
          parent.children!.push(cat);
        } else {
          rootCategories.push(cat);
        }
      } else {
        rootCategories.push(cat);
      }
    });

    return { categories: rootCategories };
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Get parent if exists
    let parent = null;
    if (category.parent_category_id) {
      const { data: parentData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', category.parent_category_id)
        .single();

      parent = parentData;
    }

    // Get children
    const { data: children } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_category_id', category.id)
      .order('sort_order', { ascending: true });

    return {
      ...category,
      parent,
      children: children || []
    };
  }

  /**
   * Create category
   */
  async createCategory(data: {
    name: string;
    slug?: string;
    description?: string;
    parent_category_id?: string;
    sort_order?: number;
  }, userId: string) {
    // Generate slug if not provided
    let slug = data.slug || generateSlug(data.name);

    // Ensure slug is unique
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      throw new AppError('Category slug already exists', 409, 'SLUG_EXISTS');
    }

    // Check parent exists if provided
    if (data.parent_category_id) {
      const { data: parent } = await supabase
        .from('categories')
        .select('id')
        .eq('id', data.parent_category_id)
        .single();

      if (!parent) {
        throw new AppError('Parent category not found', 404, 'PARENT_NOT_FOUND');
      }
    }

    // Create category
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: data.name,
        slug,
        description: data.description,
        parent_category_id: data.parent_category_id,
        sort_order: data.sort_order || 0
      })
      .select()
      .single();

    if (error || !category) {
      throw new AppError('Failed to create category', 500, 'CREATE_FAILED');
    }

    // Log activity
    await this.logActivity(userId, 'category_created', category.id, `Created category "${data.name}"`);

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: Partial<{
    name: string;
    slug: string;
    description: string;
    parent_category_id: string;
    sort_order: number;
  }>, userId: string) {
    // Check category exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCategory) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check for circular reference if parent is being changed
    if (data.parent_category_id) {
      if (data.parent_category_id === id) {
        throw new AppError('Category cannot be its own parent', 400, 'CIRCULAR_REFERENCE');
      }

      // Check if new parent is a descendant of this category
      const isDescendant = await this.isDescendant(id, data.parent_category_id);
      if (isDescendant) {
        throw new AppError('Cannot set a descendant as parent', 400, 'CIRCULAR_REFERENCE');
      }
    }

    // Update category
    const { data: category, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error || !category) {
      throw new AppError('Failed to update category', 500, 'UPDATE_FAILED');
    }

    // Log activity
    await this.logActivity(userId, 'category_updated', id, `Updated category "${category.name}"`);

    return category;
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string, articleAction: 'move_to_parent' | 'move_to_uncategorized' | 'delete', userId: string) {
    const { data: category } = await supabase
      .from('categories')
      .select('*, articles(id)')
      .eq('id', id)
      .single();

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Handle articles based on action
    const articleIds = category.articles?.map((a: any) => a.id) || [];

    if (articleIds.length > 0) {
      switch (articleAction) {
        case 'move_to_parent':
          if (category.parent_category_id) {
            await supabase
              .from('articles')
              .update({ category_id: category.parent_category_id })
              .in('id', articleIds);
          } else {
            // Create or get "Uncategorized" category
            const uncategorizedId = await this.getOrCreateUncategorized();
            await supabase
              .from('articles')
              .update({ category_id: uncategorizedId })
              .in('id', articleIds);
          }
          break;

        case 'move_to_uncategorized':
          const uncategorizedId = await this.getOrCreateUncategorized();
          await supabase
            .from('articles')
            .update({ category_id: uncategorizedId })
            .in('id', articleIds);
          break;

        case 'delete':
          await supabase
            .from('articles')
            .delete()
            .in('id', articleIds);
          break;
      }
    }

    // Delete category (cascade will handle children)
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to delete category', 500, 'DELETE_FAILED');
    }

    // Log activity
    await this.logActivity(userId, 'category_deleted', id, `Deleted category "${category.name}"`);

    return { message: 'Category deleted successfully' };
  }

  /**
   * Reorder categories (for drag-and-drop)
   */
  async reorderCategories(updates: Array<{
    id: string;
    sort_order: number;
    parent_category_id: string | null;
  }>) {
    // Update all categories in batch
    for (const update of updates) {
      await supabase
        .from('categories')
        .update({
          sort_order: update.sort_order,
          parent_category_id: update.parent_category_id
        })
        .eq('id', update.id);
    }

    return { message: 'Categories reordered successfully' };
  }

  /**
   * Check if a category is a descendant of another
   */
  private async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
    const { data: descendant } = await supabase
      .from('categories')
      .select('parent_category_id')
      .eq('id', descendantId)
      .single();

    if (!descendant || !descendant.parent_category_id) {
      return false;
    }

    if (descendant.parent_category_id === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, descendant.parent_category_id);
  }

  /**
   * Get or create "Uncategorized" category
   */
  private async getOrCreateUncategorized(): Promise<string> {
    const { data: uncategorized } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'uncategorized')
      .single();

    if (uncategorized) {
      return uncategorized.id;
    }

    // Create uncategorized category
    const { data: newCategory } = await supabase
      .from('categories')
      .insert({
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: 'Uncategorized articles'
      })
      .select('id')
      .single();

    return newCategory!.id;
  }

  /**
   * Log activity
   */
  private async logActivity(userId: string, actionType: string, targetId: string, description: string) {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action_type: actionType,
      target_type: 'category',
      target_id: targetId,
      description
    });
  }
}

export default new CategoriesService();
