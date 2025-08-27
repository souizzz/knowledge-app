"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'MEMBER' | 'OWNER';
  is_active: boolean;
  slack_id?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'OWNER'>('MEMBER');

  async function load() {
    try {
      const res = await api<{users: UserRow[]}>('/api/admin/users');
      setUsers(res.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  useEffect(() => { 
    load(); 
  }, []);

  async function invite() {
    try {
      const res = await api<{invite_url: string}>('/api/admin/invitations', { 
        method: 'POST', 
        body: JSON.stringify({ email, role }) 
      });
      alert(`招待URL: ${res.invite_url}`);
      setEmail('');
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('招待の送信に失敗しました');
    }
  }

  async function save(u: UserRow) {
    try {
      await api('/api/admin/users/patch?id=' + u.id, { 
        method: 'POST', 
        body: JSON.stringify({ role: u.role, is_active: u.is_active }) 
      });
      await load();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('ユーザーの保存に失敗しました');
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>ユーザー管理</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <input 
          placeholder='email@example.com' 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <select 
          value={role} 
          onChange={e => setRole(e.target.value as 'MEMBER' | 'OWNER')}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value='MEMBER'>MEMBER</option>
          <option value='OWNER'>OWNER</option>
        </select>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            invite();
          }} 
          disabled={!email}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: !email ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: !email ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '36px'
          }}
          onMouseOver={(e) => {
            if (email) {
              e.currentTarget.style.backgroundColor = '#0056b3';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            if (email) {
              e.currentTarget.style.backgroundColor = '#007bff';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
          onTouchStart={(e) => {
            if (email) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onTouchEnd={(e) => {
            if (email) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          招待
        </button>
      </div>
      <table style={{ marginTop: 16, width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>名前</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>メール</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Slack</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Role</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Active</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{u.name}</td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{u.email}</td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{u.slack_id ?? '-'}</td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                <select 
                  value={u.role} 
                  onChange={e => {
                    const updatedUsers = users.map(user => 
                      user.id === u.id ? { ...user, role: e.target.value as 'MEMBER' | 'OWNER' } : user
                    );
                    setUsers(updatedUsers);
                  }}
                  style={{ padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value='MEMBER'>MEMBER</option>
                  <option value='OWNER'>OWNER</option>
                </select>
              </td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                <input 
                  type='checkbox' 
                  checked={u.is_active} 
                  onChange={e => {
                    const updatedUsers = users.map(user => 
                      user.id === u.id ? { ...user, is_active: e.target.checked } : user
                    );
                    setUsers(updatedUsers);
                  }}
                />
              </td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    save(u);
                  }}
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '28px',
                    minWidth: '50px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e7e34';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#28a745';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  保存
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
