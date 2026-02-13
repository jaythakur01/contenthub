# ContentHub - Next Steps Guide

## ✅ What's Been Completed

### Foundation (100% Done)
1. ✅ **Project Structure**
   - Backend folder structure with proper organization
   - TypeScript configuration
   - Package.json with all dependencies

2. ✅ **Database Schema**
   - Complete SQL schema in `backend/database/schema.sql`
   - 11 tables with proper relationships
   - RLS policies for security
   - Triggers for auto-updates (updated_at, article_count, slug generation)
   - Seed data (default admin user + categories)

3. ✅ **Backend Core**
   - Express app setup with middleware
   - Supabase client configuration
   - JWT authentication utilities
   - Password hashing utilities
   - Slug generation
   - Helper functions

4. ✅ **Middleware**
   - Authentication middleware (JWT verification)
   - Role-based access control
   - Request validation (Zod schemas)
   - Error handling
   - Rate limiting

5. ✅ **Authentication System**
   - Auth service (register, login, OAuth, password reset)
   - Auth controller
   - Auth routes (fully implemented)
   - Google OAuth configuration

6. ✅ **Type System**
   - Complete TypeScript types for all data models
   - Zod validation schemas for all endpoints

7. ✅ **Placeholder Routes**
   - Article routes (stub)
   - Category routes (stub)
   - Comment routes (stub)
   - Bookmark routes (stub)
   - User routes (stub)
   - Admin routes (stub)
   - Upload routes (stub)

---

## 🚧 What Needs to Be Done

### Immediate Priority (Backend API Completion)

#### 1. Article Service & Controller (HIGH PRIORITY)
**File:** `backend/src/services/articles.service.ts`
**File:** `backend/src/controllers/articles.controller.ts`

**Functionality Needed:**
- `listArticles(filters, pagination)` - List articles with filters, search, pagination
- `getArticleBySlug(slug, userId?)` - Get single article, increment view count, check if bookmarked
- `createArticle(data, authorId)` - Create article, calculate read time, generate slug
- `updateArticle(id, data, userId)` - Update article, create revision
- `deleteArticle(id)` - Delete article and related data
- `getArticleRevisions(id)` - Get revision history

**Key Implementation Details:**
- Calculate `read_time_minutes` from content word count (200 words/min)
- Auto-generate slug from title if not provided
- On update, create entry in `revisions` table
- Include author, category, tags in responses
- For authenticated requests, include `is_bookmarked` field
- Increment `view_count` when article is viewed
- Filter by status (only show published to non-authors)

#### 2. Category Service & Controller (HIGH PRIORITY)
**File:** `backend/src/services/categories.service.ts`
**File:** `backend/src/controllers/categories.controller.ts`

**Functionality Needed:**
- `listCategories(includeChildren)` - Get all categories with hierarchy
- `getCategoryBySlug(slug)` - Get single category with parent/children
- `createCategory(data)` - Create category, auto-generate slug
- `updateCategory(id, data)` - Update category
- `deleteCategory(id, articleAction)` - Delete category, handle articles
- `reorderCategories(updates)` - Bulk update sort_order and parent_category_id

**Key Implementation Details:**
- Build hierarchical tree structure (parent-child relationships)
- Handle circular reference check on parent assignment
- On delete, handle articles based on `articleAction`:
  - `move_to_parent` - Move to parent category
  - `move_to_uncategorized` - Create/use "Uncategorized" category
  - `delete` - Delete articles (dangerous!)
- Drag-and-drop reorder endpoint for admin panel

#### 3. Upload Service & Controller (MEDIUM PRIORITY)
**File:** `backend/src/services/storage.service.ts`
**File:** `backend/src/controllers/upload.controller.ts`

**Functionality Needed:**
- `uploadImage(file, userId)` - Upload image to Supabase Storage, return public URL

**Key Implementation Details:**
- Use Multer for multipart/form-data parsing
- Validate file type (jpeg, png, webp only)
- Validate file size (max 5MB)
- Upload to Supabase Storage bucket: `uploads/{user-id}/{timestamp}-{filename}`
- Return public URL for use in articles or avatars
- Delete old images when replacing (optional)

**Multer Setup:**
```typescript
import multer from 'multer';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

#### 4. User Service & Controller (MEDIUM PRIORITY)
**File:** `backend/src/services/users.service.ts`
**File:** `backend/src/controllers/users.controller.ts`

**Functionality Needed:**
- `getCurrentUser(userId)` - Get user profile
- `updateUser(userId, data)` - Update name, avatar, preferences
- `changePassword(userId, currentPassword, newPassword)` - Change password
- `deleteAccount(userId)` - Delete user account

**Key Implementation Details:**
- Users can only update their own profile
- Password change requires current password verification
- Update preferences (font_size, theme, email_notifications)
- Delete account should handle orphaned content (reassign or anonymize)

#### 5. Bookmark/Reading List Service & Controller (LOW PRIORITY)
**File:** `backend/src/services/bookmarks.service.ts`
**File:** `backend/src/controllers/bookmarks.controller.ts`

**Functionality Needed:**
- `getUserBookmarks(userId, pagination)` - Get user's bookmarked articles
- `addBookmark(userId, articleId)` - Add article to bookmarks
- `removeBookmark(userId, articleId)` - Remove from bookmarks
- `getUserReadingList(userId, pagination)` - Get reading list
- `addToReadingList(userId, articleId)` - Add to reading list
- `removeFromReadingList(userId, articleId)` - Remove from reading list

**Key Implementation Details:**
- Simple junction table operations
- Include full article data in responses
- Handle duplicate inserts gracefully (ignore if exists)

#### 6. Comment Service & Controller (MEDIUM PRIORITY)
**File:** `backend/src/services/comments.service.ts`
**File:** `backend/src/controllers/comments.controller.ts`

**Functionality Needed:**
- `getArticleComments(articleId, pagination)` - Get comments with threading
- `createComment(data)` - Create top-level or reply comment
- `updateComment(id, userId, content)` - Update own comment
- `deleteComment(id, userId)` - Delete own comment or admin delete
- `flagComment(id)` - Flag comment for moderation

**Key Implementation Details:**
- Build threaded comment structure (recursive)
- Max 3 levels of nesting
- Only visible comments for non-admins
- Users can edit/delete own comments
- Admins can moderate all comments

#### 7. Admin Service & Controller (MEDIUM PRIORITY)
**File:** `backend/src/services/admin.service.ts`
**File:** `backend/src/controllers/admin.controller.ts`

**Functionality Needed:**
- `getDashboardMetrics()` - Get metrics for dashboard
- `listUsers(filters, pagination)` - List all users
- `updateUserRole(userId, role)` - Change user role
- `createUser(data)` - Create user manually (admin only)

**Key Implementation Details:**
- Dashboard metrics:
  - Total articles count
  - Total categories count
  - Total page views (sum of view_count)
  - Total users count
  - Monthly views (current month)
  - Recent articles (5 most recent)
  - Recent activity (5 from activity_logs)
- User management admin-only
- Generate reset token for created users (invitation flow)

---

### Frontend Development (Next Phase)

Once backend is complete, build the React frontend:

#### 1. Setup React + Vite Project
```bash
cd contenthub
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install tailwindcss postcss autoprefixer
npm install react-router-dom axios react-query
npm install slate slate-react slate-history
npm install react-hook-form zod @hookform/resolvers
```

#### 2. Configure Tailwind CSS
Follow planning.md for Tailwind configuration.

#### 3. Project Structure
```
frontend/
├── src/
│   ├── api/              # API client (Axios)
│   ├── components/       # Reusable components
│   ├── contexts/         # Auth context, theme context
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   ├── types/            # TypeScript types
│   ├── utils/            # Helper functions
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
```

#### 4. Core Components to Build
See planning.md for detailed specifications:
- Authentication pages (Login, Register, etc.)
- Public website pages (Home, Article Detail, Categories, Search)
- Admin panel (Dashboard, Posts, Post Editor, Categories)
- Slate.js Rich Text Editor
- Mobile navigation

---

## 📊 Estimated Time to Complete

### Backend (Remaining Work)
- Article service & controller: 4-6 hours
- Category service & controller: 3-4 hours
- Upload service & controller: 2-3 hours
- User service & controller: 2-3 hours
- Bookmark service & controller: 1-2 hours
- Comment service & controller: 3-4 hours
- Admin service & controller: 2-3 hours
- Testing & debugging: 3-4 hours

**Total Backend: ~20-30 hours** (2-4 days full-time)

### Frontend (Full Build)
- Setup & configuration: 2-3 hours
- API client & auth context: 3-4 hours
- Common components: 4-6 hours
- Auth pages: 3-4 hours
- Public pages: 8-10 hours
- Admin panel: 10-12 hours
- Slate.js editor: 6-8 hours
- Mobile responsive: 6-8 hours
- Testing & polish: 6-8 hours

**Total Frontend: ~48-63 hours** (6-8 days full-time)

### **Grand Total: 8-12 days full-time development**

---

## 🎯 Quick Win Path (MVP in 3-4 Days)

If you want a working MVP quickly:

### Day 1: Backend Core
- Complete article service & controller
- Complete category service (basic, skip drag-and-drop)
- Complete upload service
- Test auth + articles endpoints

### Day 2: Frontend Setup & Auth
- Set up React + Vite
- Configure Tailwind
- Build auth pages (login, register)
- Build API client with token refresh

### Day 3: Public Pages
- Home page (article list)
- Article detail page (basic rendering)
- Category filtering

### Day 4: Admin Panel
- Dashboard (basic metrics)
- Posts table
- Basic post editor (textarea, not Slate.js)
- Test end-to-end

This gives you a functional (but not feature-complete) MVP.

---

## 🔧 Development Commands

### Backend
```bash
cd backend

# Install dependencies
npm install

# Development mode
npm run dev

# Type check
npm run typecheck

# Build
npm run build

# Production
npm start
```

### Frontend (Once Created)
```bash
cd frontend

# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

---

## 🧪 Testing Strategy

### Backend Testing
Test each endpoint with:
- **Postman** or **Insomnia** collections
- **cURL** commands

Example test flow:
1. Register user → Get tokens
2. Login → Get tokens
3. Create article (use access token)
4. List articles
5. Get article by slug
6. Update article
7. Delete article

### Frontend Testing
- Manual testing against all 17 design mockups
- Test authentication flow
- Test article creation/editing
- Test mobile responsive layouts
- Test accessibility features

---

## 📝 Key Configuration Files

### Backend `.env`
```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
JWT_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Supabase Setup
1. Create project at supabase.com
2. Run `backend/database/schema.sql` in SQL Editor
3. Create storage bucket "uploads" with public access
4. Copy URL and service role key to backend `.env`

---

## 🚀 Deployment Checklist

### Before Deploying
- [ ] Complete all backend endpoints
- [ ] Test authentication flow
- [ ] Test article CRUD
- [ ] Build frontend production bundle
- [ ] Set environment variables on hosting platforms
- [ ] Test with production database

### Backend Deployment
- Railway, Render, or Fly.io
- Set all environment variables
- Deploy from `backend` directory
- Ensure PORT is set correctly

### Frontend Deployment
- Vercel or Netlify
- Deploy from `frontend/dist`
- Set VITE_API_URL to backend URL
- Configure SPA redirects

---

## 💡 Tips & Best Practices

1. **Start with Backend**: Complete backend API before frontend
2. **Test as You Go**: Test each endpoint immediately after implementing
3. **Follow Planning.md**: Detailed specifications for every feature
4. **Commit Frequently**: Small, focused commits
5. **Use TypeScript**: Leverage type safety throughout
6. **Match Designs**: Reference 17 design mockups in `/design` folder
7. **Mobile First**: Design for mobile, then scale up
8. **Accessibility**: Include ARIA labels, keyboard navigation

---

## 📖 Reference Documentation

- **`planning.md`** - Complete feature specifications (2500+ lines)
- **`research.md`** - Design analysis and data model
- **`IMPLEMENTATION_STATUS.md`** - Detailed progress tracking
- **`README.md`** - Setup and API documentation
- **`backend/database/schema.sql`** - Database schema

---

## ❓ Common Issues & Solutions

### Issue: "Module not found" errors
**Solution**: Run `npm install` in backend directory

### Issue: Database connection fails
**Solution**: Check Supabase URL and service role key in `.env`

### Issue: JWT token invalid
**Solution**: Ensure JWT_SECRET is set and consistent

### Issue: CORS errors
**Solution**: Check FRONTEND_URL in backend `.env` matches frontend origin

### Issue: Image upload fails
**Solution**: Create "uploads" storage bucket in Supabase with public access

---

**Current Status: ~20% Complete (Foundation Done, API Implementation In Progress)**

**Next Immediate Step: Implement Article Service & Controller**
