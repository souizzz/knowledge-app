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

async function fixProductionData() {
  try {
    console.log('🔧 本番環境Supabaseでデータの整合性を修正中...');
    console.log('📡 接続先:', supabaseUrl);
    
    // 1. 認証ユーザーの確認
    console.log('\n👤 認証ユーザーの確認:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ 認証ユーザーの取得に失敗:', authError);
      return;
    }
    
    const testUser = authUsers.users.find(user => user.email === 'test@gmail.com');
    if (!testUser) {
      console.error('❌ test@gmail.comの認証ユーザーが見つかりません');
      return;
    }
    
    console.log('✅ 認証ユーザー:', testUser.id, testUser.email);
    
    // 2. 組織の確認と選択
    console.log('\n📋 組織の確認:');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'テスト');
    
    if (orgError) {
      console.error('❌ 組織の取得に失敗:', orgError);
      return;
    }
    
    if (orgs.length === 0) {
      console.error('❌ 「テスト」組織が見つかりません');
      return;
    }
    
    // 最新の組織を使用
    const targetOrg = orgs[orgs.length - 1];
    console.log('✅ 使用する組織:', targetOrg.id, targetOrg.name);
    
    // 3. カスタムusersテーブルの確認
    console.log('\n👥 カスタムusersテーブルの確認:');
    const { data: existingUsers, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@gmail.com');
    
    if (userError) {
      console.error('❌ カスタムユーザーの取得に失敗:', userError);
      return;
    }
    
    if (existingUsers.length > 0) {
      console.log('ℹ️ 既存のユーザーレコード:', existingUsers.length, '件');
      
      // 既存レコードを削除
      for (const user of existingUsers) {
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        
        if (deleteError) {
          console.error('❌ ユーザーレコードの削除に失敗:', deleteError);
        } else {
          console.log('✅ ユーザーレコードを削除:', user.id);
        }
      }
    }
    
    // 4. 新しいユーザーレコードを作成
    console.log('\n📝 新しいユーザーレコードを作成中...');
    
    // テーブルスキーマを確認
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ テーブルスキーマの確認に失敗:', tableError);
      console.log('💡 テーブルが存在しないか、権限がありません');
      return;
    }
    
    // ユーザーレコードを挿入
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: testUser.id,
          org_id: targetOrg.id,
          username: '太郎',
          email: 'test@gmail.com',
          password_hash: 'supabase_auth',
          email_verified: true,
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ ユーザーレコードの挿入に失敗:', insertError);
      
      // エラーの詳細を確認
      if (insertError.message.includes('bigint')) {
        console.log('💡 問題: IDフィールドの型がbigintになっています');
        console.log('💡 解決策: SupabaseのスキーマをUUIDに更新する必要があります');
      }
      
      return;
    }
    
    console.log('✅ ユーザーレコードを作成しました:', newUser.id);
    
    // 5. 最終確認
    console.log('\n🔍 最終確認:');
    const { data: finalCheck, error: finalError } = await supabase
      .from('users')
      .select(`
        *,
        organizations (
          id,
          name
        )
      `)
      .eq('id', testUser.id)
      .single();
    
    if (finalError) {
      console.error('❌ 最終確認に失敗:', finalError);
    } else {
      console.log('✅ データ整合性が確認されました:');
      console.log('  - ユーザーID:', finalCheck.id);
      console.log('  - ユーザー名:', finalCheck.username);
      console.log('  - メールアドレス:', finalCheck.email);
      console.log('  - 組織ID:', finalCheck.org_id);
      console.log('  - 組織名:', finalCheck.organizations?.name);
      console.log('  - 役割:', finalCheck.role);
    }
    
    console.log('\n🎉 データ整合性の修正が完了しました！');
    console.log('📝 次のステップ:');
    console.log('1. デプロイされたアプリでログインをテスト');
    console.log('2. 設定ボタンでユーザー情報が表示されることを確認');
    console.log('\n🔗 デプロイされたアプリ:', 'https://frontend-gtmucisc9-souihatanakas-projects.vercel.app');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

// スクリプトを実行
fixProductionData();
