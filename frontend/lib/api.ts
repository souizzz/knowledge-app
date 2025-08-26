import { supabase } from './supabase';

export type Knowledge = {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
};

export async function fetchKnowledge(): Promise<Knowledge[]> {
  try {
    const { data, error } = await supabase
      .from('knowledge')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchKnowledge error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('fetchKnowledge error:', error);
    return [];
  }
}

export async function createKnowledge(data: Omit<Knowledge, "id" | "created_at" | "updated_at">) {
  const { data: result, error } = await supabase
    .from('knowledge')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return result;
}

export async function deleteKnowledge(id: number) {
  const { error } = await supabase
    .from('knowledge')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

// 認証関連の型定義
export type MeClaims = {
  sub: string;
  org_id: number;
  role: string;
  username: string;
  email?: string;
  iat: number;
  exp: number;
};

// 認証状態取得
export async function fetchMe(): Promise<MeClaims | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return null;
    }

    return {
      sub: user.id,
      org_id: userData.org_id,
      role: userData.role,
      username: userData.username,
      email: userData.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
  } catch {
    return null;
  }
}

// ログアウト
export async function logout(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

