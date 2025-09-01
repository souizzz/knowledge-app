# 本番環境環境変数設定ガイド

## 必要な環境変数

### 1. データベース設定
```bash
DB_USER=slackbot_user
DB_PASSWORD=your_secure_password_here
DB_NAME=slackbot
```

### 2. フロントエンド・バックエンドURL
```bash
FRONTEND_URL=https://sales-develop.com
BACKEND_URL=https://api.sales-develop.com
NEXT_PUBLIC_FRONTEND_URL=https://sales-develop.com
NEXT_PUBLIC_BASE_URL=https://sales-develop.com
```

### 3. OpenAI設定
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Slack設定
```bash
SLACK_SIGNING_SECRET=your_slack_signing_secret_here
SLACK_BOT_TOKEN=your_slack_bot_token_here
SLACK_APP_TOKEN=your_slack_app_token_here
```

### 5. JWT設定
```bash
JWT_SECRET=LADF/MmchpqdOW5+6KsxUM3+YPRwt/1Idrzbq6sDBu4=
```

### 6. メール設定（Resend）
```bash
RESEND_API_KEY=your_resend_api_key_here
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your_resend_api_key_here
MAIL_FROM=Knowledge App <noreply@sales-develop.com>
```

### 7. SSL証明書設定
```bash
SSL_CERT_ID=cert_GNM51rP3tjeArOYVwqVhc8vY
```

### 8. Supabase設定（使用する場合）
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## デプロイ手順

### Vercelでのデプロイ
1. Vercelダッシュボードでプロジェクトを作成
2. カスタムドメイン `sales-develop.com` を追加
3. SSL証明書 `cert_GNM51rP3tjeArOYVwqVhc8vY` を設定
4. 上記の環境変数をVercelの環境変数設定に追加

### Dockerでのデプロイ
1. `env.production.example` を `.env` にコピー
2. 実際の値を設定
3. `docker-compose -f docker-compose.prod.yml up -d` でデプロイ

## 注意事項
- 本番環境では必ず強力なパスワードとAPIキーを使用してください
- JWT_SECRETは本番環境で変更することを推奨します
- データベースのパスワードは安全に管理してください
