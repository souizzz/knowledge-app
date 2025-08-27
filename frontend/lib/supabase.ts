import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ranfnqwqbunalbptruum.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmZucXdxYnVuYWxicHRydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMjg1MzgsImV4cCI6MjA3MTgwNDUzOH0.xQa79EsGvZ0VKq_nEKy4KAFFAjvQ27BdduGQptA4tF4'

// デバッグ情報を出力
console.log('Supabase Configuration:')
console.log('URL:', supabaseUrl)
console.log('Anon Key exists:', !!supabaseAnonKey)
console.log('Anon Key length:', supabaseAnonKey?.length)

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
      users: {
        Row: {
          id: number
          org_id: number
          username: string
          email: string
          password_hash: string
          email_verified: boolean
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          org_id: number
          username: string
          email: string
          password_hash: string
          email_verified?: boolean
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          org_id?: number
          username?: string
          email?: string
          password_hash?: string
          email_verified?: boolean
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          role: string
          token: string
          expires_at: string
          accepted_at: string | null
          inviter_id: number | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: string
          token: string
          expires_at?: string
          accepted_at?: string | null
          inviter_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          inviter_id?: number | null
          created_at?: string
        }
      }
      knowledge: {
        Row: {
          id: number
          title: string
          content: string
          user_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          user_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          user_id?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
