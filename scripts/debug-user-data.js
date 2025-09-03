const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 データベースの詳細確認...');
  
  // 認証ユーザーの確認
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser.user) {
    console.log('❌ 認証ユーザーが見つかりません');
    return;
  }
  
  console.log('👤 認証ユーザー:');
  console.log('  - ID:', authUser.user.id);
  console.log('  - Email:', authUser.user.email);
  
  // usersテーブルの全データ確認
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');
    
  if (usersError) {
    console.log('❌ usersテーブルエラー:', usersError);
    return;
  }
  
  console.log('📋 usersテーブルの全データ:');
  users.forEach(user => {
    console.log('  - ID:', user.id);
    console.log('  - Username:', user.username);
    console.log('  - Email:', user.email);
    console.log('  - Auth ID:', user.auth_id);
    console.log('  - Org ID:', user.org_id);
    console.log('  ---');
  });
  
  // 認証IDで検索テスト
  const { data: userByAuthId, error: searchError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.user.id)
    .single();
    
  console.log('🔍 認証IDでの検索結果:');
  if (searchError) {
    console.log('  ❌ エラー:', searchError.message);
  } else if (userByAuthId) {
    console.log('  ✅ 見つかりました:', userByAuthId);
  } else {
    console.log('  ❌ データが見つかりません');
  }
}

checkData().catch(console.error);
