import type { Metadata } from "next";
import LayoutWrapper from "./components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Knowledge App",
  description: "Dashboard with fixed left sidebar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}