/// <reference types="../vite-env.d.ts" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Using local storage fallback.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Tipos do banco de dados
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';
export type DocumentType = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'TXT' | 'IMG' | 'OTHER';
export type DocumentStatus = 'draft' | 'pending' | 'published' | 'archived';
export type ProcessStatus = 'Pending' | 'InProgress' | 'Approved' | 'Rejected' | 'Cancelled';
export type ProcessPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  sector?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface DbDocument {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  file_url?: string;
  file_size?: number;
  tags: string[];
  content_text?: string;
  sector?: string;
  author_id?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  version: number;
  parent_id?: string;
}

export interface DbProcess {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: ProcessStatus;
  priority: ProcessPriority;
  requester_id?: string;
  assigned_to?: string;
  current_sector?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  completed_at?: string;
  document_ids: string[];
}

export interface ProcessHistory {
  id: string;
  process_id: string;
  from_status?: ProcessStatus;
  to_status: ProcessStatus;
  from_sector?: string;
  to_sector?: string;
  comment?: string;
  performed_by?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  email_processes: boolean;
  email_documents: boolean;
  push_browser: boolean;
  daily_summary: boolean;
  ai_suggestions: boolean;
  ai_auto_tagging: boolean;
  ai_auto_summary: boolean;
  ai_model: string;
  two_factor_enabled: boolean;
  session_timeout: number;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  created_at: string;
}

// Verificar se Supabase está configurado
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && 
         supabaseUrl !== 'https://placeholder.supabase.co';
};
