-- Supabase認証フック（Auth Hooks）の作成
-- このスクリプトは、メール認証のための認証フックを作成します

-- 1. 認証フック用のスキーマを作成
CREATE SCHEMA IF NOT EXISTS auth_hooks;

-- 2. 認証フック用のテーブルを作成
CREATE TABLE IF NOT EXISTS auth_hooks.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 認証フック関数を作成
CREATE OR REPLACE FUNCTION auth_hooks.handle_auth_event()
RETURNS TRIGGER AS $$
BEGIN
    -- 認証イベントをログに記録
    INSERT INTO auth_hooks.email_logs (
        email,
        event_type,
        status,
        metadata
    ) VALUES (
        COALESCE(NEW.email, OLD.email),
        TG_OP,
        'success',
        jsonb_build_object(
            'user_id', COALESCE(NEW.id, OLD.id),
            'created_at', COALESCE(NEW.created_at, OLD.created_at),
            'updated_at', COALESCE(NEW.updated_at, OLD.updated_at)
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 認証フックのトリガーを作成
DROP TRIGGER IF EXISTS auth_hooks_trigger ON auth.users;
CREATE TRIGGER auth_hooks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth_hooks.handle_auth_event();

-- 5. 認証フック用のRLS（Row Level Security）を設定
ALTER TABLE auth_hooks.email_logs ENABLE ROW LEVEL SECURITY;

-- 6. 認証フック用のポリシーを作成
CREATE POLICY "Allow service role to access email logs" ON auth_hooks.email_logs
    FOR ALL USING (auth.role() = 'service_role');

-- 7. 認証フック用のビューを作成
CREATE OR REPLACE VIEW auth_hooks.email_stats AS
SELECT 
    DATE(created_at) as date,
    event_type,
    status,
    COUNT(*) as count
FROM auth_hooks.email_logs
GROUP BY DATE(created_at), event_type, status
ORDER BY date DESC;

-- 8. 認証フック用の関数を作成（メール送信の成功/失敗を記録）
CREATE OR REPLACE FUNCTION auth_hooks.log_email_event(
    p_email TEXT,
    p_event_type TEXT,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO auth_hooks.email_logs (
        email,
        event_type,
        status,
        error_message,
        metadata
    ) VALUES (
        p_email,
        p_event_type,
        p_status,
        p_error_message,
        p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 認証フック用の関数を作成（認証イベントの統計を取得）
CREATE OR REPLACE FUNCTION auth_hooks.get_auth_stats(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    date DATE,
    event_type TEXT,
    status TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        event_type,
        status,
        COUNT(*) as count
    FROM auth_hooks.email_logs
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY DATE(created_at), event_type, status
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 認証フック用の関数を作成（認証エラーの詳細を取得）
CREATE OR REPLACE FUNCTION auth_hooks.get_auth_errors(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    email TEXT,
    event_type TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        email,
        event_type,
        error_message,
        created_at
    FROM auth_hooks.email_logs
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    AND status = 'error'
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 認証フック用の関数を作成（認証成功の詳細を取得）
CREATE OR REPLACE FUNCTION auth_hooks.get_auth_successes(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    email TEXT,
    event_type TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        email,
        event_type,
        created_at
    FROM auth_hooks.email_logs
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    AND status = 'success'
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 認証フック用の関数を作成（認証イベントのクリーンアップ）
CREATE OR REPLACE FUNCTION auth_hooks.cleanup_old_logs(
    p_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_hooks.email_logs
    WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * p_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 認証フック用の関数を作成（認証イベントの統計サマリー）
CREATE OR REPLACE FUNCTION auth_hooks.get_auth_summary(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    total_events BIGINT,
    successful_events BIGINT,
    failed_events BIGINT,
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'success') as successful_events,
        COUNT(*) FILTER (WHERE status = 'error') as failed_events,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0 
        END as success_rate
    FROM auth_hooks.email_logs
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 認証フック用のインデックスを作成
CREATE INDEX IF NOT EXISTS idx_auth_hooks_email_logs_created_at ON auth_hooks.email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_hooks_email_logs_email ON auth_hooks.email_logs(email);
CREATE INDEX IF NOT EXISTS idx_auth_hooks_email_logs_event_type ON auth_hooks.email_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_hooks_email_logs_status ON auth_hooks.email_logs(status);

-- 15. 認証フック用のコメントを追加
COMMENT ON SCHEMA auth_hooks IS '認証フック（Auth Hooks）用のスキーマ';
COMMENT ON TABLE auth_hooks.email_logs IS '認証イベントのログテーブル';
COMMENT ON FUNCTION auth_hooks.handle_auth_event() IS '認証イベントを処理するトリガー関数';
COMMENT ON FUNCTION auth_hooks.log_email_event(TEXT, TEXT, TEXT, TEXT, JSONB) IS 'メール送信イベントをログに記録する関数';
COMMENT ON FUNCTION auth_hooks.get_auth_stats(INTEGER) IS '認証イベントの統計を取得する関数';
COMMENT ON FUNCTION auth_hooks.get_auth_errors(INTEGER) IS '認証エラーの詳細を取得する関数';
COMMENT ON FUNCTION auth_hooks.get_auth_successes(INTEGER) IS '認証成功の詳細を取得する関数';
COMMENT ON FUNCTION auth_hooks.cleanup_old_logs(INTEGER) IS '古い認証ログをクリーンアップする関数';
COMMENT ON FUNCTION auth_hooks.get_auth_summary(INTEGER) IS '認証イベントの統計サマリーを取得する関数';

-- 16. 認証フック用のサンプルデータを挿入
INSERT INTO auth_hooks.email_logs (email, event_type, status, metadata) VALUES
('test@example.com', 'INSERT', 'success', '{"test": true}'),
('user@example.com', 'UPDATE', 'success', '{"test": true}'),
('admin@example.com', 'DELETE', 'success', '{"test": true}');

-- 17. 認証フック用の権限を設定
GRANT USAGE ON SCHEMA auth_hooks TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth_hooks TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth_hooks TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth_hooks TO service_role;

-- 18. 認証フック用のデフォルト権限を設定
ALTER DEFAULT PRIVILEGES IN SCHEMA auth_hooks GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth_hooks GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth_hooks GRANT ALL ON FUNCTIONS TO service_role;

-- 19. 認証フック用の設定完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '認証フック（Auth Hooks）の設定が完了しました！';
    RAISE NOTICE 'スキーマ: auth_hooks';
    RAISE NOTICE 'テーブル: email_logs';
    RAISE NOTICE '関数: handle_auth_event, log_email_event, get_auth_stats, get_auth_errors, get_auth_successes, cleanup_old_logs, get_auth_summary';
    RAISE NOTICE 'ビュー: email_stats';
    RAISE NOTICE 'トリガー: auth_hooks_trigger';
END $$;
