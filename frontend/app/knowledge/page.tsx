"use client";

import { useEffect, useState } from "react";
import { fetchKnowledge, Knowledge } from "../../lib/api";
import KnowledgeCard from "./KnowledgeCard";
import Link from "next/link";

export default function Home() {
  const [data, setData] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledge().then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ 
        fontSize: "2rem", 
        fontWeight: "700", 
        color: "#1f2937",
        marginBottom: "2rem"
      }}>
        ナレッジ一覧
      </h1>
      <div style={{ 
        marginBottom: "2rem", 
        display: "flex", 
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        <Link 
          href="/knowledge/knowledge-resister/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#3b82f6",
            color: "white",
            textDecoration: "none",
            borderRadius: "0.5rem",
            fontWeight: "500",
            fontSize: "1rem",
            transition: "all 0.2s ease",
            outline: "none",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent"
          }}
          onMouseOver={(e: React.MouseEvent) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#2563eb";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e: React.MouseEvent) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#3b82f6";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
          onTouchStart={(e: React.TouchEvent) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
          }}
          onTouchEnd={(e: React.TouchEvent) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          ➕ 新規追加
        </Link>
        <Link 
          href="/knowledge/knowledge-resister"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#10b981",
            color: "white",
            textDecoration: "none",
            borderRadius: "0.5rem",
            fontWeight: "500",
            fontSize: "1rem",
            transition: "all 0.2s ease",
            outline: "none",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent"
          }}
          onMouseOver={(e: React.MouseEvent) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#059669";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e: React.MouseEvent) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#10b981";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
          onTouchStart={(e: React.TouchEvent) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
          }}
          onTouchEnd={(e: React.TouchEvent) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          📝 ナレッジ管理
        </Link>
      </div>
      
      {loading ? (
        <div style={{ 
          textAlign: "center", 
          padding: "3rem",
          color: "#6b7280"
        }}>
          読み込み中...
        </div>
      ) : data.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "3rem",
          color: "#6b7280",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem"
        }}>
          <p style={{ margin: 0, fontSize: "1.125rem" }}>
            ナレッジが登録されていません
          </p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
            新規追加ボタンから新しいナレッジを追加してください
          </p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))"
        }}>
          {data.map((item: Knowledge) => (
            <KnowledgeCard key={item.id} knowledge={item} />
          ))}
        </div>
      )}
    </div>
  );
}
