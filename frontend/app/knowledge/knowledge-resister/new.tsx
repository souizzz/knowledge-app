"use client";

import { useState } from "react";
import { createKnowledge } from "../../../lib/api";
import { useRouter } from "next/navigation";

export default function NewKnowledge() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('タイトルと内容は必須です');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createKnowledge({ 
        title: title.trim(), 
        content: content.trim(), 
        user_id: 1 
      });
      router.push("/knowledge/knowledge-resister");
    } catch (err) {
      console.error('Failed to create knowledge:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`ナレッジの作成に失敗しました: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ 
      padding: "2rem", 
      maxWidth: "800px", 
      margin: "0 auto",
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ 
        marginBottom: "2rem",
        color: "#1f2937",
        fontSize: "2rem",
        fontWeight: "bold"
      }}>
        ナレッジ追加
      </h1>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '0.375rem',
          color: '#dc2626',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        backgroundColor: '#f9fafb'
      }}>
        <div>
          <label htmlFor="title" style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#374151'
          }}>
            タイトル <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting}
            placeholder="例: 営業トークのポイント"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              backgroundColor: submitting ? '#f3f4f6' : 'white',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label htmlFor="content" style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#374151'
          }}>
            内容 <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            disabled={submitting}
            rows={8}
            placeholder="例: 最初に相手の課題を聞くことが大切です。"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              backgroundColor: submitting ? '#f3f4f6' : 'white',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: submitting ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseOver={(e) => {
              if (!submitting && title.trim() && content.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!submitting && title.trim() && content.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onTouchStart={(e) => {
              if (!submitting && title.trim() && content.trim()) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (!submitting && title.trim() && content.trim()) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {submitting ? '保存中...' : '保存'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseOver={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onTouchStart={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
