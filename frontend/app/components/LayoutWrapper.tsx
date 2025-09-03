"use client";

import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import SubSidebar from "./SalesMetricsSubSidebar";
import Topbar from "./Topbar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const SIDEBAR_WIDTH = 60; // 折りたたみ時の幅
  const SUB_SIDEBAR_WIDTH = 200; // サブサイドバーの幅
  const TOPBAR_HEIGHT = 60;

  // サイドバーとトップバーを非表示にするページ
  const hideLayoutPages = ['/login', '/register', '/verify-email', '/verify-success', '/invite'];
  const shouldHideLayout = hideLayoutPages.some(page => pathname?.startsWith(page));

  // サブサイドバーを表示するページ（営業数値管理関連の全ページ）
  const showSubSidebar = pathname?.startsWith('/seles-metrics');

  // デバッグ用ログ
  if (typeof window !== 'undefined') {
    console.log('LayoutWrapper Debug:', {
      pathname,
      showSubSidebar,
      shouldHideLayout
    });
  }

  // メインコンテンツの左マージンを計算
  const getMainMarginLeft = () => {
    if (shouldHideLayout) return 0;
    if (showSubSidebar) return SIDEBAR_WIDTH + SUB_SIDEBAR_WIDTH;
    return SIDEBAR_WIDTH;
  };

  return (
    <>
      {/* トップバー（認証ページでは非表示） */}
      {!shouldHideLayout && <Topbar />}

      {/* 左サイドバー（認証ページでは非表示） */}
      {!shouldHideLayout && <Sidebar />}

      {/* サブサイドバー（営業数値管理ページでのみ表示） */}
      {!shouldHideLayout && showSubSidebar && <SubSidebar isVisible={true} />}

      {/* メインコンテンツエリア */}
      <main
        style={{
          minHeight: "100vh",
          marginLeft: getMainMarginLeft(),
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
