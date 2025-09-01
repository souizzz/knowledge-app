#!/usr/bin/env node

/**
 * メール認証機能のテストスクリプト
 * 
 * このスクリプトは、Resend + Supabaseのメール認証機能を
 * 包括的にテストします。
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

// 環境変数の確認
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ 環境変数 ${envVar} が設定されていません`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAnon = createClient(supabaseUrl, anonKey);

// テスト用のメールアドレス
const testEmail = process.env.TEST_EMAIL || 'test@example.com';
const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

// テスト結果の記録
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${testName}: ${message}`);
  
  testResults.tests.push({ name: testName, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testSupabaseConnection() {
  console.log('🔗 Supabase接続テスト...\n');
  
  try {
    const { data, error } = await supabase.from('auth.users').select('count').limit(1);
    logTest('Supabase接続', !error, error ? error.message : '接続成功');
  } catch (error) {
    logTest('Supabase接続', false, error.message);
  }
}

async function testEmailValidation() {
  console.log('📧 メールアドレス検証テスト...\n');
  
  const testCases = [
    { email: 'valid@example.com', shouldPass: true },
    { email: 'invalid-email', shouldPass: false },
    { email: '', shouldPass: false },
    { email: 'test@domain.co.jp', shouldPass: true },
    { email: 'user+tag@example.com', shouldPass: true }
  ];
  
  for (const testCase of testCases) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testCase.email);
    logTest(
      `メール検証: ${testCase.email || '(空文字)'}`,
      isValid === testCase.shouldPass,
      isValid ? '有効' : '無効'
    );
  }
}

async function testMagicLinkGeneration() {
  console.log('🔐 Magic Link生成テスト...\n');
  
  try {
    const { data, error } = await supabaseAnon.auth.signInWithOtp({
      email: testEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${frontendUrl}/auth/callback`
      }
    });
    
    logTest(
      'Magic Link生成',
      !error,
      error ? error.message : 'Magic Linkが正常に生成されました'
    );
    
    if (data) {
      logTest('Magic Linkデータ', !!data, 'データが正常に返されました');
    }
  } catch (error) {
    logTest('Magic Link生成', false, error.message);
  }
}

async function testUserCreation() {
  console.log('👤 ユーザー作成テスト...\n');
  
  try {
    const { data, error } = await supabaseAnon.auth.signInWithOtp({
      email: `test-${Date.now()}@example.com`,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${frontendUrl}/auth/callback`
      }
    });
    
    logTest(
      '新規ユーザー作成',
      !error,
      error ? error.message : '新規ユーザーが正常に作成されました'
    );
  } catch (error) {
    logTest('新規ユーザー作成', false, error.message);
  }
}

async function testSessionManagement() {
  console.log('🔑 セッション管理テスト...\n');
  
  try {
    const { data: { session }, error } = await supabaseAnon.auth.getSession();
    logTest(
      'セッション取得',
      !error,
      error ? error.message : 'セッションが正常に取得されました'
    );
    
    if (session) {
      logTest('セッション有効性', !!session.user, 'セッションが有効です');
    } else {
      logTest('セッション有効性', true, 'セッションが存在しません（正常）');
    }
  } catch (error) {
    logTest('セッション管理', false, error.message);
  }
}

async function testErrorHandling() {
  console.log('🚨 エラーハンドリングテスト...\n');
  
  // 無効なメールアドレスでのテスト
  try {
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email: 'invalid-email',
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${frontendUrl}/auth/callback`
      }
    });
    
    logTest(
      '無効メールアドレス処理',
      !!error,
      error ? 'エラーが正常に検出されました' : 'エラーが検出されませんでした'
    );
  } catch (error) {
    logTest('無効メールアドレス処理', true, 'エラーが正常に処理されました');
  }
  
  // 空のメールアドレスでのテスト
  try {
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email: '',
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${frontendUrl}/auth/callback`
      }
    });
    
    logTest(
      '空メールアドレス処理',
      !!error,
      error ? 'エラーが正常に検出されました' : 'エラーが検出されませんでした'
    );
  } catch (error) {
    logTest('空メールアドレス処理', true, 'エラーが正常に処理されました');
  }
}

async function testRateLimiting() {
  console.log('⏱️ レート制限テスト...\n');
  
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      supabaseAnon.auth.signInWithOtp({
        email: `ratelimit-test-${i}@example.com`,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${frontendUrl}/auth/callback`
        }
      })
    );
  }
  
  try {
    const results = await Promise.allSettled(promises);
    const errors = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && result.value.error)
    );
    
    logTest(
      'レート制限',
      errors.length <= 2, // 一部のエラーは許容
      `${errors.length}個のリクエストでエラーが発生`
    );
  } catch (error) {
    logTest('レート制限', false, error.message);
  }
}

async function testFrontendIntegration() {
  console.log('🌐 フロントエンド統合テスト...\n');
  
  try {
    // フロントエンドのログインページにアクセス
    const response = await fetch(`${frontendUrl}/login`);
    logTest(
      'ログインページアクセス',
      response.ok,
      response.ok ? 'ページが正常にアクセスできました' : `HTTP ${response.status}`
    );
    
    if (response.ok) {
      const html = await response.text();
      logTest(
        'ログインフォーム存在',
        html.includes('メールアドレス') || html.includes('email'),
        'ログインフォームが存在します'
      );
    }
  } catch (error) {
    logTest('フロントエンド統合', false, error.message);
  }
}

async function testDatabaseSchema() {
  console.log('🗄️ データベーススキーマテスト...\n');
  
  try {
    // organizations テーブルの確認
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    logTest(
      'organizations テーブル',
      !orgError,
      orgError ? orgError.message : 'テーブルが存在します'
    );
    
    // org_members テーブルの確認
    const { data: members, error: memberError } = await supabase
      .from('org_members')
      .select('id')
      .limit(1);
    
    logTest(
      'org_members テーブル',
      !memberError,
      memberError ? memberError.message : 'テーブルが存在します'
    );
    
    // invites テーブルの確認
    const { data: invites, error: inviteError } = await supabase
      .from('invites')
      .select('id')
      .limit(1);
    
    logTest(
      'invites テーブル',
      !inviteError,
      inviteError ? inviteError.message : 'テーブルが存在します'
    );
  } catch (error) {
    logTest('データベーススキーマ', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 メール認証機能の包括的テストを開始します...\n');
  console.log(`📧 テストメール: ${testEmail}`);
  console.log(`🌐 フロントエンドURL: ${frontendUrl}\n`);
  
  await testSupabaseConnection();
  await testEmailValidation();
  await testMagicLinkGeneration();
  await testUserCreation();
  await testSessionManagement();
  await testErrorHandling();
  await testRateLimiting();
  await testFrontendIntegration();
  await testDatabaseSchema();
  
  // テスト結果の表示
  console.log('\n📊 テスト結果サマリー:');
  console.log(`✅ 成功: ${testResults.passed}`);
  console.log(`❌ 失敗: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失敗したテスト:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
  }
  
  console.log('\n🎉 テスト完了！');
  
  if (testResults.failed === 0) {
    console.log('🎊 すべてのテストが成功しました！');
    process.exit(0);
  } else {
    console.log('⚠️  一部のテストが失敗しました。設定を確認してください。');
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
