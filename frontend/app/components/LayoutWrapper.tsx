"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import SettingsMenu from "../settings-menu/SettingsMenu";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const SIDEBAR_WIDTH = 240;

  // サイドバーを非表示にするページ
  const hideSidebarPages = ['/login', '/register', '/verify-email', '/verify-success', '/invite'];
  const shouldHideSidebar = hideSidebarPages.some(page => pathname?.startsWith(page));

  return (
    <>
      {/* 右上の設定（認証ページでは非表示） */}
      {!shouldHideSidebar && (
        <header style={{
          position: "fixed",
          right: 16,
          top: 16,
          zIndex: 50
        }}>
          <SettingsMenu />
        </header>
      )}

      {/* 左サイドバー（認証ページでは非表示） */}
      {!shouldHideSidebar && (
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: SIDEBAR_WIDTH,
            borderRight: "1px solid #e5e7eb",
            background: "#fff",
            padding: 12,
            zIndex: 40,
          }}
        >
          <Sidebar />
        </aside>
      )}

      {/* 右メイン（認証ページではフル幅） */}
      <main
        style={{
          minHeight: "100vh",
          marginLeft: shouldHideSidebar ? 0 : SIDEBAR_WIDTH,
          padding: shouldHideSidebar ? "0" : "24px 16px",
        }}
      >
        {children}
      </main>
    </>
  );
}
