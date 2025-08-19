# 認証API テストガイド

## cURLコマンド例

### 1. 新規登録

```bash
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "テスト株式会社",
    "representative_name": "山田太郎",
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. ログイン

```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. 認証状態確認

```bash
curl -X GET http://localhost:8081/auth/me \
  -b cookies.txt
```

### 4. メール認証

```bash
curl -X GET "http://localhost:8081/auth/verify-email?token=YOUR_TOKEN_HERE"
```

### 5. ヘルスチェック

```bash
curl -X GET http://localhost:8081/healthz
```

## レスポンス例

### 登録成功
```json
{
  "status": "ok"
}
```

### ログイン成功
```json
{
  "status": "ok"
}
```

### 認証情報取得
```json
{
  "sub": "1",
  "org_id": 1,
  "role": "member",
  "username": "testuser",
  "iat": 1640995200,
  "exp": 1640996100
}
```

### エラーレスポンス
```json
{
  "error": "invalid_credentials"
}
```

## フロントエンド経由のテスト

### 1. 新規登録
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "テスト株式会社",
    "representative_name": "山田太郎",
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "password123"
  }'
```

### 2. ログイン
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c frontend_cookies.txt \
  -d '{
    "username": "testuser2",
    "password": "password123"
  }'
```

### 3. 認証状態確認
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b frontend_cookies.txt
```

## 開発ツール

### MailDev でメール確認
- http://localhost:1080 にアクセス
- 送信されたメール認証リンクを確認

### データベース直接接続
```bash
psql postgres://user:password@localhost:5432/slackbot
```

### よく使うSQL
```sql
-- ユーザー一覧
SELECT u.*, o.name as org_name FROM users u 
JOIN organizations o ON u.org_id = o.id;

-- 認証トークン確認
SELECT * FROM email_verification_tokens ORDER BY created_at DESC;

-- メール認証済みユーザー
SELECT username, email, email_verified FROM users WHERE email_verified = true;
```
