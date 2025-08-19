'use client'

import { useEffect, useState } from 'react'

export default function VerifyEmailPage() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // URLからtokenパラメータを取得
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')
    setToken(tokenParam)

    if (tokenParam) {
      // トークンがある場合は認証エンドポイントにリダイレクト
      window.location.href = `/api/auth/verify-email?token=${tokenParam}`
    }
  }, [])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            認証トークンが見つかりません
          </h2>
          <p className="text-gray-600 mb-6">
            メールに記載されているリンクから再度アクセスしてください。
          </p>
          <a href="/login" className="text-blue-600 hover:text-blue-500">
            ログインページに戻る
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          メール認証中...
        </h2>
        <p className="text-gray-600">
          しばらくお待ちください。
        </p>
      </div>
    </div>
  )
}


