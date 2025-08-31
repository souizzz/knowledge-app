-- 営業数値管理用のsales_formsテーブルを作成
CREATE TABLE IF NOT EXISTS sales_forms (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calls INTEGER NOT NULL DEFAULT 0,
  connects INTEGER NOT NULL DEFAULT 0,
  docs_sent INTEGER NOT NULL DEFAULT 0,
  apointments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ユーザー・日付の組み合わせでユニーク制約を確保
  UNIQUE(user_id, report_date)
);

-- パフォーマンス向上のためのインデックスを作成
CREATE INDEX IF NOT EXISTS idx_sales_forms_user_id ON sales_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_forms_report_date ON sales_forms(report_date);
CREATE INDEX IF NOT EXISTS idx_sales_forms_user_date ON sales_forms(user_id, report_date);

-- Row Level Securityを有効化
ALTER TABLE sales_forms ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成
-- ユーザーは自分の営業データのみ閲覧可能
CREATE POLICY "Users can view own sales data" ON sales_forms
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の営業データを挿入可能
CREATE POLICY "Users can insert own sales data" ON sales_forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の営業データを更新可能
CREATE POLICY "Users can update own sales data" ON sales_forms
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分の営業データを削除可能
CREATE POLICY "Users can delete own sales data" ON sales_forms
  FOR DELETE USING (auth.uid() = user_id);

-- updated_atタイムスタンプを自動更新する関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atを自動更新するトリガーを作成
CREATE TRIGGER update_sales_forms_updated_at 
  BEFORE UPDATE ON sales_forms 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ドキュメント用のコメントを追加
COMMENT ON TABLE sales_forms IS 'Stores daily sales metrics for each user';
COMMENT ON COLUMN sales_forms.report_date IS 'Date of the sales report';
COMMENT ON COLUMN sales_forms.user_id IS 'ID of the user who submitted the data';
COMMENT ON COLUMN sales_forms.calls IS 'Number of calls made';
COMMENT ON COLUMN sales_forms.connects IS 'Number of successful connections';
COMMENT ON COLUMN sales_forms.docs_sent IS 'Number of documents sent';
COMMENT ON COLUMN sales_forms.apointments IS 'Number of appointments scheduled';
