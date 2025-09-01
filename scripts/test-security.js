#!/usr/bin/env node

/**
 * セキュリティテストスクリプト
 * 
 * このスクリプトは、アプリケーションのセキュリティ設定をテストします。
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config();

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

// HTTPリクエストを送信
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// セキュリティヘッダーのテスト
async function testSecurityHeaders(baseUrl) {
  console.log('🛡️ セキュリティヘッダーのテスト...\n');
  
  try {
    const response = await makeRequest(baseUrl);
    const headers = response.headers;
    
    // 必須セキュリティヘッダーのチェック
    const requiredHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'strict-origin-when-cross-origin'
    };
    
    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = headers[header];
      logTest(
        `セキュリティヘッダー: ${header}`,
        actualValue === expectedValue,
        actualValue ? `設定済み (${actualValue})` : '未設定'
      );
    }
    
    // Content Security Policyのチェック
    const csp = headers['content-security-policy'];
    logTest(
      'Content Security Policy',
      !!csp,
      csp ? '設定済み' : '未設定'
    );
    
    // HSTSのチェック（本番環境のみ）
    const hsts = headers['strict-transport-security'];
    if (process.env.NODE_ENV === 'production') {
      logTest(
        'HSTS (本番環境)',
        !!hsts,
        hsts ? '設定済み' : '未設定'
      );
    } else {
      logTest(
        'HSTS (開発環境)',
        true,
        '開発環境では不要'
      );
    }
    
  } catch (error) {
    logTest('セキュリティヘッダー', false, error.message);
  }
}

// CORS設定のテスト
async function testCORS(baseUrl) {
  console.log('🌐 CORS設定のテスト...\n');
  
  try {
    // 許可されたオリジンでのテスト
    const allowedOrigin = 'http://localhost:3000';
    const response = await makeRequest(baseUrl, {
      headers: { 'Origin': allowedOrigin }
    });
    
    const corsOrigin = response.headers['access-control-allow-origin'];
    logTest(
      'CORS: 許可されたオリジン',
      corsOrigin === allowedOrigin,
      corsOrigin ? `設定済み (${corsOrigin})` : '未設定'
    );
    
    // 許可されていないオリジンでのテスト
    const disallowedOrigin = 'https://malicious-site.com';
    const response2 = await makeRequest(baseUrl, {
      headers: { 'Origin': disallowedOrigin }
    });
    
    const corsOrigin2 = response2.headers['access-control-allow-origin'];
    logTest(
      'CORS: 許可されていないオリジン',
      corsOrigin2 !== disallowedOrigin,
      corsOrigin2 ? `拒否済み (${corsOrigin2})` : '拒否済み'
    );
    
  } catch (error) {
    logTest('CORS設定', false, error.message);
  }
}

// レート制限のテスト
async function testRateLimit(baseUrl) {
  console.log('⏱️ レート制限のテスト...\n');
  
  try {
    const requests = [];
    const requestCount = 10;
    
    // 複数のリクエストを同時に送信
    for (let i = 0; i < requestCount; i++) {
      requests.push(makeRequest(`${baseUrl}/api/knowledge`));
    }
    
    const responses = await Promise.allSettled(requests);
    const rateLimitedResponses = responses.filter(
      result => result.status === 'fulfilled' && result.value.statusCode === 429
    );
    
    logTest(
      'レート制限',
      rateLimitedResponses.length > 0,
      `${rateLimitedResponses.length}/${requestCount} のリクエストがレート制限されました`
    );
    
  } catch (error) {
    logTest('レート制限', false, error.message);
  }
}

// 認証のテスト
async function testAuthentication(baseUrl) {
  console.log('🔐 認証のテスト...\n');
  
  try {
    // 保護されたエンドポイントへのアクセステスト
    const response = await makeRequest(`${baseUrl}/api/admin/users`);
    
    logTest(
      '認証: 保護されたエンドポイント',
      response.statusCode === 401 || response.statusCode === 403,
      `ステータス: ${response.statusCode}`
    );
    
    // 無効なトークンでのテスト
    const response2 = await makeRequest(`${baseUrl}/api/admin/users`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    
    logTest(
      '認証: 無効なトークン',
      response2.statusCode === 401 || response2.statusCode === 403,
      `ステータス: ${response2.statusCode}`
    );
    
  } catch (error) {
    logTest('認証', false, error.message);
  }
}

// 入力検証のテスト
async function testInputValidation(baseUrl) {
  console.log('📝 入力検証のテスト...\n');
  
  try {
    // SQLインジェクション攻撃のテスト
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await makeRequest(`${baseUrl}/api/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: maliciousInput, content: maliciousInput })
    });
    
    logTest(
      '入力検証: SQLインジェクション',
      response.statusCode === 400 || response.statusCode === 422,
      `ステータス: ${response.statusCode}`
    );
    
    // XSS攻撃のテスト
    const xssInput = "<script>alert('XSS')</script>";
    const response2 = await makeRequest(`${baseUrl}/api/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: xssInput, content: xssInput })
    });
    
    logTest(
      '入力検証: XSS',
      response2.statusCode === 400 || response2.statusCode === 422,
      `ステータス: ${response2.statusCode}`
    );
    
  } catch (error) {
    logTest('入力検証', false, error.message);
  }
}

// 環境変数のテスト
function testEnvironmentVariables() {
  console.log('🔧 環境変数のテスト...\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    logTest(
      `環境変数: ${varName}`,
      !!value,
      value ? '設定済み' : '未設定'
    );
  }
  
  // JWT秘密鍵の強度チェック
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    logTest(
      'JWT秘密鍵の強度',
      jwtSecret.length >= 32 && jwtSecret !== 'please_change_me',
      jwtSecret.length >= 32 ? '強力' : '弱い'
    );
  }
}

// メイン実行関数
async function runSecurityTests() {
  console.log('🔒 セキュリティテストを開始します...\n');
  
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  console.log(`🌐 テスト対象URL: ${baseUrl}\n`);
  
  // 各テストを実行
  await testSecurityHeaders(baseUrl);
  await testCORS(baseUrl);
  await testRateLimit(baseUrl);
  await testAuthentication(baseUrl);
  await testInputValidation(baseUrl);
  testEnvironmentVariables();
  
  // テスト結果の表示
  console.log('\n📊 セキュリティテスト結果:');
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
  
  console.log('\n🎉 セキュリティテスト完了！');
  
  if (testResults.failed === 0) {
    console.log('🎊 すべてのセキュリティテストが成功しました！');
    process.exit(0);
  } else {
    console.log('⚠️  一部のセキュリティテストが失敗しました。設定を確認してください。');
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  runSecurityTests();
}

module.exports = { runSecurityTests };
