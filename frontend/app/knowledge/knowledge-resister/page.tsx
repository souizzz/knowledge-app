"use client";

import { useState, useEffect } from 'react';
import { Knowledge } from '../../../lib/api';
import KnowledgeList from './components/KnowledgeList';
import KnowledgeForm from './components/KnowledgeForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function KnowledgePage() {
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);

  // Fetch all knowledge entries
  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      console.log('Fetching knowledge from:', `${API_URL}/api/knowledge`);
      
      const response = await fetch(`${API_URL}/api/knowledge`);
      console.log('Fetch response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Fetched knowledge data:', data);
      setKnowledgeList(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch knowledge:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load knowledge: ${errorMessage}`);
      setKnowledgeList([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new knowledge entry
  const createKnowledge = async (knowledge: Omit<Knowledge, 'id' | 'created_at'>) => {
    try {
      console.log('Creating knowledge with data:', knowledge);
      console.log('API URL:', `${API_URL}/api/knowledge`);
      
      const response = await fetch(`${API_URL}/api/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(knowledge),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const newKnowledge = await response.json();
      console.log('Created knowledge:', newKnowledge);
      setKnowledgeList(prev => [newKnowledge, ...prev]);
      setError(null); // Clear any previous errors
      return newKnowledge;
    } catch (err) {
      console.error('Failed to create knowledge:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to create knowledge: ${errorMessage}`);
      throw err;
    }
  };

  // Update knowledge entry
  const updateKnowledge = async (knowledge: Knowledge) => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/${knowledge.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: knowledge.title,
          content: knowledge.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedKnowledge = await response.json();
      setKnowledgeList(prev => 
        prev.map(k => k.id === knowledge.id ? updatedKnowledge : k)
      );
      setEditingKnowledge(null);
      return updatedKnowledge;
    } catch (err) {
      console.error('Failed to update knowledge:', err);
      setError('Failed to update knowledge entry');
      throw err;
    }
  };

  // Delete knowledge entry
  const deleteKnowledge = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setKnowledgeList(prev => prev.filter(k => k.id !== id));
      setEditingKnowledge(null);
    } catch (err) {
      console.error('Failed to delete knowledge:', err);
      setError('Failed to delete knowledge entry');
      throw err;
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ 
          margin: 0, 
          color: '#1f2937',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          ナレッジ管理
        </h1>
        <button
          onClick={() => fetchKnowledge()}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? '読み込み中...' : '更新'}
        </button>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Form Section */}
        <div>
          <h2 style={{ 
            marginBottom: '1rem', 
            color: '#374151',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            {editingKnowledge ? 'ナレッジを編集' : '新しいナレッジを追加'}
          </h2>
          <KnowledgeForm
            knowledge={editingKnowledge}
            onSubmit={editingKnowledge ? updateKnowledge : createKnowledge}
            onCancel={() => setEditingKnowledge(null)}
          />
        </div>

        {/* List Section */}
        <div>
          <h2 style={{ 
            marginBottom: '1rem', 
            color: '#374151',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            登録済みナレッジ ({knowledgeList.length}件)
          </h2>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#6b7280'
            }}>
              読み込み中...
            </div>
          ) : (
            <KnowledgeList
              knowledgeList={knowledgeList}
              onEdit={setEditingKnowledge}
              onDelete={deleteKnowledge}
            />
          )}
        </div>
      </div>
    </div>
  );
}
