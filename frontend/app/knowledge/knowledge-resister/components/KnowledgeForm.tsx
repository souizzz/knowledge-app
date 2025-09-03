"use client";

import { useState, useEffect } from 'react';
import { Knowledge, getCurrentUser } from '../../../../lib/api';

interface KnowledgeFormProps {
  knowledge?: Knowledge | null;
  onSubmit: (knowledge: any) => Promise<any>;
  onCancel?: () => void;
}

export default function KnowledgeForm({ knowledge, onSubmit, onCancel }: KnowledgeFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userId, setUserId] = useState<string>(''); // Current user ID
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeForm = async () => {
      if (knowledge) {
        setTitle(knowledge.title);
        setContent(knowledge.content);
        setUserId(knowledge.user_id);
      } else {
        setTitle('');
        setContent('');
        // 現在のユーザーIDを取得
        const user = await getCurrentUser();
        setUserId(user?.id || '');
      }
      setError(null);
    };
    
    initializeForm();
  }, [knowledge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('タイトルと内容は必須です');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const knowledgeData = knowledge 
        ? { ...knowledge, title: title.trim(), content: content.trim() }
        : { title: title.trim(), content: content.trim(), user_id: userId };
      
      console.log('KnowledgeForm: Submitting data:', knowledgeData);
      
      await onSubmit(knowledgeData);
      
      // Reset form only if creating new knowledge
      if (!knowledge) {
        setTitle('');
        setContent('');
        const user = await getCurrentUser();
        setUserId(user?.id || '');
      }
      
      console.log('KnowledgeForm: Successfully submitted');
    } catch (err) {
      console.error('KnowledgeForm: Submit error:', err);
      const errorMessage = err instanceof Error ? err.message : '操作に失敗しました';
      setError(`操作に失敗しました: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setTitle('');
    setContent('');
    const user = await getCurrentUser();
    setUserId(user?.id || '');
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      backgroundColor: '#f9fafb'
    }}>
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '0.375rem',
          color: '#dc2626',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

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
          rows={6}
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

      {!knowledge && (
        <div>
          <label htmlFor="userId" style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#374151'
          }}>
            ユーザーID
          </label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={submitting}
            placeholder="現在のユーザーID"
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
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
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
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
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
          {submitting ? '処理中...' : (knowledge ? '更新する' : '追加する')}
        </button>

        {knowledge && onCancel && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCancel();
            }}
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
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
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
        )}
      </div>
    </form>
  );
}
