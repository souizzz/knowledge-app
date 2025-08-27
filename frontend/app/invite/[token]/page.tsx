"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

type Inv = { email: string; role: string };

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [inv, setInv] = useState<Inv | null>(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api<Inv>(`/api/auth/invitations?token=${params.token}`)
      .then(setInv)
      .catch(e => setErr(e.message));
  }, [params.token]);

  async function accept() {
    try {
      await api('/api/auth/accept-invite', { 
        method: 'POST', 
        body: JSON.stringify({ token: params.token, name }) 
      });
      router.push('/onboarding/slack-bind');
    } catch(e: any) { 
      setErr(e.message); 
    }
  }


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