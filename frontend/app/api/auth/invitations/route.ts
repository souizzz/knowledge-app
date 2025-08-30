import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ranfnqwqbunalbptruum.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmZucXdxYnVuYWxicHRydXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIyODUzOCwiZXhwIjoyMDcxODA0NTM4fQ.fHvcpzrRTu8ugp6APGpa45NWpgSwQNQeAsfKqA0z2O0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  // Prevent static rendering by using dynamic data
  const timestamp = Date.now()
  
  try {
    // Use headers instead of URL to avoid static rendering issues
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ 
        error: 'Token required',
        timestamp 
      }, { status: 400 })
    }

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !invitation) {
      return NextResponse.json({ 
        error: 'Invitation not found',
        timestamp 
      }, { status: 404 })
    }

    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      timestamp
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: Date.now()
    }, { status: 500 })
  }
}
