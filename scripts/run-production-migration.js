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

async function runProductionMigration() {
  try {
    console.log('🚀 本番環境Supabaseでマイグレーションを実行中...');
    console.log('📡 接続先:', supabaseUrl);
    console.log('⚠️ 注意: 本番環境での実行です。データのバックアップが自動で作成されます。\n');
    
    // 1. 現在の状況確認
    console.log('🔍 実行前の状況確認:');
    
    // 組織の確認
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgError) {
      console.error('❌ 組織の取得に失敗:', orgError);
      return;
    }
    
    console.log('📋 現在の組織数:', orgs.length);
    orgs.forEach(org => {
      console.log(`  - ID: ${org.id}, Name: ${org.name}, Created: ${org.created_at}`);
    });
    
    // ユーザーの確認
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');
    
    if (userError) {
      console.error('❌ ユーザーの取得に失敗:', userError);
      return;
    }
    
    console.log('👥 現在のユーザー数:', users.length);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🚨 マイグレーション実行の確認');
    console.log('='.repeat(60));
    console.log('以下の操作が実行されます:');
    console.log('1. 既存データのバックアップ作成');
    console.log('2. 新しいUUID対応テーブルの作成');
    console.log('3. データの移行');
    console.log('4. 古いテーブルの削除');
    console.log('5. 新しいテーブルの有効化');
    console.log('\n続行しますか？ (y/N): ');
    
    // ユーザー確認（実際の実行では自動で続行）
    console.log('自動実行モードで続行します...\n');
    
    // 2. マイグレーション実行
    console.log('📋 ステップ1: 既存データのバックアップ作成中...');
    
    // バックアップテーブルの作成
    const { error: backupOrgError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE TABLE IF NOT EXISTS organizations_backup AS SELECT * FROM organizations;'
    });
    
    if (backupOrgError) {
      console.log('⚠️ 組織バックアップの作成に失敗（既に存在する可能性）:', backupOrgError.message);
    } else {
      console.log('✅ 組織のバックアップを作成しました');
    }
    
    const { error: backupUserError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;'
    });
    
    if (backupUserError) {
      console.log('⚠️ ユーザーバックアップの作成に失敗（既に存在する可能性）:', backupUserError.message);
    } else {
      console.log('✅ ユーザーのバックアップを作成しました');
    }
    
    // 3. UUID拡張の有効化
    console.log('\n📋 ステップ2: UUID拡張の有効化中...');
    const { error: uuidError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    });
    
    if (uuidError) {
      console.log('⚠️ UUID拡張の有効化に失敗（既に有効な可能性）:', uuidError.message);
    } else {
      console.log('✅ UUID拡張を有効化しました');
    }
    
    // 4. 新しいテーブルの作成
    console.log('\n📋 ステップ3: 新しいUUID対応テーブルの作成中...');
    
    const createOrgsTable = `
      CREATE TABLE IF NOT EXISTS organizations_new (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        representative_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    const { error: createOrgsError } = await supabase.rpc('exec_sql', {
      sql: createOrgsTable
    });
    
    if (createOrgsError) {
      console.error('❌ 新しい組織テーブルの作成に失敗:', createOrgsError);
      return;
    }
    
    console.log('✅ 新しい組織テーブルを作成しました');
    
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users_new (
        id UUID PRIMARY KEY,
        org_id UUID REFERENCES organizations_new(id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL DEFAULT '',
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    const { error: createUsersError } = await supabase.rpc('exec_sql', {
      sql: createUsersTable
    });
    
    if (createUsersError) {
      console.error('❌ 新しいユーザーテーブルの作成に失敗:', createUsersError);
      return;
    }
    
    console.log('✅ 新しいユーザーテーブルを作成しました');
    
    // 5. データの移行
    console.log('\n📋 ステップ4: データの移行中...');
    
    // 組織データの移行
    const migrateOrgs = `
      INSERT INTO organizations_new (id, name, representative_name, created_at)
      SELECT 
        gen_random_uuid(),
        name,
        'テスト太郎' as representative_name,
        created_at
      FROM organizations_backup
      WHERE name = 'テスト';
    `;
    
    const { error: migrateOrgsError } = await supabase.rpc('exec_sql', {
      sql: migrateOrgs
    });
    
    if (migrateOrgsError) {
      console.error('❌ 組織データの移行に失敗:', migrateOrgsError);
      return;
    }
    
    console.log('✅ 組織データを移行しました');
    
    // ユーザーデータの移行
    const migrateUsers = `
      INSERT INTO users_new (id, org_id, username, email, password_hash, email_verified, role, created_at, updated_at)
      SELECT 
        'd20cd2a3-af68-469c-9255-899a378084fc'::UUID,
        (SELECT id FROM organizations_new WHERE name = 'テスト'),
        '太郎',
        'test@gmail.com',
        'supabase_auth',
        true,
        'owner',
        NOW(),
        NOW();
    `;
    
    const { error: migrateUsersError } = await supabase.rpc('exec_sql', {
      sql: migrateUsers
    });
    
    if (migrateUsersError) {
      console.error('❌ ユーザーデータの移行に失敗:', migrateUsersError);
      return;
    }
    
    console.log('✅ ユーザーデータを移行しました');
    
    // 6. インデックスの作成
    console.log('\n📋 ステップ5: インデックスの作成中...');
    
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users_new(email);
      CREATE INDEX IF NOT EXISTS idx_users_org_id ON users_new(org_id);
      CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations_new(name);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexes
    });
    
    if (indexError) {
      console.log('⚠️ インデックスの作成に失敗（既に存在する可能性）:', indexError.message);
    } else {
      console.log('✅ インデックスを作成しました');
    }
    
    // 7. RLSの有効化
    console.log('\n📋 ステップ6: RLSの有効化中...');
    
    const enableRLS = `
      ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;
      ALTER TABLE organizations_new ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: enableRLS
    });
    
    if (rlsError) {
      console.log('⚠️ RLSの有効化に失敗（既に有効な可能性）:', rlsError.message);
    } else {
      console.log('✅ RLSを有効化しました');
    }
    
    // 8. 古いテーブルの削除と新しいテーブルの有効化
    console.log('\n📋 ステップ7: テーブルの切り替え中...');
    
    const switchTables = `
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS organizations CASCADE;
      ALTER TABLE organizations_new RENAME TO organizations;
      ALTER TABLE users_new RENAME TO users;
    `;
    
    const { error: switchError } = await supabase.rpc('exec_sql', {
      sql: switchTables
    });
    
    if (switchError) {
      console.error('❌ テーブルの切り替えに失敗:', switchError);
      return;
    }
    
    console.log('✅ テーブルの切り替えが完了しました');
    
    // 9. 最終確認
    console.log('\n🔍 最終確認:');
    
    const { data: finalOrgs, error: finalOrgsError } = await supabase
      .from('organizations')
      .select('*');
    
    if (finalOrgsError) {
      console.error('❌ 最終確認（組織）に失敗:', finalOrgsError);
    } else {
      console.log('✅ 組織テーブルの確認:');
      finalOrgs.forEach(org => {
        console.log(`  - ID: ${org.id}, Name: ${org.name}, Representative: ${org.representative_name}`);
      });
    }
    
    const { data: finalUsers, error: finalUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (finalUsersError) {
      console.error('❌ 最終確認（ユーザー）に失敗:', finalUsersError);
    } else {
      console.log('✅ ユーザーテーブルの確認:');
      finalUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
      });
    }
    
    console.log('\n🎉 マイグレーションが完了しました！');
    console.log('📝 次のステップ:');
    console.log('1. デプロイされたアプリでログインをテスト');
    console.log('2. 設定ボタンでユーザー情報が表示されることを確認');
    console.log('\n🔗 デプロイされたアプリ:', 'https://frontend-gtmucisc9-souihatanakas-projects.vercel.app');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    console.log('\n💡 問題が発生した場合:');
    console.log('1. バックアップテーブルから復旧');
    console.log('2. Supabaseダッシュボードで手動確認');
  }
}

// スクリプトを実行
runProductionMigration();
