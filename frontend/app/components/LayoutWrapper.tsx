"use client";

import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const SIDEBAR_WIDTH = 60; // 折りたたみ時の幅
  const TOPBAR_HEIGHT = 60;

  // サイドバーとトップバーを非表示にするページ
  const hideLayoutPages = ['/login', '/register', '/verify-email', '/verify-success', '/invite'];
  const shouldHideLayout = hideLayoutPages.some(page => pathname?.startsWith(page));

  return (
    <>
      {/* トップバー（認証ページでは非表示） */}
      {!shouldHideLayout && <Topbar />}

      {/* 左サイドバー（認証ページでは非表示） */}
      {!shouldHideLayout && <Sidebar />}

      {/* メインコンテンツエリア */}
      <main
        style={{
          minHeight: "100vh",
          marginLeft: shouldHideLayout ? 0 : SIDEBAR_WIDTH,
          marginTop: shouldHideLayout ? 0 : TOPBAR_HEIGHT,
          padding: shouldHideLayout ? "0" : "24px 16px",
          backgroundColor: "#f9fafb"
        }}
      >
        {children}
      </main>
    </>
  );
}
