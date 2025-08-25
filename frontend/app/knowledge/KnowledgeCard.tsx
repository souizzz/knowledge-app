"use client";
import Link from "next/link";
import { Knowledge } from "../../lib/api";

interface KnowledgeCardProps {
  knowledge: Knowledge;
  key?: string | number;
}

export default function KnowledgeCard({ knowledge }: KnowledgeCardProps) {
  return (
    <div style={{ 
      border: "1px solid #e5e7eb", 
      borderRadius: "8px", 
      padding: "1rem", 
      margin: "0.5rem 0",
      backgroundColor: "#f9f9f9",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ 
        margin: "0 0 0.5rem 0",
        color: "#1f2937",
        fontSize: "1.2rem"
      }}>
        {knowledge.title}
      </h3>
      
      <p style={{ 
        marginTop: "0.5rem",
        color: "#4b5563",
        lineHeight: "1.5"
      }}>
        {knowledge.content.length > 150 
          ? knowledge.content.slice(0, 150) + "..." 
          : knowledge.content
        }
      </p>

      <div style={{
        marginTop: "0.75rem",
        fontSize: "0.75rem",
        color: "#6b7280"
      }}>
        作成者: {knowledge.created_by} | 作成日: {new Date(knowledge.created_at).toLocaleDateString('ja-JP')}
      </div>
      
      <div style={{ marginTop: "1rem" }}>
        <Link 
          href={`/knowledge/${knowledge.id}`}
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}
        >
          詳細を見る →
        </Link>
      </div>
    </div>
  );
}

