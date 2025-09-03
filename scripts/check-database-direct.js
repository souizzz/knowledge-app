const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase環境変数が設定されていません');
  console.log('URL:', supabaseUrl);
  console.log('Key exists:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 データベースの直接確認...');
  
  // 認証ユーザー一覧（管理者権限が必要）
  console.log('👤 認証ユーザー一覧:');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.log('  ❌ 認証ユーザー取得エラー:', authError.message);
  } else {
    authUsers.users.forEach(user => {
      console.log('  - ID:', user.id);
      console.log('  - Email:', user.email);
      console.log('  - Created:', user.created_at);
      console.log('  ---');
    });
  }
  
  // usersテーブルの全データ確認
  console.log('📋 usersテーブルの全データ:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');
    
  if (usersError) {
    console.log('  ❌ usersテーブルエラー:', usersError);
  } else {
    users.forEach(user => {
      console.log('  - ID:', user.id);
      console.log('  - Username:', user.username);
      console.log('  - Email:', user.email);
      console.log('  - Auth ID:', user.auth_id);
      console.log('  - Org ID:', user.org_id);
      console.log('  ---');
    });
  }
  
  // organizationsテーブルの確認
  console.log('🏢 organizationsテーブルの全データ:');
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*');
    
  if (orgsError) {
    console.log('  ❌ organizationsテーブルエラー:', orgsError);
  } else {
    orgs.forEach(org => {
      console.log('  - ID:', org.id);
      console.log('  - Name:', org.name);
      console.log('  - Created:', org.created_at);
      console.log('  ---');
    });
  }
  
  // 特定の認証IDで検索テスト
  const testAuthId = 'd20cd2a3-af68-469c-9255-899a378084fc';
  console.log('🔍 認証IDでの検索テスト:', testAuthId);
  const { data: userByAuthId, error: searchError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', testAuthId)
    .single();
    
  if (searchError) {
    console.log('  ❌ エラー:', searchError.message);
  } else if (userByAuthId) {
    console.log('  ✅ 見つかりました:', userByAuthId);
  } else {
    console.log('  ❌ データが見つかりません');
  }
}

checkDatabase().catch(console.error);
