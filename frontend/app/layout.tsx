import type { Metadata } from "next";
import Sidebar from "@/app/components/Sidebar";
import SettingsMenu from "@/app/settings-menu/SettingsMenu";

export const metadata: Metadata = {
  title: "Knowledge App",
  description: "Dashboard with fixed left sidebar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const SIDEBAR_WIDTH = 240;

  return (
    <html lang="ja">
      <body>
        {/* 右上の設定（そのまま） */}
        <header style={{
          position: "fixed",
          right: 16,
          top: 16,
          zIndex: 50
        }}>
          <SettingsMenu />
        </header>

        {/* 左サイドバー（共通UI） */}
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

        {/* 右メイン（全ページ共通オフセット） */}
        <main
          style={{
            minHeight: "100vh",
            marginLeft: SIDEBAR_WIDTH,
            padding: "24px 16px",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}

