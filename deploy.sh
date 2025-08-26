#!/bin/bash

# デプロイスクリプト
set -e

echo "🚀 Starting deployment..."

# 環境変数ファイルの確認
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "Please copy env.production.example to .env.production and configure it."
    exit 1
fi

# 環境変数を読み込み
source .env.production

# ドメイン名の確認
if [ "$FRONTEND_URL" = "https://your-domain.com" ]; then
    echo "❌ Please update FRONTEND_URL in .env.production"
    exit 1
fi

# SSL証明書の確認
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    echo "⚠️  SSL certificates not found. Using self-signed certificates for testing..."
    mkdir -p nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=JP/ST=Tokyo/L=Tokyo/O=SlackBot/CN=localhost"
fi

# 既存のコンテナを停止
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# イメージをビルド
echo "🔨 Building images..."
docker-compose -f docker-compose.prod.yml build

# コンテナを起動
echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# ヘルスチェック
echo "🏥 Checking health..."
sleep 30

# バックエンドのヘルスチェック
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# フロントエンドのヘルスチェック
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend API: $BACKEND_URL"
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps
