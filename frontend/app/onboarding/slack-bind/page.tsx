"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";

export default function SlackBindPage() {
  const [slackID, setSlackID] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');

  async function start() {
    try {
      await api('/api/me/slack/start', { 
        method: 'POST', 
        body: JSON.stringify({ slack_id: slackID }) 
      });
      setSent(true); 
      setMsg('Slack に確認コードを送信しました（開発中はログに出力）');
    } catch (error) {
      console.error('Failed to start slack binding:', error);
      setMsg('エラーが発生しました');
    }
  }

  async function verify() {
    try {
      await api(`/api/me/slack/verify?slack_id=${encodeURIComponent(slackID)}`, { 
        method: 'POST', 
        body: JSON.stringify({ code }) 
      });
      setMsg('紐付け完了！');
    } catch (error) {
      console.error('Failed to verify slack binding:', error);
      setMsg('検証に失敗しました');
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Slack ID 紐付け</h1>
      <div style={{ marginBottom: "1rem" }}>
        <input 
          value={slackID} 
          onChange={e => setSlackID(e.target.value)} 
          placeholder="UXXXXXXX"
          style={{ 
            width: "100%", 
            padding: "0.5rem", 
            border: "1px solid #ccc", 
            borderRadius: "4px",
            boxSizing: "border-box",
            marginBottom: "1rem"
          }}
        />
        {!sent ? (
          <button 
            onClick={start} 
            disabled={!slackID}
            style={{ 
              padding: "0.75rem 1.5rem", 
              backgroundColor: !slackID ? "#ccc" : "#007bff", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              cursor: !slackID ? "not-allowed" : "pointer",
              fontSize: "1rem"
            }}
          >
            コード送信
          </button>
        ) : (
          <div>
            <input 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              placeholder="6桁コード"
              style={{ 
                width: "100%", 
                padding: "0.5rem", 
                border: "1px solid #ccc", 
                borderRadius: "4px",
                boxSizing: "border-box",
                marginBottom: "1rem"
              }}
            />
            <button 
              onClick={verify} 
              disabled={!code}
              style={{ 
                padding: "0.75rem 1.5rem", 
                backgroundColor: !code ? "#ccc" : "#28a745", 
                color: "white", 
                border: "none", 
                borderRadius: "4px", 
                cursor: !code ? "not-allowed" : "pointer",
                fontSize: "1rem"
              }}
            >
              検証
            </button>
          </div>
        )}
      </div>
      {msg && (
        <p style={{ 
          padding: "0.75rem", 
          backgroundColor: "#d4edda", 
          border: "1px solid #c3e6cb", 
          borderRadius: "4px", 
          color: "#155724",
          margin: "1rem 0"
        }}>
          {msg}
        </p>
      )}
    </div>
  );
}
