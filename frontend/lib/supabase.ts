import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
