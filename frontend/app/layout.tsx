import SettingsMenu from "@/components/SettingsMenu";

export const metadata = {
  title: 'Knowledge App',
  description: 'Knowledge App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <header style={{
          position: "fixed",
          right: "16px",
          top: "16px",
          zIndex: 50
        }}>
          <SettingsMenu />
        </header>
        <main style={{ minHeight: "100vh" }}>{children}</main>
      </body>
    </html>
  )
}
