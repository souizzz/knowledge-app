# Slack Knowledge Bot

社内ナレッジ管理とSlackボットによる質問応答システム

## 機能

- ナレッジの登録・管理
- Slackでの質問応答（`/ask`コマンド）
- OpenAI APIによる自動回答生成
- ベクトル検索による関連ナレッジ検索

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

## 技術スタック

- **Backend**: Go, PostgreSQL, pgvector
- **Frontend**: Next.js, React
- **AI**: OpenAI API (GPT-4, text-embedding-3-small)
- **Infrastructure**: Docker, Docker Compose
