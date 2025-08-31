import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// Move Supabase client creation inside the function to avoid static initialization
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
    // Return a simple response without any request processing
    return NextResponse.json({
      message: 'Admin API endpoint is working',
      timestamp: Date.now(),
      dynamic: true
    })
  } catch (error) {
    console.error('Error in admin API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: Date.now()
    }, { status: 500 })
  }
}
