"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  // マウント状態を管理
  useEffect(() => {
    setMounted(true);
    setSupabase(supabaseBrowser());
  }, []);

  // URLパラメータからエラーメッセージを取得
  useEffect(() => {
    if (!mounted) return;

    // 既ログインならメインへ遷移
    (async () => {
      try {
        const s = supabaseBrowser();
        const { data: { session } } = await s.auth.getSession();
        if (session) {
          window.location.replace('/');
          return;
        }
      } catch {}
    })();
    
    // URLSearchParamsを使用してURLパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('e');
    const errorMsg = urlParams.get('msg');
    
    if (error) {
      let errorMessage = "認証エラーが発生しました";
      switch (error) {
        case 'exchange':
          errorMessage = "認証コードの処理に失敗しました。もう一度お試しください。";
          break;
        case 'nosession':
          errorMessage = "セッションが見つかりません。再度ログインしてください。";
          break;
        case 'user':
          errorMessage = "ユーザー情報の取得に失敗しました。";
          break;
        case 'invite':
          errorMessage = "招待が無効または期限切れです。";
          break;
        default:
          errorMessage = errorMsg ? decodeURIComponent(errorMsg) : "認証エラーが発生しました";
      }
      setMessage(errorMessage);
    }
  }, [mounted]);

  const sendMagicLink = async () => {
    if (!supabase) return;
    
    // メールアドレスの検証
    if (!email.trim()) {
      setMessage("メールアドレスを入力してください");
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("有効なメールアドレスを入力してください");
      return;
    }

    setIsLoading(true);
    setMessage("");
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Magic link error:', error);
        
        // メール送信失敗をログに記録
        console.log(`[EMAIL_SEND] Failed to send magic link to ${email}: ${error.message}`);
        
        // エラーメッセージの詳細化
        let errorMessage = "エラーが発生しました";
        if (error.message.includes('rate limit')) {
          errorMessage = "送信回数が上限に達しました。しばらく待ってから再試行してください";
        } else if (error.message.includes('invalid email')) {
          errorMessage = "無効なメールアドレスです";
        } else if (error.message.includes('network')) {
          errorMessage = "ネットワークエラーが発生しました。接続を確認してください";
        } else {
          errorMessage = `エラー: ${error.message}`;
        }
        
        setMessage(errorMessage);
      } else {
        // メール送信成功をログに記録
        console.log(`[EMAIL_SEND] Magic link sent successfully to ${email}`);
        
        setSent(true);
        setMessage("メールを送信しました。メールボックスを確認してリンクをクリックしてください。");
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage("ネットワークエラーが発生しました。インターネット接続を確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  // マウント前は何も表示しない
  if (!mounted) {
    return null;
  }

  return (
    <div style={{
      maxWidth: 420,
      margin: "64px auto",
      padding: "32px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e5e7eb"
    }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#1f2937",
          margin: "0 0 8px 0"
        }}>
          🔐 ログイン
        </h1>
        <p style={{
          color: "#6b7280",
          fontSize: "16px",
          margin: "0"
        }}>
          メールアドレスを入力してログインしてください
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "8px"
        }}>
          メールアドレス
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "16px",
            transition: "border-color 0.2s ease",
            boxSizing: "border-box",
            backgroundColor: isLoading ? "#f9fafb" : "white"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3b82f6";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
          }}
        />
      </div>

      <button 
        onClick={sendMagicLink} 
        disabled={isLoading || !email.trim() || !supabase}
        style={{
          width: "100%",
          padding: "14px 24px",
          backgroundColor: isLoading || !email.trim() || !supabase ? "#9ca3af" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: isLoading || !email.trim() || !supabase ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          marginBottom: "20px"
        }}
        onMouseOver={(e) => {
          if (!isLoading && email.trim() && supabase) {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = "#2563eb";
            target.style.transform = "translateY(-1px)";
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading && email.trim() && supabase) {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = "#3b82f6";
            target.style.transform = "translateY(0)";
          }
        }}
      >
        {isLoading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{
              width: "16px",
              height: "16px",
              border: "2px solid #ffffff",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></span>
            送信中...
          </span>
        ) : (
          "📧 メールリンクを送る"
        )}
      </button>

      {sent && (
        <div style={{
          padding: "16px",
          backgroundColor: "#d1fae5",
          border: "1px solid #a7f3d0",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>✅</span>
            <div>
              <p style={{
                margin: "0",
                color: "#065f46",
                fontWeight: "600",
                fontSize: "14px"
              }}>
                メールを送信しました
              </p>
              <p style={{
                margin: "4px 0 0 0",
                color: "#047857",
                fontSize: "13px"
              }}>
                メールボックスを確認してリンクをクリックしてください
              </p>
            </div>
          </div>
        </div>
      )}

      {message && !sent && (
        <div style={{
          padding: "16px",
          backgroundColor: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>❌</span>
            <p style={{
              margin: "0",
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              {message}
            </p>
          </div>
        </div>
      )}

      <div style={{
        textAlign: "center",
        padding: "20px 0",
        borderTop: "1px solid #e5e7eb",
        marginTop: "20px"
      }}>
        <p style={{
          margin: "0 0 16px 0",
          color: "#6b7280",
          fontSize: "13px"
        }}>
          初回の場合は新規アカウントが作成されます
        </p>
        
        <button 
          onClick={() => window.location.href = '/register'}
          style={{
            width: "100%",
            padding: "12px 24px",
            backgroundColor: "transparent",
            color: "#3b82f6",
            border: "2px solid #3b82f6",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = "#3b82f6";
            target.style.color = "white";
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = "transparent";
            target.style.color = "#3b82f6";
          }}
        >
          📝 新規登録はこちら
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}