-- auth.users.idとprofiles.idをUUIDで紐付けるマイグレーション
-- 2025-09-03

-- 1. 既存のusersテーブルからprofilesテーブルへのデータ移行
-- 既存のusersテーブルのデータをprofilesテーブルに移行（auth.usersに存在するIDのみ）
INSERT INTO public.profiles (id, email, name, created_at)
SELECT 
    u.id,
    u.email,
    u.username as name,
    u.created_at
FROM public.users u
INNER JOIN auth.users au ON u.id = au.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    created_at = EXCLUDED.created_at;

-- 2. knowledgeテーブルのuser_idをprofilesテーブルに合わせて更新
-- 既存のknowledgeテーブルがある場合の対応
DO $$
BEGIN
    -- knowledgeテーブルが存在する場合のみ実行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge' AND table_schema = 'public') THEN
        -- knowledgeテーブルのuser_idをprofilesテーブルのidに合わせる
        -- ただし、knowledgeテーブルにuser_idカラムが存在する場合のみ
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge' AND column_name = 'user_id' AND table_schema = 'public') THEN
            UPDATE public.knowledge 
            SET user_id = p.id
            FROM public.profiles p
            WHERE knowledge.user_id::text = p.email
            AND p.id IS NOT NULL;
        END IF;
    END IF;
END $$;

-- 3. 古いusersテーブルを削除（データはprofilesに移行済み）
-- ただし、auth.usersに存在しないIDのデータは警告を出してスキップ
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- auth.usersに存在しないusersテーブルのレコード数を確認
    SELECT COUNT(*) INTO orphaned_count
    FROM public.users u
    LEFT JOIN auth.users au ON u.id = au.id
    WHERE au.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Warning: % records in users table do not exist in auth.users and will be skipped', orphaned_count;
    END IF;
END $$;

DROP TABLE IF EXISTS public.users CASCADE;

-- 4. profilesテーブルのRLSポリシーを更新
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own data" ON public.profiles;

-- 新しいポリシーを作成
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. インデックスの最適化
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 6. 外部キー制約の確認と追加
-- profilesテーブルがauth.usersを正しく参照していることを確認
DO $$
BEGIN
    -- 外部キー制約が存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. トリガー関数の作成（プロファイル自動作成）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. トリガーの作成（auth.usersに新しいユーザーが作成された時に自動でprofilesも作成）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. 既存のauth.usersのデータに対してprofilesを作成（まだ作成されていない場合）
INSERT INTO public.profiles (id, email, name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- 10. 確認用のクエリ（コメントアウト）
-- SELECT 'Migration completed successfully' as status;
-- SELECT COUNT(*) as total_profiles FROM public.profiles;
-- SELECT COUNT(*) as total_auth_users FROM auth.users;
-- SELECT p.id, p.email, p.name, au.email as auth_email 
-- FROM public.profiles p 
-- JOIN auth.users au ON p.id = au.id 
-- LIMIT 5;
