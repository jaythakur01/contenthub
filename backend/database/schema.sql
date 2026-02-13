-- ContentHub Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('reader', 'author', 'admin');
CREATE TYPE article_status AS ENUM ('draft', 'published', 'scheduled');
CREATE TYPE comment_status AS ENUM ('visible', 'hidden', 'flagged');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'reader',
    google_oauth_id VARCHAR(255) UNIQUE,
    preferences JSONB DEFAULT '{"font_size": "medium", "theme": "light", "simplified_view": false, "email_notifications": {}}'::jsonb,
    email_verified BOOLEAN DEFAULT false,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_oauth_id ON users(google_oauth_id);
CREATE INDEX idx_users_role ON users(role);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    article_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Articles table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL NOT NULL,
    status article_status NOT NULL DEFAULT 'draft',
    publish_date TIMESTAMP,
    schedule_date TIMESTAMP,
    stick_to_front_page BOOLEAN DEFAULT false,
    read_time_minutes INTEGER DEFAULT 5,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on articles
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_category_id ON articles(category_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_publish_date ON articles(publish_date DESC);
CREATE INDEX idx_articles_status_publish_date ON articles(status, publish_date DESC);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on tags
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_slug ON tags(slug);

-- Article_tags junction table
CREATE TABLE article_tags (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- Create indexes on article_tags
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 2000),
    status comment_status DEFAULT 'visible',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on comments
CREATE INDEX idx_comments_article_id ON comments(article_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_article_created ON comments(article_id, created_at DESC);

-- Bookmarks table
CREATE TABLE bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

-- Create indexes on bookmarks
CREATE INDEX idx_bookmarks_article_id ON bookmarks(article_id);

-- Reading_list table
CREATE TABLE reading_list (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

-- Activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on activity_logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Revisions table
CREATE TABLE revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_snapshot TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on revisions
CREATE INDEX idx_revisions_article_id ON revisions(article_id);
CREATE INDEX idx_revisions_article_created ON revisions(article_id, created_at DESC);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on sessions
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- ============================================================================
-- DATABASE TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update category article_count
CREATE OR REPLACE FUNCTION update_category_article_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF (TG_OP = 'INSERT') THEN
        IF NEW.status = 'published' THEN
            UPDATE categories SET article_count = article_count + 1 WHERE id = NEW.category_id;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle UPDATE
    IF (TG_OP = 'UPDATE') THEN
        -- Status changed from published to something else
        IF OLD.status = 'published' AND NEW.status != 'published' THEN
            UPDATE categories SET article_count = article_count - 1 WHERE id = OLD.category_id;
        END IF;

        -- Status changed to published from something else
        IF OLD.status != 'published' AND NEW.status = 'published' THEN
            UPDATE categories SET article_count = article_count + 1 WHERE id = NEW.category_id;
        END IF;

        -- Category changed while published
        IF NEW.status = 'published' AND OLD.category_id != NEW.category_id THEN
            UPDATE categories SET article_count = article_count - 1 WHERE id = OLD.category_id;
            UPDATE categories SET article_count = article_count + 1 WHERE id = NEW.category_id;
        END IF;

        RETURN NEW;
    END IF;

    -- Handle DELETE
    IF (TG_OP = 'DELETE') THEN
        IF OLD.status = 'published' THEN
            UPDATE categories SET article_count = article_count - 1 WHERE id = OLD.category_id;
        END IF;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply category article count trigger
CREATE TRIGGER update_category_article_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_category_article_count();

-- Function to auto-generate slug from title (if slug is empty)
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Generate base slug from title
        base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
        final_slug := base_slug;

        -- Check for uniqueness and append number if needed
        WHILE EXISTS (SELECT 1 FROM articles WHERE slug = final_slug AND id != NEW.id) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;

        NEW.slug := final_slug;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply slug generation trigger
CREATE TRIGGER generate_article_slug_trigger
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Articles policies
CREATE POLICY "Anyone can read published articles" ON articles
    FOR SELECT USING (status = 'published' OR auth.uid()::text = author_id::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'author')));

CREATE POLICY "Authors can insert articles" ON articles
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'author')));

CREATE POLICY "Authors can update their own articles" ON articles
    FOR UPDATE USING (auth.uid()::text = author_id::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'))
    WITH CHECK (auth.uid()::text = author_id::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admins can delete articles" ON articles
    FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Categories policies
CREATE POLICY "Anyone can read categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Tags policies
CREATE POLICY "Anyone can read tags" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Authors can create tags" ON tags
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'author')));

-- Comments policies
CREATE POLICY "Anyone can read visible comments" ON comments
    FOR SELECT USING (status = 'visible' OR user_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid()::text = user_id::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid()::text = user_id::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Bookmarks policies
CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Reading_list policies
CREATE POLICY "Users can manage their own reading list" ON reading_list
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Activity_logs policies
CREATE POLICY "Admins can read activity logs" ON activity_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Revisions policies
CREATE POLICY "Authors can read revisions of their articles" ON revisions
    FOR SELECT USING (EXISTS (SELECT 1 FROM articles WHERE id = revisions.article_id AND author_id::text = auth.uid()::text) OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Sessions policies
CREATE POLICY "Users can manage their own sessions" ON sessions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- STORAGE BUCKET SETUP (Run this in Supabase Storage section)
-- ============================================================================

-- Create a storage bucket for uploads
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Storage policies
-- CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
-- CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update their own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = owner::text);
-- CREATE POLICY "Users can delete their own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = owner::text);

-- ============================================================================
-- SEED DATA (Optional - Create first admin user)
-- ============================================================================

-- Insert a default admin user (password: Admin@123)
-- Note: This is bcrypt hash for "Admin@123" with 10 rounds
INSERT INTO users (name, email, password_hash, role, email_verified)
VALUES (
    'Admin User',
    'admin@contenthub.com',
    '$2b$10$XQlZ7K9FZN0gJ8rJ5XjGZ.F6XKZwJPbJhL5XVL6CYLQgLCjE8Mzxy',
    'admin',
    true
);

-- Insert some default categories
INSERT INTO categories (name, slug, description) VALUES
    ('World News', 'world-news', 'International news and global events'),
    ('Technology', 'technology', 'Tech news, gadgets, and innovation'),
    ('Business', 'business', 'Business news, finance, and economy'),
    ('Health', 'health', 'Health, wellness, and medical news'),
    ('Science', 'science', 'Scientific discoveries and research'),
    ('Sports', 'sports', 'Sports news and updates'),
    ('Culture', 'culture', 'Arts, entertainment, and culture'),
    ('Politics', 'politics', 'Political news and analysis');

-- Create some subcategories
INSERT INTO categories (name, slug, description, parent_category_id) VALUES
    ('Artificial Intelligence', 'artificial-intelligence', 'AI and machine learning', (SELECT id FROM categories WHERE slug = 'technology')),
    ('Hardware', 'hardware', 'Computer hardware and gadgets', (SELECT id FROM categories WHERE slug = 'technology')),
    ('Elections', 'elections', 'Election news and coverage', (SELECT id FROM categories WHERE slug = 'politics'));
