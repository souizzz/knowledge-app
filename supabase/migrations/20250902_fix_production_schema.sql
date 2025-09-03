-- Fix production schema for Supabase Auth compatibility
-- 2025-09-02

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 既存データのバックアップ
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS organizations_backup AS SELECT * FROM organizations;

-- 2. 新しいUUID対応テーブルを作成
CREATE TABLE IF NOT EXISTS organizations_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    representative_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users_new (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations_new(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. インデックスを作成
CREATE INDEX IF NOT EXISTS idx_users_email ON users_new(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users_new(org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations_new(name);

-- 4. RLSを有効化
ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations_new ENABLE ROW LEVEL SECURITY;

-- 5. ポリシーを作成
CREATE POLICY "Users can view their own data" ON users_new
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Organizations are viewable by all" ON organizations_new
    FOR SELECT USING (true);

-- 6. 既存データを移行（組織）
INSERT INTO organizations_new (id, name, representative_name, created_at)
SELECT 
    gen_random_uuid(),
    name,
    'テスト太郎' as representative_name,
    created_at
FROM organizations_backup
WHERE name = 'テスト';

-- 7. 既存データを移行（ユーザー）
-- 認証ユーザーのIDを使用
INSERT INTO users_new (id, org_id, username, email, password_hash, email_verified, role, created_at, updated_at)
SELECT 
    'd20cd2a3-af68-469c-9255-899a378084fc'::UUID,
    (SELECT id FROM organizations_new WHERE name = 'テスト'),
    '太郎',
    'test@gmail.com',
    'supabase_auth',
    true,
    'owner',
    NOW(),
    NOW();

-- 8. 古いテーブルを削除
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 9. 新しいテーブルに名前を変更
ALTER TABLE organizations_new RENAME TO organizations;
ALTER TABLE users_new RENAME TO users;

-- 10. 最終確認用のクエリ
-- SELECT 'Migration completed successfully' as status;
-- SELECT * FROM organizations;
-- SELECT * FROM users;
