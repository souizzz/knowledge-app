import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ranfnqwqbunalbptruum.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmZucXdxYnVuYWxicHRydXVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIyODUzOCwiZXhwIjoyMDcxODA0NTM4fQ.fHvcpzrRTu8ugp6APGpa45NWpgSwQNQeAsfKqA0z2O0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role = 'MEMBER' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const token = generateInvitationToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7日後

    const { error } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (error) {
      console.error('Error creating invitation:', error)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://your-domain.vercel.app'
    const inviteUrl = `${frontendUrl}/invite/${token}`

    return NextResponse.json({
      invite_url: inviteUrl
    })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
