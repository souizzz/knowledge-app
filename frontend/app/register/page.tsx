'use client'

import { useState, useEffect } from 'react'
import { supabaseBrowser } from '../../lib/supabase/client'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    organization_name: '',
    representative_name: '',
    username: '',
    email: '',
    password: ''
  })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    setSupabase(supabaseBrowser())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) return
    
    if (formData.password.length < 8) {
      setMessage('パスワードは8文字以上で入力してください。')
      return
    }

    if (!formData.email.trim() || !formData.password.trim() || !formData.username.trim()) {
      setMessage('必須項目を入力してください。')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      // Supabaseでユーザー登録
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            organization_name: formData.organization_name,
            representative_name: formData.representative_name,
          }
        }
      })

      if (error) {
        console.error('Registration error:', error)
        if (error.message.includes('User already registered')) {
          setMessage('このメールアドレスは既に登録されています。')
        } else if (error.message.includes('Password should be at least')) {
          setMessage('パスワードは8文字以上で入力してください。')
        } else {
          setMessage(`登録エラー: ${error.message}`)
        }
      } else if (data.user) {
        setMessage('登録完了。メールを確認してください。')
        setFormData({
          organization_name: '',
          representative_name: '',
          username: '',
          email: '',
          password: ''
        })
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

  // マウント前は何も表示しない
  if (!mounted) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '1rem',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '500px',
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
            新規登録
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="organization_name" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              法人名
            </label>
            <input
              id="organization_name"
              name="organization_name"
              type="text"
              required
              value={formData.organization_name}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="株式会社サンプル"
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
            <label htmlFor="representative_name" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              代表者名
            </label>
            <input
              id="representative_name"
              name="representative_name"
              type="text"
              required
              value={formData.representative_name}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="山田太郎"
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
            <label htmlFor="username" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              ユーザー名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="yamada_taro"
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
              パスワード（8文字以上）
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="8文字以上のパスワード"
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
            disabled={isLoading || !formData.email.trim() || !formData.password.trim() || !formData.username.trim()}
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
              if (!isLoading && formData.email.trim() && formData.password.trim() && formData.username.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading && formData.email.trim() && formData.password.trim() && formData.username.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onTouchStart={(e) => {
              if (!isLoading && formData.email.trim() && formData.password.trim() && formData.username.trim()) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (!isLoading && formData.email.trim() && formData.password.trim() && formData.username.trim()) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isLoading ? '登録中...' : '登録'}
          </button>

          {message && (
            <div style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: message.includes('エラー') ? '#dc2626' : '#059669',
              padding: '0.75rem',
              backgroundColor: message.includes('エラー') ? '#fee2e2' : '#d1fae5',
              border: `1px solid ${message.includes('エラー') ? '#fca5a5' : '#a7f3d0'}`,
              borderRadius: '0.375rem'
            }}>
              {message}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <a 
              href="/login" 
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
              既にアカウントをお持ちの方はこちら
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
