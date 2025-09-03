const { createClient } = require('@supabase/supabase-js');

// ローカルSupabaseの設定
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthProfilesIntegration() {
  console.log('🔍 AuthとProfilesの統合テストを開始します...\n');

  try {
    // 1. 現在のauth.usersとprofilesの状況を確認
    console.log('📊 現在のデータベース状況:');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ auth.users取得エラー:', authError);
      return;
    }
    console.log(`   - auth.users: ${authUsers.users.length}件`);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    if (profilesError) {
      console.error('❌ profiles取得エラー:', profilesError);
      return;
    }
    console.log(`   - profiles: ${profiles.length}件\n`);

    // 2. テストユーザーを作成
    console.log('👤 テストユーザーを作成中...');
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';

    const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'テストユーザー'
      }
    });

    if (signUpError) {
      console.error('❌ ユーザー作成エラー:', signUpError);
      return;
    }

    console.log(`✅ ユーザー作成成功: ${newUser.user.id}`);
    console.log(`   - Email: ${newUser.user.email}`);
    console.log(`   - Name: ${newUser.user.user_metadata?.name}\n`);

    // 3. プロファイルが自動作成されたか確認
    console.log('🔍 プロファイルの自動作成を確認中...');
    
    // 少し待ってからプロファイルを確認
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single();

    if (profileError) {
      console.error('❌ プロファイル取得エラー:', profileError);
      return;
    }

    if (userProfile) {
      console.log('✅ プロファイルが自動作成されました:');
      console.log(`   - ID: ${userProfile.id}`);
      console.log(`   - Email: ${userProfile.email}`);
      console.log(`   - Name: ${userProfile.name}`);
      console.log(`   - Created: ${userProfile.created_at}\n`);
    } else {
      console.log('⚠️ プロファイルが自動作成されていません\n');
    }

    // 4. 認証テスト
    console.log('🔐 認証テストを実行中...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ ログインエラー:', signInError);
      return;
    }

    console.log('✅ ログイン成功');
    console.log(`   - User ID: ${signInData.user.id}`);
    console.log(`   - Email: ${signInData.user.email}\n`);

    // 5. プロファイル情報の取得テスト
    console.log('📋 プロファイル情報取得テスト...');
    
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (currentProfileError) {
      console.error('❌ プロファイル取得エラー:', currentProfileError);
      return;
    }

    console.log('✅ プロファイル情報取得成功:');
    console.log(`   - ID: ${currentProfile.id}`);
    console.log(`   - Email: ${currentProfile.email}`);
    console.log(`   - Name: ${currentProfile.name}\n`);

    // 6. プロファイル更新テスト
    console.log('✏️ プロファイル更新テスト...');
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ name: '更新されたテストユーザー' })
      .eq('id', signInData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ プロファイル更新エラー:', updateError);
      return;
    }

    console.log('✅ プロファイル更新成功:');
    console.log(`   - Name: ${updatedProfile.name}\n`);

    // 7. ログアウトテスト
    console.log('🚪 ログアウトテスト...');
    
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('❌ ログアウトエラー:', signOutError);
      return;
    }

    console.log('✅ ログアウト成功\n');

    // 8. 最終確認
    console.log('📊 最終データベース状況:');
    
    const { data: finalAuthUsers } = await supabase.auth.admin.listUsers();
    const { data: finalProfiles } = await supabase.from('profiles').select('*');
    
    console.log(`   - auth.users: ${finalAuthUsers.users.length}件`);
    console.log(`   - profiles: ${finalProfiles.length}件\n`);

    console.log('🎉 AuthとProfilesの統合テストが完了しました！');
    console.log('✅ すべてのテストが成功しました。');

  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
  }
}

// テスト実行
testAuthProfilesIntegration();
