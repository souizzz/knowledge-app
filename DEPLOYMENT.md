# 🚀 本番環境デプロイ手順

## 📋 前提条件

- Docker & Docker Compose がインストール済み
- ドメイン名を取得済み
- SSL証明書を準備済み（Let's Encrypt推奨）

## 🔧 デプロイ手順

### 1. 環境変数の設定

```bash
# 環境変数サンプルファイルをコピー
cp env.production.example .env.production

# 環境変数を編集
nano .env.production
```

**必須設定項目:**
- `FRONTEND_URL`: フロントエンドのドメイン（例: https://your-domain.com）
- `BACKEND_URL`: バックエンドのドメイン（例: https://api.your-domain.com）
- `DB_PASSWORD`: データベースの強力なパスワード
- `OPENAI_API_KEY`: OpenAI APIキー
- `SLACK_SIGNING_SECRET`: Slackアプリの署名シークレット
- `SLACK_BOT_TOKEN`: Slackボットトークン
- `SLACK_APP_TOKEN`: Slackアプリトークン
- `JWT_SECRET`: JWT署名用の強力なシークレット

### 2. SSL証明書の準備

#### Let's Encryptを使用する場合:
```bash
# Certbotで証明書を取得
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 証明書をnginx/sslディレクトリにコピー
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*
```

#### 自己署名証明書（テスト用）:
```bash
# デプロイスクリプトが自動で生成します
```

### 3. Nginx設定の更新

`nginx/nginx.conf`の`server_name`を実際のドメインに変更:

```nginx
server_name your-domain.com www.your-domain.com;
```

### 4. デプロイ実行

```bash
# デプロイスクリプトを実行
./deploy.sh
```

### 5. 動作確認

```bash
# フロントエンド
curl -I https://your-domain.com

# バックエンドAPI
curl -I https://your-domain.com/api/health

# コンテナ状態確認
docker-compose -f docker-compose.prod.yml ps
```

## 🔄 更新手順

```bash
# コードを更新後
git pull origin main

# 再デプロイ
./deploy.sh
```

## 🛠️ トラブルシューティング

### ログの確認
```bash
# 全サービスのログ
docker-compose -f docker-compose.prod.yml logs

# 特定サービスのログ
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs nginx
```

### データベースのバックアップ
```bash
# バックアップ
docker-compose -f docker-compose.prod.yml exec db pg_dump -U slackbot_user slackbot > backup.sql

# リストア
docker-compose -f docker-compose.prod.yml exec -T db psql -U slackbot_user slackbot < backup.sql
```

### コンテナの再起動
```bash
# 特定サービスの再起動
docker-compose -f docker-compose.prod.yml restart backend

# 全サービスの再起動
docker-compose -f docker-compose.prod.yml restart
```

## 🔒 セキュリティ設定

### ファイアウォール設定
```bash
# UFWの設定例
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 定期的な更新
```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# Dockerイメージ更新
docker-compose -f docker-compose.prod.yml pull
./deploy.sh
```

## 📊 監視設定

### ヘルスチェック
```bash
# 定期的なヘルスチェック
*/5 * * * * curl -f https://your-domain.com/api/health || echo "Backend down" | mail -s "Alert" admin@your-domain.com
```

### ログローテーション
```bash
# Dockerログのローテーション設定
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```
