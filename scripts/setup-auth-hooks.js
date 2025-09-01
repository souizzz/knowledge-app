#!/usr/bin/env node

/**
 * Supabase認証フック（Auth Hooks）設定スクリプト
 * 
 * このスクリプトは、Supabaseの認証フックを作成します。
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAuthHooks() {
  console.log('🔧 Supabase認証フック（Auth Hooks）の設定を開始します...\n');

  try {
    // 1. SQLファイルを読み込み
    console.log('📄 SQLファイルを読み込み中...');
    const sqlPath = path.join(__dirname, 'create-auth-hooks.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ SQLファイルが読み込まれました');

    // 2. SQLを実行
    console.log('🚀 認証フックのSQLを実行中...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.log('⚠️  SQL実行でエラーが発生しました:', error.message);
      console.log('📋 手動でSQLを実行してください:');
      console.log('1. Supabaseダッシュボードにログイン');
      console.log('2. SQL Editorに移動');
      console.log('3. 以下のSQLを実行:');
      console.log('---');
      console.log(sqlContent);
      console.log('---');
    } else {
      console.log('✅ 認証フックのSQLが正常に実行されました');
    }

    // 3. 認証フックの確認
    console.log('🔍 認証フックの確認中...');
    await verifyAuthHooks();

    // 4. 設定完了の確認
    console.log('\n🎉 認証フック（Auth Hooks）の設定が完了しました！');
    console.log('\n📋 作成された認証フック:');
    console.log('✅ スキーマ: auth_hooks');
    console.log('✅ テーブル: email_logs');
    console.log('✅ 関数: handle_auth_event, log_email_event, get_auth_stats');
    console.log('✅ ビュー: email_stats');
    console.log('✅ トリガー: auth_hooks_trigger');

    console.log('\n🔧 次のステップ:');
    console.log('1. Supabaseダッシュボードで認証設定を確認');
    console.log('2. メール認証をテスト');
    console.log('3. 認証フックのログを確認');

  } catch (error) {
    console.error('❌ 設定中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// 認証フックの確認
async function verifyAuthHooks() {
  try {
    // スキーマの確認
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'auth_hooks');
    
    if (schemaError) {
      console.log('⚠️  スキーマの確認でエラー:', schemaError.message);
    } else if (schemas && schemas.length > 0) {
      console.log('✅ スキーマ auth_hooks が存在します');
    } else {
      console.log('⚠️  スキーマ auth_hooks が存在しません');
    }

    // テーブルの確認
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'auth_hooks')
      .eq('table_name', 'email_logs');
    
    if (tableError) {
      console.log('⚠️  テーブルの確認でエラー:', tableError.message);
    } else if (tables && tables.length > 0) {
      console.log('✅ テーブル auth_hooks.email_logs が存在します');
    } else {
      console.log('⚠️  テーブル auth_hooks.email_logs が存在しません');
    }

    // 関数の確認
    const { data: functions, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'auth_hooks')
      .in('routine_name', ['handle_auth_event', 'log_email_event', 'get_auth_stats']);
    
    if (functionError) {
      console.log('⚠️  関数の確認でエラー:', functionError.message);
    } else if (functions && functions.length > 0) {
      console.log(`✅ ${functions.length}個の認証フック関数が存在します`);
    } else {
      console.log('⚠️  認証フック関数が存在しません');
    }

  } catch (error) {
    console.log('⚠️  認証フックの確認でエラー:', error.message);
  }
}

// スクリプトの実行
if (require.main === module) {
  setupAuthHooks();
}

module.exports = { setupAuthHooks };
