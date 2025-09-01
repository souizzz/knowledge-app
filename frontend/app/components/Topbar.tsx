'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMe } from '@/lib/api'

export default function Topbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    org_name: string | null
    username: string | null
    email: string | null
  } | null>(null)
  const router = useRouter()

  const handleLogout = () => {
    // 設定メニューを閉じる
    setIsSettingsOpen(false)
    // ログインページに遷移
    router.push('/login')
  }

  useEffect(() => {
    if (!isSettingsOpen) return
    
    console.log('[Topbar] Fetching user info...');
    fetchMe().then((me) => {
      console.log('[Topbar] fetchMe result:', me);
      
      if (!me) {
        console.log('[Topbar] No user info, setting to null');
        setUserInfo(null)
        return
      }
      
      const userInfoData = {
        org_name: me.org_name ?? null,
        username: me.username ?? null,
        email: me.email ?? null,
      };
      
      console.log('[Topbar] Setting user info:', userInfoData);
      setUserInfo(userInfoData)
    }).catch((error) => {
      console.error('[Topbar] Error fetching user info:', error);
    })
  }, [isSettingsOpen])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1rem',
      zIndex: 1000,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      {/* 左上のツール名 */}
      <div style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        Sales Dev
      </div>

      {/* 右上の設定ボタン */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          style={{
            padding: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc'
            e.currentTarget.style.color = '#374151'
            e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#6b7280'
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* 設定ドロップダウンメニュー */}
        {isSettingsOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            minWidth: '260px',
            zIndex: 1001
          }}>
            <div style={{ padding: '0.5rem 0' }}>
              {/* ユーザー情報表示 */}
              <div style={{ padding: '0.5rem 1rem' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>法人名</div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userInfo?.org_name ?? '（法人名なし）'}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>名前</div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userInfo?.username ?? '（名前なし）'}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 4 }}>メールアドレス</div>
                <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userInfo?.email ?? '（メール情報なし）'}
                </div>
                {/* デバッグ情報 */}
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '8px', padding: '4px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                  Debug: {JSON.stringify(userInfo)}
                </div>
              </div>
              <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#374151',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                プロフィール設定
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#374151',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                アプリ設定
              </button>
              <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                ログアウト
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
