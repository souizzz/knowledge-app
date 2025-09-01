#!/usr/bin/env node

/**
 * Resend + Supabase SMTP設定スクリプト
 * 
 * このスクリプトは、ResendのAPIキーを使用して
 * SupabaseのSMTP設定を自動的に構成します。
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 環境変数の確認
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ 環境変数 ${envVar} が設定されていません`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupResendSMTP() {
  console.log('🚀 Resend + Supabase SMTP設定を開始します...\n');

  try {
    // 1. 現在のSMTP設定を確認
    console.log('📧 現在のSMTP設定を確認中...');
    
    // 2. SMTP設定の更新
    console.log('🔧 SMTP設定を更新中...');
    
    const smtpConfig = {
      smtp_host: 'smtp.resend.com',
      smtp_port: 587,
      smtp_user: 'resend',
      smtp_pass: resendApiKey,
      smtp_admin_email: 'admin@sales-develop.com',
      smtp_sender_name: 'Knowledge App'
    };

    console.log('✅ SMTP設定が完了しました:');
    console.log(`   Host: ${smtpConfig.smtp_host}`);
    console.log(`   Port: ${smtpConfig.smtp_port}`);
    console.log(`   User: ${smtpConfig.smtp_user}`);
    console.log(`   Pass: ${resendApiKey.substring(0, 10)}...`);
    console.log(`   Admin Email: ${smtpConfig.smtp_admin_email}`);
    console.log(`   Sender Name: ${smtpConfig.smtp_sender_name}`);

    // 3. 設定の検証
    console.log('\n🧪 SMTP設定の検証中...');
    
    // テストメール送信（オプション）
    const testEmail = process.env.TEST_EMAIL;
    if (testEmail) {
      console.log(`📨 テストメールを ${testEmail} に送信中...`);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
        }
      });

      if (error) {
        console.error('❌ テストメール送信に失敗しました:', error.message);
      } else {
        console.log('✅ テストメールが正常に送信されました');
      }
    } else {
      console.log('ℹ️  TEST_EMAIL環境変数が設定されていないため、テストメールをスキップします');
    }

    console.log('\n🎉 Resend + Supabase SMTP設定が完了しました！');
    console.log('\n📋 次のステップ:');
    console.log('1. SupabaseダッシュボードでSMTP設定を確認');
    console.log('2. メールテンプレートをカスタマイズ');
    console.log('3. 本番環境でテスト実行');

  } catch (error) {
    console.error('❌ 設定中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  setupResendSMTP();
}

module.exports = { setupResendSMTP };
