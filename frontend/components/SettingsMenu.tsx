"use client";
import { useEffect, useRef, useState } from "react";
import { fetchMe, logout } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SettingsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) fetchMe().then((me) => setEmail(me?.email ?? null));
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        btnRef.current && !btnRef.current.contains(target)
      ) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  async function onLogout() {
    setIsLoggingOut(true);
    const ok = await logout();
    if (!ok) {
      alert("ログアウトに失敗しました");
      setIsLoggingOut(false);
      return;
    }
    setOpen(false);
    router.replace("/login"); // ← 成功時は必ずログインページへ
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "1px solid #d1d5db",
          padding: "12px",
          fontSize: "14px",
          backgroundColor: "white",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        title="設定"
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.backgroundColor = "#f9fafb";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.backgroundColor = "white";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M19.14,12.94a7.43,7.43,0,0,0,.05-1,7.43,7.43,0,0,0-.05-1l2.11-1.65a.5.5,0,0,0,.12-.64l-2-3.46a.5.5,0,0,0-.6-.22l-2.49,1a7.28,7.28,0,0,0-1.73-1l-.38-2.65A.5.5,0,0,0,13,1H11a.5.5,0,0,0-.5.42L10.12,4.07a7.28,7.28,0,0,0-1.73,1l-2.49-1a.5.5,0,0,0-.6.22l-2,3.46a.5.5,0,0,0,.12.64L3.65,10a7.43,7.43,0,0,0-.05,1,7.43,7.43,0,0,0,.05,1L1.54,13.65a.5.5,0,0,0-.12.64l2,3.46a.5.5,0,0,0,.6.22l2.49-1a7.28,7.28,0,0,0,1.73,1l.38,2.65A.5.5,0,0,0,11,23h2a.5.5,0,0,0,.5-.42l.38-2.65a7.28,7.28,0,0,0,1.73-1l2.49,1a.5.5,0,0,0,.6-.22l2-3.46a.5.5,0,0,0-.12-.64ZM12,15.5A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: "absolute",
            right: "0",
            marginTop: "8px",
            width: "240px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            backgroundColor: "white",
            padding: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 1000,
          }}
        >
          <div style={{ marginBottom: "8px", fontSize: "12px", color: "#6b7280" }}>
            ログイン中
          </div>
          <div style={{ 
            marginBottom: "12px", 
            fontSize: "14px", 
            fontWeight: "500",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {email ?? "（メール情報なし）"}
          </div>
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            style={{
              width: "100%",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              padding: "8px 12px",
              textAlign: "left",
              fontSize: "14px",
              backgroundColor: isLoggingOut ? "#f3f4f6" : "white",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
              opacity: isLoggingOut ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoggingOut) {
                (e.target as HTMLElement).style.backgroundColor = "#f9fafb";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) {
                (e.target as HTMLElement).style.backgroundColor = "white";
              }
            }}
          >
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      )}
    </div>
  );
}
