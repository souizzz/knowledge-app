import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // For Supabase Auth Hooks, we don't need to verify the signature
    // as Supabase handles the authentication internally
    console.log('Auth hook triggered')

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    // Get the request body
    const { type, record } = await req.json()

    console.log('Auth hook triggered:', { type, user: user?.id, record })

    // Handle different auth events
    switch (type) {
      case 'user.created':
        console.log('User created:', record)
        // Log user creation
        await logAuthEvent('user_created', record, user?.id)
        break
      
      case 'user.updated':
        console.log('User updated:', record)
        // Log user update
        await logAuthEvent('user_updated', record, user?.id)
        break
      
      case 'user.deleted':
        console.log('User deleted:', record)
        // Log user deletion
        await logAuthEvent('user_deleted', record, user?.id)
        break
      
      case 'user.signed_in':
        console.log('User signed in:', record)
        // Log sign in
        await logAuthEvent('user_signed_in', record, user?.id)
        break
      
      case 'user.signed_out':
        console.log('User signed out:', record)
        // Log sign out
        await logAuthEvent('user_signed_out', record, user?.id)
        break
      
      case 'user.email_confirmed':
        console.log('User email confirmed:', record)
        // Log email confirmation
        await logAuthEvent('user_email_confirmed', record, user?.id)
        break
      
      case 'user.password_recovery':
        console.log('User password recovery:', record)
        // Log password recovery
        await logAuthEvent('user_password_recovery', record, user?.id)
        break
      
      default:
        console.log('Unknown auth event:', type)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Auth hook processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Auth hook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to log auth events
async function logAuthEvent(eventType: string, record: any, userId?: string) {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabaseAdmin
      .from('email_logs')
      .insert({
        event_type: eventType,
        user_id: userId || record.id,
        email: record.email,
        metadata: record,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log auth event:', error)
    } else {
      console.log('Auth event logged successfully:', eventType)
    }
  } catch (error) {
    console.error('Error logging auth event:', error)
  }
}