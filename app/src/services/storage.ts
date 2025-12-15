import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document, Process, ChatSession, User, SectorType, ProcessStatus } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  CHATS: 'uema_chats',
  USER: 'uema_user',
  AUTHENTICATED: 'uema_authenticated',
};

// Mapear status do banco para o enum do app
const mapProcessStatus = (dbStatus: string): ProcessStatus => {
  const statusMap: Record<string, ProcessStatus> = {
    'Pending': ProcessStatus.PENDING,
    'In Progress': ProcessStatus.IN_PROGRESS,
    'Approved': ProcessStatus.COMPLETED,
    'Rejected': ProcessStatus.REJECTED,
  };
  return statusMap[dbStatus] || ProcessStatus.PENDING;
};

// Mapear status do app para o banco
const mapProcessStatusToDb = (status: ProcessStatus): string => {
  const statusMap: Record<ProcessStatus, string> = {
    [ProcessStatus.PENDING]: 'Pending',
    [ProcessStatus.IN_PROGRESS]: 'In Progress',
    [ProcessStatus.COMPLETED]: 'Approved',
    [ProcessStatus.REJECTED]: 'Rejected',
  };
  return statusMap[status] || 'Pending';
};

class Storage {
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    // Inicializar apenas chats localmente (opcional para offline)
    const chats = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);
    if (!chats) {
      await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify([]));
    }
    
    this.initialized = true;
  }

  // Documents - Consumir do Supabase
  async getDocuments(): Promise<Document[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado. Configure as variáveis de ambiente.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar documentos:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(d => ({
        id: d.id,
        title: d.title || d.name || 'Sem título',
        type: (d.type || 'PDF') as 'PDF' | 'DOCX' | 'XLSX',
        sector: (d.sector || d.category || 'PROGEP') as SectorType,
        createdAt: d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: (d.status === 'Published' ? 'Published' : d.status === 'Archived' ? 'Archived' : 'Draft') as 'Draft' | 'Published' | 'Archived',
        tags: d.tags || [],
        summary: d.summary || d.description || '',
        author: d.author || d.uploaded_by || 'Sistema',
        size: d.size || 'N/A',
        fileUrl: d.file_url,
        content: d.content_text,
      }));
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
      return [];
    }
  }

  async saveDocument(doc: Document): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado');
      return;
    }

    try {
      const { error } = await supabase.from('documents').upsert({
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
        file_url: doc.fileUrl,
        size: doc.size,
      });

      if (error) {
        console.error('Erro ao salvar documento:', error);
      }
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
    }
  }

  async deleteDocument(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado');
      return;
    }

    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) {
        console.error('Erro ao deletar documento:', error);
      }
    } catch (err) {
      console.error('Erro ao deletar documento:', err);
    }
  }

  // Processes - Consumir do Supabase
  async getProcesses(): Promise<Process[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado. Configure as variáveis de ambiente.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar processos:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(p => ({
        id: p.id,
        number: p.number || `PROC-${Date.now()}`,
        title: p.title || 'Sem título',
        description: p.description || '',
        currentStep: parseInt(p.current_step) || 1,
        totalSteps: parseInt(p.total_steps) || 5,
        status: mapProcessStatus(p.status),
        sector: (p.sector || 'PROGEP') as SectorType,
        assignedTo: p.assigned_to || p.assignee || undefined,
        createdAt: p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        lastUpdate: p.updated_at?.split('T')[0] || undefined,
        priority: (p.priority || 'Medium') as 'Low' | 'Medium' | 'High',
      }));
    } catch (err) {
      console.error('Erro ao buscar processos:', err);
      return [];
    }
  }

  async saveProcess(proc: Process): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado');
      return;
    }

    try {
      const { error } = await supabase.from('processes').upsert({
        id: proc.id,
        number: proc.number,
        title: proc.title,
        description: proc.description,
        current_step: proc.currentStep?.toString(),
        total_steps: proc.totalSteps?.toString(),
        status: mapProcessStatusToDb(proc.status),
        sector: proc.sector,
        assigned_to: proc.assignedTo,
        assignee: proc.assignedTo,
        priority: proc.priority,
      });

      if (error) {
        console.error('Erro ao salvar processo:', error);
      }
    } catch (err) {
      console.error('Erro ao salvar processo:', err);
    }
  }

  async deleteProcess(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado');
      return;
    }

    try {
      const { error } = await supabase.from('processes').delete().eq('id', id);
      if (error) {
        console.error('Erro ao deletar processo:', error);
      }
    } catch (err) {
      console.error('Erro ao deletar processo:', err);
    }
  }

  // Chat Sessions - Armazenado localmente + Supabase
  async getChatSessions(): Promise<ChatSession[]> {
    await this.init();
    
    // Primeiro tenta buscar do Supabase
    if (isSupabaseConfigured()) {
      try {
        const user = await this.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('chat_sessions')
            .select(`
              id,
              title,
              created_at,
              updated_at,
              chat_messages (
                id,
                role,
                content,
                created_at
              )
            `)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (!error && data && data.length > 0) {
            return data.map(s => ({
              id: s.id,
              title: s.title || 'Nova conversa',
              createdAt: s.created_at,
              updatedAt: s.updated_at,
              messages: (s.chat_messages || []).map((m: any) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: m.created_at,
              })),
            }));
          }
        }
      } catch (err) {
        console.log('Usando chat local');
      }
    }
    
    // Fallback para storage local
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);
    return data ? JSON.parse(data) : [];
  }

  async saveChatSession(session: ChatSession): Promise<void> {
    // Salvar localmente
    const sessions = await this.getChatSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(sessions));

    // Tentar salvar no Supabase
    if (isSupabaseConfigured()) {
      try {
        const user = await this.getUser();
        if (user) {
          // Salvar sessão
          await supabase.from('chat_sessions').upsert({
            id: session.id,
            user_id: user.id,
            title: session.title,
          });

          // Salvar mensagens
          if (session.messages && session.messages.length > 0) {
            const messages = session.messages.map(m => ({
              id: m.id,
              session_id: session.id,
              role: m.role,
              content: m.content,
              created_at: m.timestamp,
            }));
            await supabase.from('chat_messages').upsert(messages);
          }
        }
      } catch (err) {
        console.log('Chat salvo apenas localmente');
      }
    }
  }

  async deleteChatSession(id: string): Promise<void> {
    const sessions = await this.getChatSessions();
    const filtered = sessions.filter(s => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(filtered));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('chat_sessions').delete().eq('id', id);
      } catch (err) {
        console.log('Chat deletado apenas localmente');
      }
    }
  }

  // User - Buscar do Supabase
  async getUser(): Promise<User | null> {
    // Primeiro verifica cache local
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  // Autenticação com Supabase
  async login(email: string, password: string): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado');
      return null;
    }

    try {
      // Buscar usuário pelo email e senha
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single();

      if (error || !data) {
        console.error('Erro no login:', error);
        return null;
      }

      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as User['role'],
        sector: data.sector as SectorType,
        avatarUrl: data.avatar_url,
      };

      await this.saveUser(user);
      await this.setAuthenticated(true);
      return user;
    } catch (err) {
      console.error('Erro no login:', err);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTHENTICATED);
    return data === 'true';
  }

  async setAuthenticated(value: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTHENTICATED, value ? 'true' : 'false');
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.AUTHENTICATED,
      STORAGE_KEYS.CHATS,
    ]);
  }

  async clearAll(): Promise<void> {
    await this.logout();
  }
}

export const storage = new Storage();
