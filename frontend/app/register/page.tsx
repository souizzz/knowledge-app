'use client'

import { useState } from 'react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password.length < 8) {
      setMessage('パスワードは8文字以上で入力してください。')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage('登録完了。メールを確認してください。')
        setFormData({
          organization_name: '',
          representative_name: '',
          username: '',
          email: '',
          password: ''
        })
      } else {
        setMessage(`エラー: ${data.error || '登録に失敗しました。'}`)
      }
    } catch (error) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            新規登録
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700">
                法人名
              </label>
              <input
                id="organization_name"
                name="organization_name"
                type="text"
                required
                value={formData.organization_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="representative_name" className="block text-sm font-medium text-gray-700">
                代表者名
              </label>
              <input
                id="representative_name"
                name="representative_name"
                type="text"
                required
                value={formData.representative_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ユーザー名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '登録中...' : '登録'}
            </button>
          </div>

          {message && (
            <div className={`text-center text-sm ${message.includes('エラー') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
          )}

          <div className="text-center">
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              既にアカウントをお持ちの方はこちら
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
