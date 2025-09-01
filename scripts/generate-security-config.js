#!/usr/bin/env node

/**
 * セキュリティ設定生成スクリプト
 * 
 * このスクリプトは、安全なJWT秘密鍵やその他のセキュリティ設定を生成します。
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 安全なランダム文字列を生成
function generateSecureString(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// 強力なJWT秘密鍵を生成
function generateJWTSecret() {
  return generateSecureString(64); // 512ビット
}

// データベースパスワードを生成
function generateDatabasePassword() {
  return generateSecureString(32); // 256ビット
}

// セキュリティ設定を生成
function generateSecurityConfig() {
  console.log('🔐 セキュリティ設定を生成しています...\n');
  
  const config = {
    jwtSecret: generateJWTSecret(),
    databasePassword: generateDatabasePassword(),
    slackSigningSecret: 'xoxb-your-slack-signing-secret-here', // 実際の値に置き換え
    openaiApiKey: 'sk-your-openai-api-key-here', // 実際の値に置き換え
    resendApiKey: 're_your-resend-api-key-here', // 実際の値に置き換え
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://sales-develop.com',
      'https://your-domain.vercel.app' // 実際のドメインに置き換え
    ]
  };
  
  return config;
}

// 環境変数ファイルを生成
function generateEnvFiles(config) {
  console.log('📝 環境変数ファイルを生成しています...\n');
  
  // 本番環境用
  const productionEnv = `# Production Environment Variables
# Database Configuration
DB_USER=slackbot_user
DB_PASSWORD=${config.databasePassword}
DB_NAME=slackbot

# Frontend Configuration
FRONTEND_URL=https://sales-develop.com
BACKEND_URL=https://api.sales-develop.com

# OpenAI Configuration
OPENAI_API_KEY=${config.openaiApiKey}

# Slack Configuration
SLACK_SIGNING_SECRET=${config.slackSigningSecret}
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
SLACK_APP_TOKEN=xapp-your-slack-app-token-here

# JWT Configuration (強力な秘密鍵)
JWT_SECRET=${config.jwtSecret}

# Email Configuration (Resend)
RESEND_API_KEY=${config.resendApiKey}
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=${config.resendApiKey}
MAIL_FROM=Knowledge App <noreply@sales-develop.com>

# SSL Configuration
SSL_CERT_ID=your-ssl-cert-id-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Security Configuration
ENVIRONMENT=production
ALLOWED_ORIGINS=${config.allowedOrigins.join(',')}
`;

  // 開発環境用
  const developmentEnv = `# Development Environment Variables
# Database Configuration
DB_USER=user
DB_PASSWORD=password
DB_NAME=slackbot

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080

# OpenAI Configuration
OPENAI_API_KEY=${config.openaiApiKey}

# Slack Configuration
SLACK_SIGNING_SECRET=${config.slackSigningSecret}
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
SLACK_APP_TOKEN=xapp-your-slack-app-token-here

# JWT Configuration (強力な秘密鍵)
JWT_SECRET=${config.jwtSecret}

# Email Configuration (Resend)
RESEND_API_KEY=${config.resendApiKey}
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=${config.resendApiKey}
MAIL_FROM=Knowledge App <noreply@local.test>

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Security Configuration
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
`;

  // Vercel用
  const vercelEnv = `# Vercel Environment Variables
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Frontend Configuration
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app

# OpenAI Configuration
OPENAI_API_KEY=${config.openaiApiKey}

# Slack Configuration
SLACK_SIGNING_SECRET=${config.slackSigningSecret}
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
SLACK_APP_TOKEN=xapp-your-slack-app-token-here

# JWT Configuration
JWT_SECRET=${config.jwtSecret}

# Email Configuration (Resend)
RESEND_API_KEY=${config.resendApiKey}
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=${config.resendApiKey}
MAIL_FROM=Knowledge App <noreply@your-domain.com>

# Security Configuration
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-domain.vercel.app
`;

  // ファイルを保存
  fs.writeFileSync('.env.production.secure', productionEnv);
  fs.writeFileSync('.env.development.secure', developmentEnv);
  fs.writeFileSync('.env.vercel.secure', vercelEnv);
  
  console.log('✅ 環境変数ファイルが生成されました:');
  console.log('   - .env.production.secure');
  console.log('   - .env.development.secure');
  console.log('   - .env.vercel.secure');
}

// セキュリティ設定の検証
function validateSecurityConfig(config) {
  console.log('🔍 セキュリティ設定を検証しています...\n');
  
  const issues = [];
  
  // JWT秘密鍵の検証
  if (config.jwtSecret.length < 64) {
    issues.push('JWT秘密鍵が短すぎます（64文字以上推奨）');
  }
  
  // データベースパスワードの検証
  if (config.databasePassword.length < 32) {
    issues.push('データベースパスワードが短すぎます（32文字以上推奨）');
  }
  
  // 環境の検証
  if (config.environment === 'production') {
    if (config.allowedOrigins.some(origin => origin.includes('localhost'))) {
      issues.push('本番環境でlocalhostが許可されています');
    }
  }
  
  if (issues.length > 0) {
    console.log('⚠️  以下の問題が見つかりました:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ セキュリティ設定は適切です');
  }
  
  return issues.length === 0;
}

// セキュリティチェックリストを表示
function displaySecurityChecklist() {
  console.log('\n📋 セキュリティチェックリスト:');
  console.log('');
  console.log('🔐 認証・認可:');
  console.log('   [ ] 強力なJWT秘密鍵を設定');
  console.log('   [ ] セッション管理を適切に実装');
  console.log('   [ ] 認証トークンの有効期限を設定');
  console.log('   [ ] ログアウト機能を実装');
  console.log('');
  console.log('🌐 ネットワークセキュリティ:');
  console.log('   [ ] HTTPSを強制（本番環境）');
  console.log('   [ ] CORS設定を適切に構成');
  console.log('   [ ] セキュリティヘッダーを設定');
  console.log('   [ ] レート制限を実装');
  console.log('');
  console.log('🛡️ データ保護:');
  console.log('   [ ] 機密データの暗号化');
  console.log('   [ ] ログから機密情報を除外');
  console.log('   [ ] 入力値の検証・サニタイズ');
  console.log('   [ ] SQLインジェクション対策');
  console.log('');
  console.log('📊 監視・ログ:');
  console.log('   [ ] セキュリティイベントのログ');
  console.log('   [ ] 異常なアクセスの監視');
  console.log('   [ ] エラーログの管理');
  console.log('   [ ] パフォーマンス監視');
  console.log('');
  console.log('🔄 運用セキュリティ:');
  console.log('   [ ] 定期的なセキュリティ更新');
  console.log('   [ ] 依存関係の脆弱性チェック');
  console.log('   [ ] バックアップの暗号化');
  console.log('   [ ] アクセス制御の見直し');
}

// メイン実行
function main() {
  console.log('🚀 セキュリティ設定生成ツール\n');
  
  try {
    // セキュリティ設定を生成
    const config = generateSecurityConfig();
    
    // 設定を検証
    const isValid = validateSecurityConfig(config);
    
    if (isValid) {
      // 環境変数ファイルを生成
      generateEnvFiles(config);
      
      // セキュリティチェックリストを表示
      displaySecurityChecklist();
      
      console.log('\n🎉 セキュリティ設定の生成が完了しました！');
      console.log('\n📝 次のステップ:');
      console.log('1. 生成された環境変数ファイルを確認');
      console.log('2. 実際のAPIキーやトークンに置き換え');
      console.log('3. 本番環境にデプロイ');
      console.log('4. セキュリティチェックリストを確認');
      
    } else {
      console.log('\n❌ セキュリティ設定に問題があります。修正してから再実行してください。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  main();
}

module.exports = { generateSecurityConfig, validateSecurityConfig };
