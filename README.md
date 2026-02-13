# ContentHub - Publishing Platform

A full-stack publishing and content management platform with a public-facing website, comprehensive admin CMS, and mobile-responsive design.

## 🎯 Project Overview

ContentHub is a feature-rich publishing platform that includes:

- **Public Website**: Browse articles, search content, filter by categories, reading preferences
- **User Features**: Authentication, bookmarks, reading lists, personalized settings
- **Admin CMS**: Full content management with rich text editor, category hierarchy, user management
- **Mobile-First**: Responsive design with dedicated mobile layouts and bottom navigation
- **Accessibility**: Text size controls, high contrast mode, keyboard navigation

**Design Assets**: 17 design mockups (8 web layouts, 5 mobile layouts, 4 admin panel screens) located in `/design` folder.

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express.js + TypeScript
- Supabase (PostgreSQL) with Row Level Security
- JWT authentication + Google OAuth
- Bcrypt for password hashing
- Multer for file uploads
- Zod for validation

**Frontend (To Be Built):**
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Slate.js (Rich Text Editor)
- React Query (Server state)
- Axios (HTTP client)

**Database:**
- Supabase PostgreSQL
- 11 tables with relationships
- RLS policies for security
- Triggers for auto-updates

---

## 📁 Project Structure

```
contenthub/
├── design/                    # Design mockups (reference)
│   ├── web/                   # 8 web layout PNGs
│   ├── mobile/                # 5 mobile layout PNGs
│   └── admin/                 # 4 admin panel PNGs
├── backend/                   # Express API
│   ├── src/
│   │   ├── config/            # Database, auth, OAuth config
│   │   ├── controllers/       # Request handlers (TO BE CREATED)
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/            # Types and validation schemas
│   │   ├── routes/            # API routes (TO BE CREATED)
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helper functions
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # Server entry point
│   ├── database/
│   │   └── schema.sql         # Complete database schema
│   ├── .env.example           # Environment variables template
│   ├── package.json
│   └── tsconfig.json
├── frontend/                  # React SPA (TO BE CREATED)
├── IMPLEMENTATION_STATUS.md   # Detailed progress tracking
├── planning.md                # Complete implementation spec
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Google Cloud Console project (for OAuth, optional)
- Email service account (Resend or SendGrid, optional for password reset)

### 1. Clone and Install

```bash
# Clone the repository
cd contenthub

# Install backend dependencies
cd backend
npm install
```

### 2. Set Up Supabase Database

1. Create a new project at https://supabase.com
2. Go to SQL Editor
3. Copy the contents of `backend/database/schema.sql`
4. Execute the SQL (creates all tables, triggers, RLS policies, and seed data)
5. Go to Storage and create a bucket named "uploads" with public access
6. Note your project URL and API keys from Settings > API

### 3. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_random_secret_at_least_32_chars
REFRESH_TOKEN_SECRET=another_random_secret_32_chars

# Optional (for Google OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional (for password reset emails)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@contenthub.com
```

### 4. Start the Backend

```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start
```

The API will be available at `http://localhost:3000/api`

### 5. Test the API

Default admin user created by schema.sql:
- **Email**: admin@contenthub.com
- **Password**: Admin@123

Test login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contenthub.com","password":"Admin@123"}'
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### POST `/auth/register`
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "reader",
    "avatar_url": null,
    "preferences": {...}
  },
  "accessToken": "jwt...",
  "refreshToken": "token..."
}
```

#### POST `/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "admin@contenthub.com",
  "password": "Admin@123"
}
```

**Response (200):** Same as register

#### POST `/auth/refresh`
Refresh access token.

**Request:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200):**
```json
{
  "accessToken": "new_jwt..."
}
```

#### POST `/auth/logout`
Logout and invalidate refresh token.

**Request:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### POST `/auth/forgot-password`
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If that email exists, we've sent a reset link"
}
```

#### POST `/auth/reset-password`
Reset password with token.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecure123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

### Article Endpoints (TO BE IMPLEMENTED)

See `planning.md` for complete API specification with 40+ endpoints.

---

## 🗄️ Database Schema

### Core Tables

1. **users** - User accounts with roles (reader, author, admin)
2. **articles** - Published content with status (draft, published, scheduled)
3. **categories** - Hierarchical category system
4. **tags** - Article tags
5. **article_tags** - Many-to-many junction table
6. **comments** - Threaded comments with moderation
7. **bookmarks** - User-saved articles
8. **reading_list** - User reading queue
9. **activity_logs** - Admin activity tracking
10. **revisions** - Article version history
11. **sessions** - JWT refresh tokens

### Key Features

- **Row Level Security (RLS)**: All tables have policies
- **Auto-triggers**: updated_at, article_count, slug generation
- **Hierarchical Categories**: Supports nested categories with drag-and-drop
- **Threaded Comments**: Parent-child relationships for replies
- **Soft Deletes**: Option to preserve data

See `backend/database/schema.sql` for complete schema.

---

## 🎨 Design Implementation

The implementation should match the 17 provided design mockups:

### Web Layouts (8 screens)
1. Home page with featured article and headlines grid
2. Article detail with hero image and related articles
3. Categories page with filter pills
4. Category overview with article grid
5. Login page with accessibility controls
6. Sign up page with password strength indicator
7. Search & settings page with preferences sidebar
8. Logged out confirmation page

### Mobile Layouts (5 screens)
1. Mobile headlines feed with category tabs
2. Mobile article detail with bottom nav
3. Mobile category overview
4. Mobile search results with collapsible preferences
5. Mobile article feed with reading preferences

### Admin Panel (4 screens)
1. Dashboard with metrics, quick actions, activity feed
2. Posts management with search, filters, table
3. Post editor with Slate.js rich text editor and sidebar
4. Categories management with hierarchical tree and drag-and-drop

---

## 🔐 Authentication & Security

### JWT Authentication
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry, stored in database
- Automatic token refresh on expiry

### Password Requirements
- Minimum 8 characters
- At least 1 number
- At least 1 uppercase letter
- At least 1 special character (!@#$%^&*)
- Bcrypt hashing with 10 rounds

### Google OAuth
- OAuth 2.0 flow with Passport.js
- Auto-creates account or links to existing email
- Scopes: profile, email

### Row Level Security
- Database-level security with Supabase RLS
- Users can only access their own data
- Authors can edit their articles
- Admins have full access

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- General API: 100 requests per 15 minutes

---

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Run in development mode (auto-reload)
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build

# Run production build
npm start
```

### Environment Variables

See `.env.example` for all available options.

**Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`

**Optional:**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (OAuth)
- `RESEND_API_KEY` / `FROM_EMAIL` (Email)
- `FRONTEND_URL` (CORS, default: localhost:5173)

### Frontend Development (TO BE CREATED)

The frontend needs to be built from scratch using React + Vite. See `planning.md` for detailed component structure and implementation plan.

---

## 📋 Implementation Checklist

### ✅ Completed
- [x] Backend project structure
- [x] Database schema with RLS
- [x] TypeScript configuration
- [x] Middleware (auth, validation, error handling)
- [x] Auth service (register, login, OAuth, password reset)
- [x] Utility functions (slug, password, JWT, helpers)
- [x] Type definitions for all models
- [x] Zod validation schemas

### 🚧 In Progress
- [ ] API routes and controllers (auth, articles, categories, etc.)
- [ ] Storage service for image uploads
- [ ] Email service for password reset
- [ ] Frontend React app setup
- [ ] Authentication pages
- [ ] Public website pages
- [ ] Admin panel with Slate.js editor
- [ ] Mobile responsive design

See `IMPLEMENTATION_STATUS.md` for detailed progress tracking.

---

## 🚀 Deployment

### Backend Deployment (Recommended: Railway, Render, Fly.io)

1. Create a new project on your hosting platform
2. Connect to GitHub repository
3. Set environment variables from `.env`
4. Deploy from `backend` directory
5. Ensure `PORT` is set to the platform's dynamic port

### Frontend Deployment (Recommended: Vercel, Netlify)

1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to Vercel/Netlify
3. Set `VITE_API_URL` environment variable to your backend URL
4. Configure SPA redirects (all routes to `/index.html`)

### Database

Supabase handles database hosting. No additional deployment needed.

---

## 📊 Current Status

**Project Completion: ~15%**

### Foundation (Complete)
- ✅ Backend structure and dependencies
- ✅ Database schema deployed
- ✅ Auth service implemented
- ✅ Middleware configured

### Critical Path (Next Steps)
1. **Backend API** - Create route handlers and controllers
2. **Frontend Setup** - Initialize React app with Vite + Tailwind
3. **Auth Flow** - Login/Register pages
4. **Core Pages** - Home, Article Detail, Admin Editor
5. **Rich Text Editor** - Slate.js implementation
6. **Mobile Responsive** - Breakpoints and mobile layouts

**Estimated time to MVP: 8-10 days of full-time development**

---

## 📖 Additional Documentation

- **Implementation Plan**: `planning.md` - Complete feature specifications
- **Progress Tracking**: `IMPLEMENTATION_STATUS.md` - Detailed checklist
- **Research Notes**: `research.md` - Design analysis and data model inferences
- **Database Schema**: `backend/database/schema.sql` - Complete SQL with RLS policies

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the project owner.

---

## 📄 License

Proprietary - All rights reserved.

---

## 🎯 Quick Start Summary

1. **Set up Supabase**
   ```bash
   # Run schema.sql in Supabase SQL Editor
   # Create "uploads" storage bucket
   ```

2. **Configure Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with Supabase credentials
   ```

3. **Start Server**
   ```bash
   npm run dev
   # Server: http://localhost:3000
   ```

4. **Test API**
   ```bash
   # Login with default admin (admin@contenthub.com / Admin@123)
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@contenthub.com","password":"Admin@123"}'
   ```

5. **Build Frontend** (See `planning.md` for React setup instructions)

---

**For detailed implementation guidance, refer to `planning.md` and `IMPLEMENTATION_STATUS.md`.**