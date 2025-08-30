-- =============================================
-- Sales Forms Table Setup for Sales Metrics
-- =============================================
-- Run this SQL in your Supabase SQL Editor
-- This will create the sales_forms table with proper security

-- Create sales_forms table
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
  
  -- Ensure one record per user per date
  UNIQUE(user_id, report_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_forms_user_id ON sales_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_forms_report_date ON sales_forms(report_date);
CREATE INDEX IF NOT EXISTS idx_sales_forms_user_date ON sales_forms(user_id, report_date);

-- Enable Row Level Security
ALTER TABLE sales_forms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sales data" ON sales_forms;
DROP POLICY IF EXISTS "Users can insert own sales data" ON sales_forms;
DROP POLICY IF EXISTS "Users can update own sales data" ON sales_forms;
DROP POLICY IF EXISTS "Users can delete own sales data" ON sales_forms;

-- Create RLS policies
-- Users can only see their own sales data
CREATE POLICY "Users can view own sales data" ON sales_forms
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sales data
CREATE POLICY "Users can insert own sales data" ON sales_forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sales data
CREATE POLICY "Users can update own sales data" ON sales_forms
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sales data
CREATE POLICY "Users can delete own sales data" ON sales_forms
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_sales_forms_updated_at ON sales_forms;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sales_forms_updated_at 
  BEFORE UPDATE ON sales_forms 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE sales_forms IS 'Stores daily sales metrics for each user';
COMMENT ON COLUMN sales_forms.report_date IS 'Date of the sales report';
COMMENT ON COLUMN sales_forms.user_id IS 'ID of the user who submitted the data';
COMMENT ON COLUMN sales_forms.calls IS 'Number of calls made';
COMMENT ON COLUMN sales_forms.connects IS 'Number of successful connections';
COMMENT ON COLUMN sales_forms.docs_sent IS 'Number of documents sent';
COMMENT ON COLUMN sales_forms.apointments IS 'Number of appointments scheduled';

-- Test the table by inserting a sample record (optional)
-- Uncomment the following lines to insert a test record
/*
INSERT INTO sales_forms (report_date, user_id, calls, connects, docs_sent, apointments)
VALUES (
  CURRENT_DATE,
  auth.uid(),
  10,
  5,
  3,
  2
) ON CONFLICT (user_id, report_date) DO UPDATE SET
  calls = EXCLUDED.calls,
  connects = EXCLUDED.connects,
  docs_sent = EXCLUDED.docs_sent,
  apointments = EXCLUDED.apointments,
  updated_at = NOW();
*/

-- Verify the table was created successfully
SELECT 
  'sales_forms table created successfully!' as status,
  COUNT(*) as existing_records
FROM sales_forms;
