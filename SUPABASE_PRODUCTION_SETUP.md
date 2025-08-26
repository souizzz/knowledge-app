# 🗄️ Supabase本番環境設定手順

## 📋 前提条件

- Supabaseアカウント
- ドメイン名（オプション）

## 🔧 設定手順

### **Step 1: Supabaseプロジェクト作成**

1. **Supabaseダッシュボードにアクセス**
   ```
   https://supabase.com/dashboard
   ```

2. **「New Project」をクリック**

3. **プロジェクト設定**
   - **Name**: `slack-bot`
   - **Database Password**: 強力なパスワードを設定
   - **Region**: 最寄りのリージョンを選択（例: Asia Pacific (Tokyo)）

4. **「Create new project」をクリック**

### **Step 2: データベーススキーマの適用**

1. **SQL Editorにアクセス**
   - 左サイドバー > SQL Editor

2. **以下のSQLを実行**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Create organizations table
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create users table
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

-- Create invitations table
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

-- Create knowledge table
CREATE TABLE knowledge (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_knowledge_user_id ON knowledge(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified for now)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Invitations are viewable by token" ON invitations
    FOR SELECT USING (true);

CREATE POLICY "Knowledge is viewable by all" ON knowledge
    FOR SELECT USING (true);

-- Insert default organization
INSERT INTO organizations (name) VALUES ('Default Organization');
```

### **Step 3: API設定値を取得**

1. **Settings > API にアクセス**

2. **以下の値をコピー**
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Step 4: 認証設定**

1. **Authentication > Settings にアクセス**

2. **Site URL設定**
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: `https://your-domain.vercel.app/auth/callback`

3. **Email設定**
   - **Enable email confirmations**: オフ（開発中）
   - **Enable email change confirmations**: オフ

### **Step 5: ストレージ設定（オプション）**

1. **Storage > Policies にアクセス**

2. **バケットポリシーを設定**
   - 必要に応じてファイルアップロード機能を有効化

## 🔄 ローカルから本番への移行

### **データベースの移行**

```bash
# ローカルデータを本番に移行（必要に応じて）
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### **環境変数の更新**

Vercelダッシュボードで環境変数を本番用に更新：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

## 🛠️ トラブルシューティング

### **接続エラー**
- プロジェクトURLとキーが正しいか確認
- リージョンが正しく設定されているか確認

### **RLSポリシーエラー**
- SQL Editorでポリシーを確認
- 必要に応じてポリシーを調整

### **認証エラー**
- Site URLとRedirect URLsが正しく設定されているか確認
- ブラウザのコンソールでエラーを確認

## 📊 監視設定

### **Supabaseダッシュボード**
- **Database**: クエリパフォーマンスを監視
- **Auth**: ユーザー認証ログを確認
- **Storage**: ファイルアップロード状況を確認

### **ログ確認**
- **Logs**: リアルタイムログを確認
- **API**: API呼び出し状況を監視

## 🎉 完了

これでSupabase本番環境の設定が完了します！

### **確認事項**
- ✅ データベーススキーマが適用されている
- ✅ API設定値が取得できている
- ✅ 認証設定が完了している
- ✅ Vercelの環境変数が更新されている
