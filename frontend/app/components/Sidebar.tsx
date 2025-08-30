"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/knowledge/knowledge-resister", label: "ナレッジ管理＆登録" },
  { href: "/seles-metrics", label: "営業数値管理" },
  { href: "/admin/users", label: "ユーザー管理" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <nav style={{ display: "grid", gap: 8 }}>
      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        const isHovered = hoveredItem === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            style={{
              display: "block",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              textDecoration: "none",
              color: active ? "#3b82f6" : "#374151",
              background: active ? "#f5f7fb" : (isHovered ? "#f9fafb" : "#fff"),
              boxShadow: active ? "0 8px 24px rgba(0,0,0,.06)" : (isHovered ? "0 4px 12px rgba(0,0,0,.04)" : "none"),
              transition: "all 0.2s ease",
              outline: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
              fontWeight: active ? "600" : "500",
              fontSize: "14px",
              lineHeight: "1.4",
              transform: isHovered ? "translateY(-1px)" : "translateY(0)",
            }}
            aria-current={active ? "page" : undefined}
            onMouseEnter={() => setHoveredItem(item.href)}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={(e: React.TouchEvent) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
            }}
            onTouchEnd={(e: React.TouchEvent) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
            onClick={(e: React.MouseEvent) => {
              // アクティブな項目をクリックした場合の処理
              if (active) {
                e.preventDefault();
                // 必要に応じて追加の処理
              }
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
