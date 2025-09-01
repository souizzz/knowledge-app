#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 フロントエンドアプリケーションのデプロイを開始します...\n');

// 環境変数の確認
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('📋 環境変数の確認...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ 環境変数 ${envVar} が設定されていません`);
    process.exit(1);
  }
  console.log(`✅ ${envVar}: 設定済み`);
}

// Vercel CLIの確認
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI: インストール済み');
} catch (error) {
  console.log('📦 Vercel CLIをインストール中...');
  execSync('npm install -g vercel', { stdio: 'inherit' });
}

// フロントエンドディレクトリに移動
const frontendDir = path.join(__dirname, '..', 'frontend');
process.chdir(frontendDir);

// .vercelignoreファイルの作成
const vercelIgnoreContent = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production
.next/
out/

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
`;

fs.writeFileSync('.vercelignore', vercelIgnoreContent);
console.log('✅ .vercelignoreファイルを作成しました');

// Vercelプロジェクトの設定
const vercelJson = {
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelJson, null, 2));
console.log('✅ vercel.jsonファイルを作成しました');

// Vercelにログイン
console.log('\n🔐 Vercelにログイン中...');
try {
  execSync('vercel login', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Vercelログインに失敗しました');
  process.exit(1);
}

// デプロイの実行
console.log('\n🚀 デプロイを実行中...');
try {
  const deployOutput = execSync('vercel --prod', { 
    stdio: 'pipe',
    encoding: 'utf8'
  });
  
  console.log('✅ デプロイが完了しました！');
  console.log('\n📋 デプロイ結果:');
  console.log(deployOutput);
  
  // デプロイURLの抽出
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
  if (urlMatch) {
    console.log(`\n🌐 アプリケーションURL: ${urlMatch[0]}`);
    console.log(`\n📧 メール認証のテスト: ${urlMatch[0]}/login`);
  }
  
} catch (error) {
  console.error('❌ デプロイに失敗しました:', error.message);
  process.exit(1);
}

console.log('\n🎉 フロントエンドアプリケーションのデプロイが完了しました！');
console.log('\n📋 次のステップ:');
console.log('1. デプロイされたURLでアプリケーションにアクセス');
console.log('2. メール認証機能をテスト');
console.log('3. 実際のメールアドレスで認証を確認');
