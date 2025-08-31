import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// このルートの動的レンダリングを強制
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamicParams = true

// 静的初期化を避けるため、Supabaseクライアントの作成を関数内に移動
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ranfnqwqbunalbptruum.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmZucXdxYnVuYWxicHRydXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIyODUzOCwiZXhwIjoyMDcxODA0NTM4fQ.fHvcpzrRTu8ugp6APGpa45NWpgSwQNQeAsfKqA0z2O0'
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET() {
  // 静的レンダリングを防ぐため、動的データアクセスを強制
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(7)
  
  try {
    // 環境変数にアクセスして動的レンダリングを強制
    const envCheck = process.env.NODE_ENV || 'unknown'
    
    // リクエスト処理なしでシンプルなレスポンスを返す
    return NextResponse.json({
      message: 'API endpoint is working',
      timestamp,
      randomId,
      env: envCheck,
      dynamic: true,
      buildTime: new Date().toISOString()
    })
  } catch (error) {
    console.error('API エラー:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: Date.now()
    }, { status: 500 })
  }
}

// 動的レンダリングを確実にするためPOSTメソッドを追加
export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed',
    timestamp: Date.now()
  }, { status: 405 })
}
