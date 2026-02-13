import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class StorageService {
  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(file: Express.Multer.File, userId: string): Promise<string> {
    if (!file) {
      throw new AppError('No file provided', 400, 'NO_FILE');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400, 'INVALID_FILE_TYPE');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new AppError('File size exceeds 5MB limit', 400, 'FILE_TOO_LARGE');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}-${file.originalname}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw new AppError('Failed to upload image', 500, 'UPLOAD_FAILED');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const filename = pathParts.slice(pathParts.indexOf('uploads') + 1).join('/');

      await supabase.storage
        .from('uploads')
        .remove([filename]);
    } catch (error) {
      // Silently fail - file might not exist
      console.error('Failed to delete image:', error);
    }
  }
}

export default new StorageService();
