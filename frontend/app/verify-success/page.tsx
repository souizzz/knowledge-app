export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="rounded-full h-16 w-16 bg-green-100 mx-auto mb-6 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          メール認証完了
        </h2>
        
        <p className="text-gray-600 mb-6">
          メールアドレスの認証が完了しました。<br />
          ログインしてサービスをご利用ください。
        </p>
        
        <a 
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          ログインページへ
        </a>
      </div>
    </div>
  )
}
