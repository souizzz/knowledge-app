import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET() {
  // Completely avoid using request object to prevent static rendering
  const timestamp = Date.now()
  
  try {
    // Return a simple response without any request processing
    return NextResponse.json({
      message: 'API endpoint is working',
      timestamp,
      dynamic: true
    })
  } catch (error) {
    console.error('Error in API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: Date.now()
    }, { status: 500 })
  }
}

// Add POST method to ensure dynamic rendering
export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed',
    timestamp: Date.now()
  }, { status: 405 })
}
