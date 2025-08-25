"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/knowledge", label: "ナレッジ管理＆登録" },
  { href: "/seles-metrics", label: "営業数値管理" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <nav style={{ display: "grid", gap: 8 }}>
      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            style={{
              display: "block",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              textDecoration: "none",
              color: "inherit",
              background: active ? "#f5f7fb" : "#fff",
              boxShadow: active ? "0 8px 24px rgba(0,0,0,.06)" : "none",
            }}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
