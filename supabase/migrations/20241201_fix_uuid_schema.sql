-- Fix UUID schema for Supabase Auth compatibility
-- 2024-12-01

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, create new tables with UUID structure
CREATE TABLE IF NOT EXISTS organizations_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    representative_name TEXT,
    owner_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations_new(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_new (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users_new(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invitations_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER','MEMBER')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    inviter_id UUID REFERENCES users_new(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations_new(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations_new(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users_new(email);
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON knowledge_new(user_id);
CREATE INDEX IF NOT EXISTS idx_users_id_uuid ON users_new(id);
CREATE INDEX IF NOT EXISTS idx_organizations_id_uuid ON organizations_new(id);
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id_uuid ON knowledge_new(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_new ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON users_new
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Invitations are viewable by token" ON invitations_new
    FOR SELECT USING (true);

CREATE POLICY "Knowledge is viewable by all" ON knowledge_new
    FOR SELECT USING (true);

-- Insert default organization
INSERT INTO organizations_new (name, representative_name) VALUES ('Default Organization', 'Default User');

-- Drop old tables and rename new ones
DROP TABLE IF EXISTS knowledge CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

ALTER TABLE organizations_new RENAME TO organizations;
ALTER TABLE users_new RENAME TO users;
ALTER TABLE knowledge_new RENAME TO knowledge;
ALTER TABLE invitations_new RENAME TO invitations;
