"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { 
    href: "/knowledge/knowledge-resister", 
    label: "ナレッジ管理＆登録",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    )
  },
  { 
    href: "/seles-metrics?v=v2.2.0&cb=" + Date.now(), 
    label: "営業数値管理",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
      </svg>
    )
  },
  { 
    href: "/admin/users", 
    label: "ユーザー管理",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <nav 
      style={{ 
        position: 'fixed',
        left: 0,
        top: '60px', // Topbarの高さ分下げる
        bottom: 0,
        width: isHovered ? '200px' : '60px', // ホバー時に展開
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        padding: isHovered ? '1rem' : '0.75rem',
        overflowY: 'auto',
        zIndex: 999,
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: "grid", gap: 8 }}>
        {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            style={{
              display: "flex",
              alignItems: "center",
              gap: isHovered ? "9px" : "0px", // サイドバー全体のホバー時にギャップを調整
              padding: isHovered ? "9px 12px" : "9px 6px", // 25%小さく
              border: "1px solid #e5e7eb",
              borderRadius: 8, // 25%小さく
              textDecoration: "none",
              color: active ? "#3b82f6" : "#374151",
              background: active ? "#f5f7fb" : "#fff",
              boxShadow: active ? "0 6px 18px rgba(0,0,0,.06)" : "none", // 25%小さく
              transition: "all 0.2s ease",
              outline: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
              fontWeight: active ? "600" : "500",
              fontSize: "10.5px", // 25%小さく (14px * 0.75)
              lineHeight: "1.4",
              transform: "translateY(0)",
              justifyContent: isHovered ? "flex-start" : "center", // サイドバー全体のホバー時に左寄せ
            }}
            aria-current={active ? "page" : undefined}
            onTouchStart={(e: React.TouchEvent) => {
              // タッチ時のスケール変更を削除してUIずれを防止
              (e.currentTarget as HTMLElement).style.opacity = "0.8";
            }}
            onTouchEnd={(e: React.TouchEvent) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
            onClick={(e: React.MouseEvent) => {
              // アクティブな項目をクリックした場合の処理
              if (active) {
                e.preventDefault();
                // 必要に応じて追加の処理
              }
            }}
          >
            <span style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: active ? "#3b82f6" : "#6b7280",
              minWidth: "20px", // アイコンの最小幅を確保
              flexShrink: 0 // アイコンのサイズを固定
            }}>
              {item.icon}
            </span>
            {isHovered && <span style={{ 
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: active ? "#3b82f6" : "#374151", // テキストの色を統一
              flex: 1 // 残りのスペースを使用
            }}>{item.label}</span>}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
