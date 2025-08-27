# Slack Knowledge Bot

社内ナレッジ管理とSlackボットによる質問応答システム

## 機能

- **ナレッジ管理**: ナレッジの登録・管理
- **Slack連携**: Slackでの質問応答（`/ask`コマンド）
- **AI回答生成**: OpenAI APIによる自動回答生成
- **ベクトル検索**: 関連ナレッジの高精度検索
- **ユーザー認証**: 法人単位でのアカウント管理
- **メール認証**: セキュアなアカウント確認システム

## セットアップ

### 1. 環境変数の設定

`env.example`をコピーして`.env`ファイルを作成し、以下の値を設定してください：

```bash
cp env.example .env
```

#### 必要な環境変数：

- `OPENAI_API_KEY`: OpenAI APIキー
- `SLACK_SIGNING_SECRET`: Slackアプリのサイニングシークレット
- `SLACK_BOT_TOKEN`: SlackボットのOAuthトークン
- `SLACK_APP_TOKEN`: SlackアプリのApp Levelトークン

### 2. Docker起動

```bash
docker compose up --build
```

### 3. Slackアプリの設定

1. Slack App Dashboardで新しいアプリを作成
2. Slash Commandsを設定：
   - Command: `/ask`
   - Request URL: `https://your-ngrok-url.ngrok.app/slack/commands`
3. 必要な権限とトークンを設定

## 使用方法

### Slackコマンド

- `/ask 質問内容` - ナレッジベースから回答を検索
- `/register-knowledge タイトル|内容` - ナレッジを登録

### Web UI

- http://localhost:3000 でナレッジの管理が可能

## 認証機能

このアプリケーションには法人単位でのユーザー認証機能が含まれています。

### 認証の流れ

1. **新規登録**: http://localhost:3000/register
   - 法人名、代表者名、ユーザー名、メールアドレス、パスワードを入力
   - 登録後、確認メールが送信されます

2. **メール認証**: 
   - 送信されたメール内のリンクをクリック
   - MailDev (http://localhost:1080) でメールを確認できます

3. **ログイン**: http://localhost:3000/login
   - ユーザー名とパスワードでログイン
   - JWTトークンがHttpOnly Cookieで保存されます

### 認証API

- `POST /api/auth/register` - 新規登録
- `GET /api/auth/verify-email?token=...` - メール認証
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 認証状態確認

### セキュリティ注意事項

⚠️ **本番環境では必ず以下を設定してください**:
- HTTPS環境でのSecure Cookie有効化
- 強固なJWT_SECRETの設定
- 適切なSMTP設定
- レート制限の実装

### 将来のSlack OAuth拡張

現在の認証システムは、将来のSlack OAuth連携に対応できるよう設計されています：
- `organizations`テーブルにSlackワークスペース情報を紐付け
- `users`テーブルにSlackユーザーIDを追加予定

## 技術スタック

- **Backend**: Go, PostgreSQL, pgvector
- **Frontend**: Next.js, React
- **AI**: OpenAI API (GPT-4, text-embedding-3-small)
- **Infrastructure**: Docker, Docker Compose
# Force Vercel redeploy
