'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        console.error('Login error:', error)
        if (error.message.includes('Email not confirmed')) {
          setMessage('メールアドレスの認証が完了していません。')
        } else if (error.message.includes('Invalid login credentials')) {
          setMessage('メールアドレスまたはパスワードが正しくありません。')
        } else {
          setMessage(`ログインエラー: ${error.message}`)
        }
      } else if (data.user) {
        setMessage('ログイン成功')
        setTimeout(() => {
          router.push('/')
        }, 1000)
      }
    } catch (error) {
      console.error('Network error:', error)
      setMessage('ネットワークエラーが発生しました。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: '800',
            color: '#1f2937',
            margin: 0
          }}>
            ログイン
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                backgroundColor: isLoading ? '#f3f4f6' : 'white',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="パスワードを入力"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                backgroundColor: isLoading ? '#f3f4f6' : 'white',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseOver={(e) => {
              if (!isLoading && formData.email.trim() && formData.password.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading && formData.email.trim() && formData.password.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onTouchStart={(e) => {
              if (!isLoading && formData.email.trim() && formData.password.trim()) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (!isLoading && formData.email.trim() && formData.password.trim()) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>

          {message && (
            <div style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: message.includes('成功') ? '#059669' : '#dc2626',
              padding: '0.75rem',
              backgroundColor: message.includes('成功') ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${message.includes('成功') ? '#a7f3d0' : '#fca5a5'}`,
              borderRadius: '0.375rem'
            }}>
              {message}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <a 
              href="/register" 
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#3b82f6';
              }}
            >
              新規登録はこちら
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
