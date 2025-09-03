import { supabase } from './supabase';

export type Knowledge = {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
};

// 認証関連の関数
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('getCurrentProfile error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('getCurrentProfile error:', error);
    return null;
  }
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('updateProfile error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('updateProfile error:', error);
    return null;
  }
}

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
  org_name: string;
  representative_name?: string;
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
      console.log('[fetchMe] No user found:', error);
      return null;
    }

    console.log('[fetchMe] User ID:', user.id);

    // profilesテーブルからユーザー情報を取得
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        org_members!inner (
          organizations (
            id,
            name,
            representative_name
          )
        )
      `)
      .eq('id', user.id)
      .single();

    console.log('[fetchMe] Profile data:', profileData);
    console.log('[fetchMe] Profile error:', profileError);

    if (profileError || !profileData) {
      console.log('[fetchMe] Failed to get profile data');
      return null;
    }

    // 組織情報の確認
    const orgName = profileData.org_members?.organizations?.name || 'Default Organization';
    const representativeName = profileData.org_members?.organizations?.representative_name || '';
    console.log('[fetchMe] Organization name:', orgName);

    return {
      sub: user.id,
      org_id: profileData.org_members?.organizations?.id || 0,
      org_name: orgName,
      representative_name: representativeName,
      role: 'member', // デフォルトロール
      username: profileData.name || user.email || '',
      email: profileData.email || user.email || '',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
  } catch (error) {
    console.error('[fetchMe] Error:', error);
    return null;
  }
}

// パスワード認証によるログイン
export async function loginWithPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }

    if (data.user) {
      return { success: true };
    }

    return { success: false, error: 'ログインに失敗しました' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'ネットワークエラーが発生しました' };
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(baseUrl + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

