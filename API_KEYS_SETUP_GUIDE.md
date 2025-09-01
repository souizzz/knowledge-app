# APIキー・パスワード設定ガイド

## 必要なAPIキーとパスワード一覧

### 1. データベース設定
```bash
DB_USER=slackbot_user
DB_PASSWORD=【強力なパスワードを生成】  # 例: MyStr0ng!P@ssw0rd2024
DB_NAME=slackbot
```

### 2. OpenAI API
```bash
OPENAI_API_KEY=【OpenAI APIキー】  # 例: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**取得方法**: https://platform.openai.com/api-keys でアカウント作成後、APIキーを生成

### 3. Slack設定
```bash
SLACK_SIGNING_SECRET=【Slackアプリの署名シークレット】  # 例: xoxb-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SLACK_BOT_TOKEN=【Slackボットトークン】  # 例: xoxb-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SLACK_APP_TOKEN=【Slackアプリトークン】  # 例: xapp-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**取得方法**: https://api.slack.com/apps でSlackアプリを作成し、各トークンを取得

### 4. JWT設定
```bash
JWT_SECRET=【ランダムな文字列】  # 例: MyJWTSecret2024!@#$%^&*()_+{}|:<>?[]\;',./~`
```
**生成方法**: 64文字以上のランダムな文字列を生成（オンラインツール使用可）

### 5. メール設定（Resend）
```bash
RESEND_API_KEY=【Resend APIキー】  # 例: re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=【Resend APIキーと同じ】
MAIL_FROM=Knowledge App <noreply@sales-develop.com>
```
**取得方法**: https://resend.com/api-keys でアカウント作成後、APIキーを生成

### 6. Supabase設定（使用する場合）
```bash
NEXT_PUBLIC_SUPABASE_URL=【SupabaseプロジェクトURL】  # 例: https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=【Supabase匿名キー】  # 例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=【Supabaseサービスロールキー】  # 例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**取得方法**: https://supabase.com/dashboard でプロジェクト作成後、設定から各キーを取得

### 7. SSL証明書（既に設定済み）
```bash
SSL_CERT_ID=cert_GNM51rP3tjeArOYVwqVhc8vY
```

## 設定手順

### 1. ローカル環境での設定
```bash
# env.production.exampleをコピー
cp env.production.example .env.production

# 実際の値を設定
nano .env.production  # またはお好みのエディタ
```

### 2. Vercelでの設定
1. Vercelダッシュボードにログイン
2. プロジェクトの「Settings」→「Environment Variables」に移動
3. 上記の各環境変数を追加

### 3. サーバーでの設定（Docker使用時）
```bash
# 環境変数ファイルを作成
cp env.production.example .env

# 実際の値を設定
nano .env

# Docker Composeで起動
docker-compose -f docker-compose.prod.yml up -d
```

## セキュリティ注意事項

- **絶対にGitにコミットしない**: `.env` ファイルは `.gitignore` に追加
- **強力なパスワードを使用**: データベースパスワードは複雑な文字列を使用
- **APIキーを定期的にローテーション**: セキュリティ向上のため
- **本番環境では異なるJWT_SECRETを使用**: 開発環境と分離

## トラブルシューティング

### よくある問題
1. **APIキーが無効**: 各サービスのダッシュボードでキーの有効性を確認
2. **権限不足**: Slackアプリの権限設定を確認
3. **ドメイン設定**: sales-develop.comのDNS設定を確認
4. **SSL証明書**: Vercelで証明書の状態を確認
