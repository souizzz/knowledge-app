"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic'

type Inv = { email: string; role: string };

export default function InvitePage({ params }: { params: { param: string } }) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [inv, setInv] = useState<Inv | null>(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // パラメータがトークンかIDかを判定
  const isToken = params.param.length > 20; // トークンは通常長い

  // トークンの場合：招待を受ける
  useEffect(() => {
    if (isToken) {
      api<Inv>(`/api/auth/invitations?token=${params.param}`)
        .then(setInv)
        .catch(e => setErr(e.message));
    }
  }, [params.param, isToken]);

  // IDの場合：招待を送信
  const sendOtp = async () => {
    if (!email.trim()) {
      setMessage("メールアドレスを入力してください");
      return;
    }

    setIsLoading(true);
    setMessage("");
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?inv=${params.param}`,
        },
      });
      
      if (error) {
        console.error('Invite OTP error:', error);
        setMessage(`エラー: ${error.message}`);
      } else {
        setSent(true);
        setMessage("送信しました。メールのリンクを開いてください。");
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage("ネットワークエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // 招待を受ける処理
  async function accept() {
    try {
      await api('/api/auth/accept-invite', { 
        method: 'POST', 
        body: JSON.stringify({ token: params.param, name }) 
      });
      router.push('/onboarding/slack-bind');
    } catch(e: any) { 
      setErr(e.message); 
    }
  }

  // トークンの場合：招待を受けるページ
  if (isToken) {
    if (err) return (
      <div style={{ padding: "2rem", color: "red" }}>
        エラー: {err}
      </div>
    );
    
    if (!inv) return (
      <div style={{ padding: "2rem" }}>
        読み込み中...
      </div>
    );

    return (
      <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
        <h1>招待を受ける</h1>
        <div style={{ marginBottom: "1rem" }}>
          <p>メール: <b>{inv.email}</b></p>
          <p>ロール: <b>{inv.role}</b></p>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            氏名
          </label>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="山田 太郎"
            style={{ 
              width: "100%", 
              padding: "0.5rem", 
              border: "1px solid #ccc", 
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            accept();
          }} 
          disabled={!name}
          style={{ 
            padding: "0.75rem 1.5rem", 
            backgroundColor: !name ? "#ccc" : "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: !name ? "not-allowed" : "pointer",
            fontSize: "1rem",
            transition: 'all 0.2s ease',
            outline: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseOver={(e) => {
            if (name) {
              e.currentTarget.style.backgroundColor = '#0056b3';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            if (name) {
              e.currentTarget.style.backgroundColor = '#007bff';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
          onTouchStart={(e) => {
            if (name) {
              e.currentTarget.style.transform = 'scale(0.98)';
            }
          }}
          onTouchEnd={(e) => {
            if (name) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          登録して開始
        </button>
      </div>
    );
  }

  // IDの場合：招待を送信するページ
  return (
    <div style={{maxWidth:420, margin:"64px auto"}}>
      <h1>招待に参加</h1>
      <p>招待先メールアドレスを入力し、届いたリンクから戻ってください。</p>
      <input
        placeholder="invited@example.com"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        style={{width:"100%",padding:8,margin:"12px 0"}}
      />
      <button onClick={sendOtp} disabled={isLoading}>
        {isLoading ? "送信中..." : "メールを送る"}
      </button>
      {sent && <p>送信しました。メールのリンクを開いてください。</p>}
      {message && (
        <div style={{
          marginTop: "12px",
          padding: "8px",
          backgroundColor: message.includes("送信") ? "#d1fae5" : "#fee2e2",
          color: message.includes("送信") ? "#059669" : "#dc2626",
          borderRadius: "4px",
          fontSize: "14px"
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
