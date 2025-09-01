#!/usr/bin/env node

/**
 * メール監視テストスクリプト
 * 
 * このスクリプトは、メール送信の監視機能をテストします。
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

// 環境変数の確認
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
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
const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseKey);

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

// メールイベントテーブルのテスト
async function testEmailEventsTable() {
  console.log('🗄️ メールイベントテーブルのテスト...\n');
  
  try {
    // テーブルの存在確認
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'email_events');
    
    logTest(
      'email_eventsテーブルの存在',
      !tableError && tables && tables.length > 0,
      tableError ? tableError.message : 'テーブルが存在します'
    );
    
    // サンプルデータの挿入テスト
    const testEvent = {
      event_type: 'test_email_sent',
      email: 'test@example.com',
      subject: 'テストメール',
      status: 'sent',
      metadata: { test: true }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('email_events')
      .insert(testEvent)
      .select();
    
    logTest(
      'メールイベントの挿入',
      !insertError && insertData && insertData.length > 0,
      insertError ? insertError.message : 'イベントが正常に挿入されました'
    );
    
    // データの取得テスト
    if (insertData && insertData.length > 0) {
      const eventId = insertData[0].id;
      
      const { data: fetchData, error: fetchError } = await supabase
        .from('email_events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      logTest(
        'メールイベントの取得',
        !fetchError && fetchData,
        fetchError ? fetchError.message : 'イベントが正常に取得されました'
      );
      
      // テストデータの削除
      await supabase
        .from('email_events')
        .delete()
        .eq('id', eventId);
    }
    
  } catch (error) {
    logTest('メールイベントテーブル', false, error.message);
  }
}

// メールメトリクステーブルのテスト
async function testEmailMetricsTable() {
  console.log('📊 メールメトリクステーブルのテスト...\n');
  
  try {
    // テーブルの存在確認
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'email_metrics');
    
    logTest(
      'email_metricsテーブルの存在',
      !tableError && tables && tables.length > 0,
      tableError ? tableError.message : 'テーブルが存在します'
    );
    
    // メトリクスデータの挿入テスト
    const testMetrics = {
      date: new Date().toISOString().split('T')[0],
      total_sent: 10,
      total_failed: 1,
      success_rate: 90.91
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('email_metrics')
      .upsert(testMetrics)
      .select();
    
    logTest(
      'メールメトリクスの挿入',
      !insertError && insertData && insertData.length > 0,
      insertError ? insertError.message : 'メトリクスが正常に挿入されました'
    );
    
  } catch (error) {
    logTest('メールメトリクステーブル', false, error.message);
  }
}

// メール監視関数のテスト
async function testEmailMonitoringFunctions() {
  console.log('🔧 メール監視関数のテスト...\n');
  
  try {
    // log_email_event関数のテスト
    const { data: logData, error: logError } = await supabase
      .rpc('log_email_event', {
        p_event_type: 'test_function',
        p_email: 'test@example.com',
        p_subject: 'テスト関数',
        p_status: 'sent',
        p_metadata: { test: true }
      });
    
    logTest(
      'log_email_event関数',
      !logError && logData,
      logError ? logError.message : '関数が正常に実行されました'
    );
    
    // update_email_metrics関数のテスト
    const { data: metricsData, error: metricsError } = await supabase
      .rpc('update_email_metrics');
    
    logTest(
      'update_email_metrics関数',
      !metricsError,
      metricsError ? metricsError.message : '関数が正常に実行されました'
    );
    
    // get_email_stats関数のテスト
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_email_stats', { p_days: 7 });
    
    logTest(
      'get_email_stats関数',
      !statsError && Array.isArray(statsData),
      statsError ? statsError.message : '統計データが正常に取得されました'
    );
    
  } catch (error) {
    logTest('メール監視関数', false, error.message);
  }
}

// メール監視ビューのテスト
async function testEmailMonitoringViews() {
  console.log('👁️ メール監視ビューのテスト...\n');
  
  try {
    // email_summaryビューのテスト
    const { data: summaryData, error: summaryError } = await supabase
      .from('email_summary')
      .select('*')
      .limit(5);
    
    logTest(
      'email_summaryビュー',
      !summaryError && Array.isArray(summaryData),
      summaryError ? summaryError.message : 'サマリーデータが正常に取得されました'
    );
    
    // email_domain_statsビューのテスト
    const { data: domainData, error: domainError } = await supabase
      .from('email_domain_stats')
      .select('*')
      .limit(5);
    
    logTest(
      'email_domain_statsビュー',
      !domainError && Array.isArray(domainData),
      domainError ? domainError.message : 'ドメイン統計が正常に取得されました'
    );
    
    // email_error_statsビューのテスト
    const { data: errorData, error: errorError } = await supabase
      .from('email_error_stats')
      .select('*')
      .limit(5);
    
    logTest(
      'email_error_statsビュー',
      !errorError && Array.isArray(errorData),
      errorError ? errorError.message : 'エラー統計が正常に取得されました'
    );
    
  } catch (error) {
    logTest('メール監視ビュー', false, error.message);
  }
}

// フロントエンド監視ダッシュボードのテスト
async function testFrontendDashboard() {
  console.log('🌐 フロントエンド監視ダッシュボードのテスト...\n');
  
  try {
    // 監視ダッシュボードAPIのテスト
    const response = await fetch(`${frontendUrl}/api/monitoring/dashboard`);
    
    logTest(
      '監視ダッシュボードAPI',
      response.ok,
      response.ok ? 'APIが正常に応答しました' : `HTTP ${response.status}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      logTest(
        'ダッシュボードデータ構造',
        data.success && data.data && data.data.metrics,
        'データ構造が正しいです'
      );
      
      logTest(
        'メトリクスデータ',
        data.data.metrics && typeof data.data.metrics.total_sent === 'number',
        'メトリクスデータが正しい形式です'
      );
    }
    
  } catch (error) {
    logTest('フロントエンド監視ダッシュボード', false, error.message);
  }
}

// メール送信の統合テスト
async function testEmailSendingIntegration() {
  console.log('📧 メール送信の統合テスト...\n');
  
  try {
    // テスト用のメール送信
    const testEmail = 'test@example.com';
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${frontendUrl}/auth/callback`
      }
    });
    
    logTest(
      'メール送信の統合',
      !error,
      error ? error.message : 'メール送信が正常に実行されました'
    );
    
    if (!error) {
      // 少し待ってからイベントを確認
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 最新のイベントを確認
      const { data: events, error: eventsError } = await supabase
        .from('email_events')
        .select('*')
        .eq('email', testEmail)
        .order('timestamp', { ascending: false })
        .limit(1);
      
      logTest(
        'メール送信イベントの記録',
        !eventsError && events && events.length > 0,
        eventsError ? eventsError.message : 'イベントが正常に記録されました'
      );
    }
    
  } catch (error) {
    logTest('メール送信の統合', false, error.message);
  }
}

// メイン実行関数
async function runEmailMonitoringTests() {
  console.log('🧪 メール監視機能のテストを開始します...\n');
  
  await testEmailEventsTable();
  await testEmailMetricsTable();
  await testEmailMonitoringFunctions();
  await testEmailMonitoringViews();
  await testFrontendDashboard();
  await testEmailSendingIntegration();
  
  // テスト結果の表示
  console.log('\n📊 メール監視テスト結果:');
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
  
  console.log('\n🎉 メール監視テスト完了！');
  
  if (testResults.failed === 0) {
    console.log('🎊 すべてのメール監視テストが成功しました！');
    process.exit(0);
  } else {
    console.log('⚠️  一部のメール監視テストが失敗しました。設定を確認してください。');
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  runEmailMonitoringTests();
}

module.exports = { runEmailMonitoringTests };
