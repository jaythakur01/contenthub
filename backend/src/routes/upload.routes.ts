import { Router } from 'express';
import multer from 'multer';
import uploadController from '../controllers/upload.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed'));
    }
  }
});

/**
 * POST /api/upload/image
 * Upload image to Supabase Storage (auth required, author/admin only)
 */
router.post(
  '/image',
  authenticateToken,
  requireRole(['author', 'admin']),
  upload.single('image'),
  uploadController.uploadImage
);

export default router;
