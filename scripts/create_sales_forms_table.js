#!/usr/bin/env node

/**
 * Script to create sales_forms table in Supabase
 * Run this script to set up the database table for sales metrics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSalesFormsTable() {
  console.log('🚀 Creating sales_forms table...');
  
  try {
    // Read the SQL migration file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '..', 'db', 'migrations', '003_sales_forms.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      return false;
    }
    
    console.log('✅ sales_forms table created successfully!');
    return true;
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function testTable() {
  console.log('🧪 Testing table access...');
  
  try {
    // Test if table exists and is accessible
    const { data, error } = await supabase
      .from('sales_forms')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table test failed:', error.message);
      return false;
    }
    
    console.log('✅ Table is accessible and ready to use!');
    console.log(`📊 Found ${data.length} existing records`);
    return true;
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
    return false;
  }
}

async function main() {
  console.log('📋 Setting up sales_forms table for sales metrics...\n');
  
  const created = await createSalesFormsTable();
  if (!created) {
    console.log('\n❌ Failed to create table. Please check your Supabase connection.');
    process.exit(1);
  }
  
  console.log('');
  const tested = await testTable();
  if (!tested) {
    console.log('\n❌ Table creation succeeded but test failed.');
    process.exit(1);
  }
  
  console.log('\n🎉 Database setup completed successfully!');
  console.log('📝 You can now use the sales metrics page to record daily sales data.');
}

main().catch(console.error);
