"use client";

import { useEffect, useState } from "react";
import { fetchKnowledge, Knowledge } from "../lib/api";
import KnowledgeCard from "../components/KnowledgeCard";
import Link from "next/link";

export default function Home() {
  const [data, setData] = useState<Knowledge[]>([]);

  useEffect(() => {
    fetchKnowledge().then(setData);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>ナレッジ一覧</h1>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
        <Link href="/knowledge/new">➕ 新規追加</Link>
        <Link href="/knowledge" style={{ 
          color: "#3b82f6", 
          textDecoration: "none",
          fontWeight: "500"
        }}>
          📝 ナレッジ管理
        </Link>
      </div>
      <div style={{ marginTop: "1rem" }}>
        {data.map((item: Knowledge) => (
          <KnowledgeCard key={item.id} knowledge={item} />
        ))}
      </div>
    </div>
  );
}
