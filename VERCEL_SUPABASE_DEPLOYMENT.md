# 🚀 Vercel + Supabase デプロイ手順

## 📋 前提条件

- GitHubアカウント
- Vercelアカウント
- Supabaseアカウント
- ドメイン名（オプション）

## 🔧 デプロイ手順

### **Phase 1: Supabase設定**

#### 1. Supabaseプロジェクト作成
```bash
# Supabaseダッシュボードで新しいプロジェクトを作成
# https://supabase.com/dashboard
```

#### 2. データベーススキーマ作成
```sql
-- Supabase SQL Editorで実行

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- 組織テーブル
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ユーザーテーブル
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 招待テーブル
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER','MEMBER')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    inviter_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ナレッジテーブル
CREATE TABLE knowledge (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_knowledge_user_id ON knowledge(user_id);

-- RLS (Row Level Security) 設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Invitations are viewable by token" ON invitations
    FOR SELECT USING (true);

CREATE POLICY "Knowledge is viewable by organization" ON knowledge
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = knowledge.user_id 
            AND users.org_id = (
                SELECT org_id FROM users WHERE id = auth.uid()::bigint
            )
        )
    );
```

#### 3. Supabase設定値を取得
```bash
# Supabaseダッシュボード > Settings > API
# 以下の値をコピー:
# - Project URL
# - anon public key
# - service_role key
```

### **Phase 2: Vercel設定**

#### 1. Vercelプロジェクト作成
```bash
# Vercelダッシュボードで新しいプロジェクトを作成
# GitHubリポジトリを連携
```

#### 2. 環境変数設定
```bash
# Vercelダッシュボード > Settings > Environment Variables
# 以下の環境変数を追加:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.vercel.app
OPENAI_API_KEY=your_openai_api_key
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_APP_TOKEN=your_slack_app_token
JWT_SECRET=LADF/MmchpqdOW5+6KsxUM3+YPRwt/1Idrzbq6sDBu4=
```

#### 3. デプロイ設定
```bash
# Vercelダッシュボード > Settings > General
# Build Command: npm run build
# Output Directory: .next
# Install Command: npm install
```

### **Phase 3: ドメイン設定（オプション）**

#### 1. カスタムドメイン追加
```bash
# Vercelダッシュボード > Settings > Domains
# カスタムドメインを追加
```

#### 2. DNS設定
```bash
# ドメインプロバイダーでDNSレコードを設定
# Type: CNAME
# Name: @
# Value: cname.vercel-dns.com
```

### **Phase 4: Slack設定更新**

#### 1. Slackアプリ設定
```bash
# Slack App設定で以下を更新:
# - Request URL: https://your-domain.vercel.app/api/slack/events
# - Redirect URLs: https://your-domain.vercel.app/api/slack/oauth/callback
```

## 🔄 更新手順

### **コード更新時**
```bash
# GitHubにプッシュすると自動デプロイ
git add .
git commit -m "Update code"
git push origin main
```

### **環境変数更新時**
```bash
# Vercelダッシュボード > Settings > Environment Variables
# 値を更新後、再デプロイ
```

## 🛠️ トラブルシューティング

### **よくある問題**

#### 1. ビルドエラー
```bash
# Vercelダッシュボード > Deployments > 最新デプロイ > Functions
# ログを確認
```

#### 2. データベース接続エラー
```bash
# Supabaseダッシュボード > Settings > Database
# 接続文字列を確認
```

#### 3. 環境変数エラー
```bash
# Vercelダッシュボード > Settings > Environment Variables
# 全ての環境変数が設定されているか確認
```

### **ログ確認**
```bash
# Vercelダッシュボード > Deployments > 最新デプロイ
# Functions タブでログを確認
```

## 📊 監視設定

### **Vercel Analytics**
```bash
# Vercelダッシュボード > Analytics
# パフォーマンスとエラーを監視
```

### **Supabase Monitoring**
```bash
# Supabaseダッシュボード > Settings > Monitoring
# データベースパフォーマンスを監視
```

## 💰 コスト

### **Vercel**
- **Hobby**: 無料（月100GB転送、100GBストレージ）
- **Pro**: $20/月（1TB転送、1TBストレージ）

### **Supabase**
- **Free**: 無料（500MBデータベース、2GB転送）
- **Pro**: $25/月（8GBデータベース、250GB転送）

## 🎉 完了

これでVercel + Supabaseでのデプロイが完了します！

### **確認事項**
- ✅ フロントエンドがVercelで動作
- ✅ データベースがSupabaseで動作
- ✅ APIがVercel Functionsで動作
- ✅ 環境変数が正しく設定
- ✅ Slack連携が動作
