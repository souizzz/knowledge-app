"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SALES_NAV = [
  { 
    href: "/seles-metrics", 
    label: "営業数値記入",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    )
  },
  { 
    href: "/seles-metrics/goals", 
    label: "目標管理",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  },
  { 
    href: "/seles-metrics/history", 
    label: "数値履歴",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    )
  },
];

interface SubSidebarProps {
  isVisible: boolean;
}

export default function SubSidebar({ isVisible }: SubSidebarProps) {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  if (!isVisible) return null;

  return (
    <nav 
      style={{ 
        position: 'fixed',
        left: '60px', // メインサイドバーの右側
        top: '60px', // Topbarの高さ分下げる
        bottom: 0,
        width: '200px',
        backgroundColor: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        padding: '1rem',
        overflowY: 'auto',
        zIndex: 998,
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ 
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <h3 style={{ 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: '#475569',
          margin: 0
        }}>
          営業数値管理
        </h3>
      </div>
      
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {SALES_NAV.map((item) => {
          const active = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                textDecoration: "none",
                color: active ? "#3b82f6" : "#64748b",
                background: active ? "#eff6ff" : "#ffffff",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s ease",
                outline: "none",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                fontWeight: active ? "600" : "500",
                fontSize: "0.875rem",
                lineHeight: "1.4",
              }}
              aria-current={active ? "page" : undefined}
            >
              <span style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: active ? "#3b82f6" : "#94a3b8",
                minWidth: "16px",
                flexShrink: 0
              }}>
                {item.icon}
              </span>
              <span style={{ 
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
