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

// ==========================================
// AUTENTICAÇÃO SUPABASE AUTH
// ==========================================

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  sector?: string;
  avatarUrl?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Serviço de Autenticação
export const authService = {
  // Login com email e senha
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Buscar perfil do usuário
        const profile = await this.getProfile(data.user.id);
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.name || email.split('@')[0],
            role: profile?.role || 'user',
            sector: profile?.sector,
            avatarUrl: profile?.avatar_url,
          },
        };
      }

      return { success: false, error: 'Erro desconhecido' };
    } catch (err) {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  },

  // Cadastro com email e senha
  async signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Criar perfil do usuário
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          name: name || email.split('@')[0],
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email!,
            name: name || email.split('@')[0],
            role: 'user',
          },
        };
      }

      return { success: false, error: 'Erro desconhecido' };
    } catch (err) {
      return { success: false, error: 'Erro ao criar conta' };
    }
  },

  // Logout
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUserId');
  },

  // Verificar sessão atual
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const profile = await this.getProfile(user.id);
      return {
        id: user.id,
        email: user.email!,
        name: profile?.name || user.email!.split('@')[0],
        role: profile?.role || 'user',
        sector: profile?.sector,
        avatarUrl: profile?.avatar_url,
      };
    }

    return null;
  },

  // Buscar perfil do usuário
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  },

  // Atualizar perfil
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return !error;
  },

  // Recuperar senha
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  // Listener de mudanças de autenticação
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        callback({
          id: session.user.id,
          email: session.user.email!,
          name: profile?.name || session.user.email!.split('@')[0],
          role: profile?.role || 'user',
          sector: profile?.sector,
          avatarUrl: profile?.avatar_url,
        });
      } else {
        callback(null);
      }
    });
  },
};

// ==========================================
// REALTIME NOTIFICATIONS
// ==========================================

export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  createdAt: string;
}

export const realtimeService = {
  // Inscrever para notificações em tempo real
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: RealtimeNotification) => void
  ) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as any;
          onNotification({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            createdAt: notification.created_at,
          });
        }
      )
      .subscribe();
  },

  // Inscrever para mudanças em documentos
  subscribeToDocuments(onDocumentChange: (payload: any) => void) {
    return supabase
      .channel('documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        onDocumentChange
      )
      .subscribe();
  },

  // Inscrever para mudanças em processos
  subscribeToProcesses(onProcessChange: (payload: any) => void) {
    return supabase
      .channel('processes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'processes' },
        onProcessChange
      )
      .subscribe();
  },

  // Cancelar inscrição
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  },

  // Enviar notificação
  async sendNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    await supabase.from('notifications').insert({
      ...notification,
      created_at: new Date().toISOString(),
    });
  },

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  },

  // Buscar notificações não lidas
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    return data || [];
  },
};
