#!/bin/bash

echo "🔧 Setting up environment variables..."

# .env.productionファイルを作成
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production file..."
    cp env.production.example .env.production
    echo "✅ .env.production file created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.production and update the following values:"
    echo "   - FRONTEND_URL: Your actual domain"
    echo "   - BACKEND_URL: Your actual API domain"
    echo "   - DB_PASSWORD: Your secure database password"
    echo "   - OPENAI_API_KEY: Your OpenAI API key"
    echo "   - SLACK_SIGNING_SECRET: Your Slack signing secret"
    echo "   - SLACK_BOT_TOKEN: Your Slack bot token"
    echo "   - SLACK_APP_TOKEN: Your Slack app token"
    echo "   - SMTP_USER: Your email address"
    echo "   - SMTP_PASSWORD: Your email app password"
    echo ""
    echo "🔐 JWT_SECRET has been automatically set to a secure random value."
else
    echo "✅ .env.production file already exists!"
fi

echo ""
echo "🚀 Ready for deployment!"
echo "   Run './deploy.sh' to deploy to production."
