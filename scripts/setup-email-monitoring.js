#!/usr/bin/env node

/**
 * メール監視設定スクリプト
 * 
 * このスクリプトは、メール送信の監視とログ設定を構成します。
 */

const { createClient } = require('@supabase/supabase-js');
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

async function setupEmailMonitoring() {
  console.log('📧 メール監視設定を開始します...\n');

  try {
    // 1. メール監視用のテーブルを作成
    console.log('🗄️ メール監視テーブルを作成中...');
    
    const createTableSQL = `
      -- メール送信イベントテーブル
      CREATE TABLE IF NOT EXISTS email_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        event_type TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        status TEXT NOT NULL,
        error TEXT,
        metadata JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- インデックスの作成
      CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON email_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(email);
      CREATE INDEX IF NOT EXISTS idx_email_events_status ON email_events(status);
      CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);

      -- メール送信メトリクステーブル
      CREATE TABLE IF NOT EXISTS email_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        total_sent INTEGER NOT NULL DEFAULT 0,
        total_failed INTEGER NOT NULL DEFAULT 0,
        success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(date)
      );

      -- メトリクステーブルのインデックス
      CREATE INDEX IF NOT EXISTS idx_email_metrics_date ON email_metrics(date);
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (tableError) {
      console.log('ℹ️  テーブル作成は手動で実行してください');
      console.log('SQL:', createTableSQL);
    } else {
      console.log('✅ メール監視テーブルが作成されました');
    }

    // 2. メール監視用の関数を作成
    console.log('🔧 メール監視関数を作成中...');
    
    const createFunctionsSQL = `
      -- メールイベントを記録する関数
      CREATE OR REPLACE FUNCTION log_email_event(
        p_event_type TEXT,
        p_email TEXT,
        p_subject TEXT DEFAULT NULL,
        p_status TEXT,
        p_error TEXT DEFAULT NULL,
        p_metadata JSONB DEFAULT NULL,
        p_ip_address INET DEFAULT NULL,
        p_user_agent TEXT DEFAULT NULL
      ) RETURNS UUID AS $$
      DECLARE
        event_id UUID;
      BEGIN
        INSERT INTO email_events (
          event_type, email, subject, status, error, metadata, ip_address, user_agent
        ) VALUES (
          p_event_type, p_email, p_subject, p_status, p_error, p_metadata, p_ip_address, p_user_agent
        ) RETURNING id INTO event_id;
        
        -- メトリクスを更新
        PERFORM update_email_metrics();
        
        RETURN event_id;
      END;
      $$ LANGUAGE plpgsql;

      -- メールメトリクスを更新する関数
      CREATE OR REPLACE FUNCTION update_email_metrics() RETURNS VOID AS $$
      BEGIN
        INSERT INTO email_metrics (date, total_sent, total_failed, success_rate)
        SELECT 
          CURRENT_DATE,
          COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')),
          COUNT(*) FILTER (WHERE status IN ('failed', 'bounced')),
          CASE 
            WHEN COUNT(*) > 0 THEN 
              (COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0 
          END
        FROM email_events 
        WHERE DATE(timestamp) = CURRENT_DATE
        ON CONFLICT (date) DO UPDATE SET
          total_sent = EXCLUDED.total_sent,
          total_failed = EXCLUDED.total_failed,
          success_rate = EXCLUDED.success_rate,
          updated_at = NOW();
      END;
      $$ LANGUAGE plpgsql;

      -- メール統計を取得する関数
      CREATE OR REPLACE FUNCTION get_email_stats(
        p_days INTEGER DEFAULT 7
      ) RETURNS TABLE (
        date DATE,
        total_sent INTEGER,
        total_failed INTEGER,
        success_rate DECIMAL(5,2)
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          m.date,
          m.total_sent,
          m.total_failed,
          m.success_rate
        FROM email_metrics m
        WHERE m.date >= CURRENT_DATE - INTERVAL '1 day' * p_days
        ORDER BY m.date DESC;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionsSQL });
    if (functionError) {
      console.log('ℹ️  関数作成は手動で実行してください');
      console.log('SQL:', createFunctionsSQL);
    } else {
      console.log('✅ メール監視関数が作成されました');
    }

    // 3. メール監視用のビューを作成
    console.log('👁️ メール監視ビューを作成中...');
    
    const createViewsSQL = `
      -- メール送信サマリービュー
      CREATE OR REPLACE VIEW email_summary AS
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) as successful,
        COUNT(*) FILTER (WHERE status IN ('failed', 'bounced')) as failed,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::DECIMAL / COUNT(*)::DECIMAL) * 100
          ELSE 0 
        END as success_rate,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(DISTINCT SUBSTRING(email FROM '@(.+)$')) as unique_domains
      FROM email_events
      GROUP BY DATE(timestamp)
      ORDER BY date DESC;

      -- ドメイン別統計ビュー
      CREATE OR REPLACE VIEW email_domain_stats AS
      SELECT 
        SUBSTRING(email FROM '@(.+)$') as domain,
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) as successful,
        COUNT(*) FILTER (WHERE status IN ('failed', 'bounced')) as failed,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::DECIMAL / COUNT(*)::DECIMAL) * 100
          ELSE 0 
        END as success_rate
      FROM email_events
      WHERE email LIKE '%@%'
      GROUP BY SUBSTRING(email FROM '@(.+)$')
      ORDER BY total_emails DESC;

      -- エラー統計ビュー
      CREATE OR REPLACE VIEW email_error_stats AS
      SELECT 
        error,
        COUNT(*) as error_count,
        COUNT(DISTINCT email) as affected_emails,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
      FROM email_events
      WHERE error IS NOT NULL AND error != ''
      GROUP BY error
      ORDER BY error_count DESC;
    `;

    const { error: viewError } = await supabase.rpc('exec_sql', { sql: createViewsSQL });
    if (viewError) {
      console.log('ℹ️  ビュー作成は手動で実行してください');
      console.log('SQL:', createViewsSQL);
    } else {
      console.log('✅ メール監視ビューが作成されました');
    }

    // 4. メール監視用のトリガーを作成
    console.log('⚡ メール監視トリガーを作成中...');
    
    const createTriggersSQL = `
      -- メールイベント挿入時のトリガー
      CREATE OR REPLACE FUNCTION trigger_update_email_metrics() RETURNS TRIGGER AS $$
      BEGIN
        PERFORM update_email_metrics();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS email_events_update_metrics ON email_events;
      CREATE TRIGGER email_events_update_metrics
        AFTER INSERT ON email_events
        FOR EACH ROW
        EXECUTE FUNCTION trigger_update_email_metrics();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggersSQL });
    if (triggerError) {
      console.log('ℹ️  トリガー作成は手動で実行してください');
      console.log('SQL:', createTriggersSQL);
    } else {
      console.log('✅ メール監視トリガーが作成されました');
    }

    // 5. サンプルデータの挿入（テスト用）
    console.log('📊 サンプルデータを挿入中...');
    
    const sampleData = [
      {
        event_type: 'email_sent',
        email: 'test@example.com',
        subject: 'ログインリンク',
        status: 'sent',
        metadata: { template: 'magic_link' }
      },
      {
        event_type: 'email_sent',
        email: 'user@gmail.com',
        subject: '招待メール',
        status: 'delivered',
        metadata: { template: 'invite' }
      },
      {
        event_type: 'email_failed',
        email: 'invalid-email',
        subject: 'ログインリンク',
        status: 'failed',
        error: 'Invalid email address',
        metadata: { template: 'magic_link' }
      }
    ];

    for (const data of sampleData) {
      const { error: insertError } = await supabase
        .from('email_events')
        .insert(data);
      
      if (insertError) {
        console.log(`⚠️  サンプルデータの挿入に失敗: ${insertError.message}`);
      }
    }

    console.log('✅ サンプルデータが挿入されました');

    // 6. 設定完了の確認
    console.log('\n🎉 メール監視設定が完了しました！');
    console.log('\n📋 設定内容:');
    console.log('✅ メールイベントテーブル');
    console.log('✅ メールメトリクステーブル');
    console.log('✅ 監視関数');
    console.log('✅ 統計ビュー');
    console.log('✅ 自動更新トリガー');
    console.log('✅ サンプルデータ');

    console.log('\n🔧 次のステップ:');
    console.log('1. バックエンドでメール監視APIを有効化');
    console.log('2. フロントエンドで監視ダッシュボードを確認');
    console.log('3. 実際のメール送信でテスト');
    console.log('4. アラート設定の構成');

  } catch (error) {
    console.error('❌ 設定中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  setupEmailMonitoring();
}

module.exports = { setupEmailMonitoring };
