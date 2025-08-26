"use client";

import { useState } from 'react';
import { Knowledge } from '../../../../lib/api';

interface KnowledgeListProps {
  knowledgeList: Knowledge[];
  onEdit: (knowledge: Knowledge) => void;
  onDelete: (id: number) => Promise<void>;
}

export default function KnowledgeList({ knowledgeList, onEdit, onDelete }: KnowledgeListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (knowledge: Knowledge) => {
    if (!window.confirm(`「${knowledge.title}」を削除しますか？`)) {
      return;
    }

    setDeletingId(knowledge.id);
    try {
      await onDelete(knowledge.id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (knowledgeList.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem'
      }}>
        <p style={{ margin: 0, fontSize: '1.125rem' }}>
          ナレッジが登録されていません
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
          左側のフォームから新しいナレッジを追加してください
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem',
      maxHeight: '600px',
      overflowY: 'auto',
      padding: '0.5rem'
    }}>
      {knowledgeList.map((knowledge) => (
        <div
          key={knowledge.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'box-shadow 0.2s'
          }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <h3 style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              lineHeight: 1.4
            }}>
              {knowledge.title}
            </h3>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.75rem',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              <span>ユーザーID: {knowledge.user_id}</span>
              <span>作成日: {formatDate(knowledge.created_at)}</span>
            </div>
          </div>

          <p style={{
            margin: '0 0 1rem 0',
            color: '#4b5563',
            lineHeight: 1.6,
            fontSize: '0.875rem'
          }}>
            {knowledge.content.length > 150 
              ? `${knowledge.content.substring(0, 150)}...` 
              : knowledge.content
            }
          </p>

          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => onEdit(knowledge)}
              disabled={deletingId === knowledge.id}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: deletingId === knowledge.id ? 'not-allowed' : 'pointer',
                opacity: deletingId === knowledge.id ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (deletingId !== knowledge.id) {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseOut={(e) => {
                if (deletingId !== knowledge.id) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              編集
            </button>
            
            <button
              onClick={() => handleDelete(knowledge)}
              disabled={deletingId === knowledge.id}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: deletingId === knowledge.id ? '#9ca3af' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: deletingId === knowledge.id ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (deletingId !== knowledge.id) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
              onMouseOut={(e) => {
                if (deletingId !== knowledge.id) {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }
              }}
            >
              {deletingId === knowledge.id ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
