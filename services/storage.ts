// Supabase Storage Service for persistent data
import { supabase } from './supabase';
import { Document, Process, ChatSession, User, ChatMessage, SectorType } from '../types';

class SupabaseStorageService {
  private currentUserId: string | null = null;

  async init(): Promise<void> {
    // Supabase client is already initialized
    console.log('Supabase storage service initialized');
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return (data || []).map(doc => ({
      id: doc.id,
      title: doc.title || doc.name,
      type: doc.type as 'PDF' | 'DOCX' | 'XLSX',
      sector: (doc.sector || doc.category || 'PROGEP') as SectorType,
      createdAt: doc.created_at,
      status: (doc.status || 'Draft') as 'Draft' | 'Published' | 'Archived',
      tags: doc.tags || [],
      summary: doc.summary || doc.description,
      author: doc.author || doc.uploaded_by || 'Sistema',
      size: doc.size || '0 KB'
    }));
  }

  async saveDocument(doc: Document): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .upsert({
        id: doc.id,
        title: doc.title,
        name: doc.title,
        type: doc.type,
        sector: doc.sector,
        category: doc.sector,
        status: doc.status,
        tags: doc.tags,
        summary: doc.summary,
        description: doc.summary,
        author: doc.author,
        uploaded_by: doc.author,
        size: doc.size
      });

    if (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // File storage methods using Supabase Storage
  async saveFile(id: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${id}.${fileExt}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async getFile(id: string): Promise<{ name: string; data: Blob; type: string } | null> {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(id);

    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }

    return {
      name: id,
      data: data,
      type: data.type
    };
  }

  // Process methods
  async getProcesses(): Promise<Process[]> {
    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching processes:', error);
      return [];
    }

    return (data || []).map(proc => ({
      id: proc.id,
      number: proc.number,
      title: proc.title,
      currentStep: proc.current_step || proc.status || 'Aguardando',
      status: (proc.status || 'Pending') as 'Pending' | 'In Progress' | 'Approved' | 'Rejected',
      assignedTo: proc.assigned_to || proc.assignee || 'Não atribuído',
      lastUpdate: proc.updated_at || proc.created_at,
      priority: (proc.priority || 'Medium') as 'Low' | 'Medium' | 'High'
    }));
  }

  async saveProcess(proc: Process): Promise<void> {
    const { error } = await supabase
      .from('processes')
      .upsert({
        id: proc.id,
        number: proc.number,
        title: proc.title,
        current_step: proc.currentStep,
        status: proc.status,
        assigned_to: proc.assignedTo,
        assignee: proc.assignedTo,
        priority: proc.priority
      });

    if (error) {
      console.error('Error saving process:', error);
      throw error;
    }
  }

  async getProcess(id: string): Promise<Process | null> {
    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching process:', error);
      return null;
    }

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      currentStep: data.current_step || data.status || 'Aguardando',
      status: (data.status || 'Pending') as 'Pending' | 'In Progress' | 'Approved' | 'Rejected',
      assignedTo: data.assigned_to || data.assignee || 'Não atribuído',
      lastUpdate: data.updated_at || data.created_at,
      priority: (data.priority || 'Medium') as 'Low' | 'Medium' | 'High'
    };
  }

  async deleteProcess(id: string): Promise<void> {
    const { error } = await supabase
      .from('processes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting process:', error);
      throw error;
    }
  }

  // Chat session methods
  async getChatSessions(): Promise<ChatSession[]> {
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching chat sessions:', sessionsError);
      return [];
    }

    // Fetch messages for each session
    const sessionsWithMessages = await Promise.all(
      (sessions || []).map(async (session) => {
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true });

        return {
          id: session.id,
          title: session.title,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
          messages: (messages || []).map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.created_at
          }))
        };
      })
    );

    return sessionsWithMessages;
  }

  async saveChatSession(session: ChatSession): Promise<void> {
    // Save session
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .upsert({
        id: session.id,
        title: session.title,
        user_id: this.currentUserId
      });

    if (sessionError) {
      console.error('Error saving chat session:', sessionError);
      throw sessionError;
    }

    // Save messages
    if (session.messages && session.messages.length > 0) {
      const messagesToSave = session.messages.map(msg => ({
        id: msg.id,
        session_id: session.id,
        role: msg.role,
        content: msg.content
      }));

      const { error: messagesError } = await supabase
        .from('chat_messages')
        .upsert(messagesToSave);

      if (messagesError) {
        console.error('Error saving chat messages:', messagesError);
        throw messagesError;
      }
    }
  }

  async deleteChatSession(id: string): Promise<void> {
    // Delete messages first (foreign key constraint)
    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', id);

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  // Settings methods
  async getSettings(): Promise<any | null> {
    if (!this.currentUserId) return null;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', this.currentUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return null;
      }
      console.error('Error fetching settings:', error);
      return null;
    }

    return {
      theme: data.theme,
      language: data.language,
      notifications: data.notifications,
      accessibility: data.accessibility
    };
  }

  async saveSettings(settings: any): Promise<void> {
    if (!this.currentUserId) {
      console.error('No user logged in');
      return;
    }

    const { error } = await supabase
      .from('settings')
      .upsert({
        user_id: this.currentUserId,
        theme: settings.theme,
        language: settings.language,
        notifications: settings.notifications,
        accessibility: settings.accessibility
      });

    if (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // User/Auth methods
  async saveUser(user: User & { password?: string }): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sector: user.sector,
        avatar_url: user.avatarUrl
      });

    if (error) {
      console.error('Error saving user:', error);
      throw error;
    }

    this.currentUserId = user.id;
    localStorage.setItem('currentUserId', user.id);
  }

  async getUser(): Promise<(User & { password?: string }) | null> {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    this.currentUserId = data.id;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as 'Admin' | 'Manager' | 'Operator' | 'Viewer',
      sector: data.sector as SectorType,
      avatarUrl: data.avatar_url
    };
  }

  async getUserByEmail(email: string): Promise<(User & { password?: string }) | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching user by email:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as 'Admin' | 'Manager' | 'Operator' | 'Viewer',
      sector: data.sector as SectorType,
      avatarUrl: data.avatar_url,
      password: data.password_hash
    };
  }

  async isAuthenticated(): Promise<boolean> {
    return localStorage.getItem('isAuthenticated') === 'true';
  }

  async setAuthenticated(value: boolean): Promise<void> {
    localStorage.setItem('isAuthenticated', String(value));
    if (!value) {
      localStorage.removeItem('currentUserId');
      this.currentUserId = null;
    }
  }

  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
    localStorage.setItem('currentUserId', userId);
  }
}

export const storage = new SupabaseStorageService();
