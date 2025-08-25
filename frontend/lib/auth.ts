import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  slack_id?: string;
}

export async function getMe(): Promise<User | null> {
  try { 
    return await api<User>("/api/me");
  } catch { 
    return null;
  }
}