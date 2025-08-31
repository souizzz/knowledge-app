// このルートの動的レンダリングを強制
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamicParams = true

// 動的インポートで静的レンダリングを回避
async function getNextResponse() {
  const { NextResponse } = await import('next/server')
  return NextResponse
}

// 静的初期化を避けるため、Supabaseクライアントの作成を関数内に移動
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ranfnqwqbunalbptruum.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmZucXdxYnVuYWxicHRydXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIyODUzOCwiZXhwIjoyMDcxODA0NTM4fQ.fHvcpzrRTu8ugp6APGpa45NWpgSwQNQeAsfKqA0z2O0'
  return createClient(supabaseUrl, supabaseServiceKey)
}

function generateInvitationToken(): string {
  return (crypto as any).randomBytes(32).toString('hex')
}

export async function POST() {
  try {
    // 動的インポートでNextResponseを取得
    const NextResponse = await getNextResponse()
    
    // 動的データアクセスで静的レンダリングを防ぐ
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const envCheck = process.env.NODE_ENV || 'unknown'
    
    // リクエスト処理なしでシンプルなレスポンスを返す
    return NextResponse.json({
      message: 'Admin API endpoint is working',
      timestamp,
      randomId,
      env: envCheck,
      dynamic: true,
      buildTime: new Date().toISOString()
    })
  } catch (error) {
    console.error('管理API エラー:', error)
    const NextResponse = await getNextResponse()
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: Date.now()
    }, { status: 500 })
  }
}
