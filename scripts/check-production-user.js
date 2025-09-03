const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 本番環境のSupabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 本番環境の環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProductionUser() {
  try {
    console.log('🔍 本番環境Supabaseでユーザー情報を確認中...');
    console.log('📡 接続先:', supabaseUrl);
    
    // 1. 認証ユーザーの確認
    console.log('\n👤 認証ユーザーの確認:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ 認証ユーザーの取得に失敗:', authError);
      return;
    }
    
    const testUser = authUsers.users.find(user => user.email === 'test@gmail.com');
    if (testUser) {
      console.log('✅ 認証ユーザーが見つかりました:');
      console.log('  - ID:', testUser.id);
      console.log('  - Email:', testUser.email);
      console.log('  - Email Confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('  - Created:', testUser.created_at);
    } else {
      console.log('❌ test@gmail.comの認証ユーザーが見つかりません');
    }
    
    // 2. 組織の確認
    console.log('\n📋 組織の確認:');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgError) {
      console.error('❌ 組織の取得に失敗:', orgError);
    } else {
      console.log('✅ 組織一覧:');
      orgs.forEach(org => {
        console.log(`  - ID: ${org.id}, Name: ${org.name}, Created: ${org.created_at}`);
      });
    }
    
    // 3. カスタムユーザーテーブルの確認
    console.log('\n👥 カスタムユーザーテーブルの確認:');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');
    
    if (userError) {
      console.error('❌ カスタムユーザーの取得に失敗:', userError);
    } else {
      console.log('✅ カスタムユーザー一覧:');
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
      });
    }
    
    // 4. テーブルスキーマの確認
    console.log('\n🏗️ テーブルスキーマの確認:');
    const { data: schema, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'users' });
    
    if (schemaError) {
      console.log('ℹ️ スキーマ情報の取得に失敗（通常の動作）:', schemaError.message);
    } else {
      console.log('✅ スキーマ情報:', schema);
    }
    
    console.log('\n📝 次のステップ:');
    console.log('1. 本番環境のSupabaseダッシュボードでユーザーを確認');
    console.log('2. 必要に応じて手動でユーザー情報を更新');
    console.log('3. デプロイされたアプリでログインをテスト');
    console.log('\n🔗 デプロイされたアプリ:', 'https://frontend-gtmucisc9-souihatanakas-projects.vercel.app');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

// スクリプトを実行
checkProductionUser();
