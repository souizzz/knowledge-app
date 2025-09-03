import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ranfnqwqbunalbptruum.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmZucXdxYnVuYWxicHRydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMjg1MzgsImV4cCI6MjA3MTgwNDUzOH0.xQa79EsGvZ0VKq_nEKy4KAFFAjvQ27BdduGQptA4tF4'

// 開発環境でのみデバッグ情報を出力
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase Configuration:')
  console.log('URL:', supabaseUrl)
  console.log('Anon Key exists:', !!supabaseAnonKey)
  console.log('Anon Key length:', supabaseAnonKey?.length)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 型定義
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          created_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
        }
      }
      org_members: {
        Row: {
          org_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          org_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          org_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          org_id: string
          email: string
          invited_by: string | null
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          email: string
          invited_by?: string | null
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          email?: string
          invited_by?: string | null
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
      }
      knowledge: {
        Row: {
          id: number
          title: string
          content: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
