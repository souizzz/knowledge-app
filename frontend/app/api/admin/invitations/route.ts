import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// このルートの動的レンダリングを強制
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// 静的初期化を避けるため、Supabaseクライアントの作成を関数内に移動
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ranfnqwqbunalbptruum.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmZucXdxYnVuYWxicHRydXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIyODUzOCwiZXhwIjoyMDcxODA0NTM4fQ.fHvcpzrRTu8ugp6APGpa45NWpgSwQNQeAsfKqA0z2O0'
  return createClient(supabaseUrl, supabaseServiceKey)
}

function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST() {
  try {
    // リクエスト処理なしでシンプルなレスポンスを返す
    return NextResponse.json({
      message: 'Admin API endpoint is working',
      timestamp: Date.now(),
      dynamic: true
    })
  } catch (error) {
    console.error('管理API エラー:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: Date.now()
    }, { status: 500 })
  }
}
