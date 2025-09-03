const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabaseクライアントの作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('🚀 テストユーザーの作成を開始します...');
    
    // 1. 組織の作成（存在しない場合）
    console.log('📋 組織を作成中...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([
        { 
          name: 'テスト',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (orgError && !orgError.message.includes('duplicate key')) {
      console.error('❌ 組織の作成に失敗:', orgError);
      return;
    }

    let organizationId;
    if (orgData) {
      organizationId = orgData.id;
      console.log('✅ 組織を作成しました:', orgData.name, '(ID:', organizationId, ')');
    } else {
      // 既存の組織を取得
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('name', 'テスト')
        .single();
      
      if (existingOrg) {
        organizationId = existingOrg.id;
        console.log('✅ 既存の組織を使用:', existingOrg.name, '(ID:', organizationId, ')');
      } else {
        console.error('❌ 組織の取得に失敗');
        return;
      }
    }

    // 2. Supabase認証でユーザーを作成
    console.log('👤 Supabase認証でユーザーを作成中...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@gmail.com',
      password: 'test0123',
      email_confirm: true,
      user_metadata: {
        username: '太郎',
        organization: 'テスト'
      }
    });

    if (authError) {
      console.error('❌ Supabase認証でのユーザー作成に失敗:', authError);
      return;
    }

    const userId = authData.user.id;
    console.log('✅ Supabase認証でユーザーを作成しました:', userId);

    // 3. カスタムusersテーブルにユーザー情報を挿入
    console.log('📝 カスタムusersテーブルにユーザー情報を挿入中...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          org_id: organizationId,
          username: '太郎',
          email: 'test@gmail.com',
          password_hash: 'supabase_auth', // Supabase認証を使用
          email_verified: true,
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      if (userError.message.includes('duplicate key')) {
        console.log('ℹ️ ユーザーは既に存在します');
        
        // 既存ユーザーの情報を更新
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            org_id: organizationId,
            username: '太郎',
            role: 'owner',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ ユーザー情報の更新に失敗:', updateError);
          return;
        }
        
        console.log('✅ ユーザー情報を更新しました');
      } else {
        console.error('❌ ユーザー情報の挿入に失敗:', userError);
        return;
      }
    } else {
      console.log('✅ ユーザー情報を挿入しました');
    }

    console.log('\n🎉 テストユーザーの作成が完了しました！');
    console.log('📋 組織情報:');
    console.log('  - 法人名: テスト');
    console.log('  - 代表者名: テスト太郎');
    console.log('  - ユーザー名: 太郎');
    console.log('  - メールアドレス: test@gmail.com');
    console.log('  - パスワード: test0123');
    console.log('\n🔗 ログインURL: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

// スクリプトを実行
createTestUser();
