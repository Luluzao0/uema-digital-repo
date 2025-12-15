// Supabase Storage Service for persistent data
import { supabase, isSupabaseConfigured } from './supabase';
import { Document, Process, ChatSession, User, ChatMessage, SectorType } from '../types';

// Helper function
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Mapeamento de setores (app -> banco)
const sectorToDb: Record<string, string> = {
  'PROGEP': 'Pró-Reitoria de Administração',
  'PROPLAD': 'Pró-Reitoria de Graduação',
  'PROTOCOLO': 'Secretaria Geral',
  'PROEXAE': 'Pró-Reitoria de Extensão',
  'PPG': 'Pró-Reitoria de Pesquisa',
  'PROG': 'Coordenação de Curso'
};

// Mapeamento de setores (banco -> app)
const sectorFromDb: Record<string, SectorType> = {
  'Pró-Reitoria de Administração': SectorType.PROGEP,
  'Pró-Reitoria de Graduação': SectorType.PROPLAD,
  'Secretaria Geral': SectorType.PROTOCOLO,
  'Pró-Reitoria de Extensão': SectorType.PROEXAE,
  'Pró-Reitoria de Pesquisa': SectorType.PPG,
  'Coordenação de Curso': SectorType.PROG,
  'Reitoria': SectorType.PROGEP,
  'Biblioteca Central': SectorType.PROTOCOLO,
  'Núcleo de Tecnologia': SectorType.PROPLAD
};

// Mapeamento de roles (app -> banco)
const roleToDb: Record<string, string> = {
  'Admin': 'admin',
  'Manager': 'manager',
  'Operator': 'user',
  'Viewer': 'viewer'
};

// Mapeamento de roles (banco -> app)
// Suporta tanto minúsculo (Supabase) quanto maiúsculo (schema.sql)
const roleFromDb: Record<string, string> = {
  'admin': 'Admin',
  'Admin': 'Admin',
  'manager': 'Manager',
  'Manager': 'Manager',
  'user': 'Operator',
  'User': 'Operator',
  'Operator': 'Operator',
  'operator': 'Operator',
  'viewer': 'Viewer',
  'Viewer': 'Viewer'
};

// Função exportada para mapear role do banco para o formato da aplicação
export function mapRoleFromDb(dbRole: string | undefined | null): 'Admin' | 'Manager' | 'Operator' | 'Viewer' {
  if (!dbRole) return 'Operator';
  return (roleFromDb[dbRole] || 'Operator') as 'Admin' | 'Manager' | 'Operator' | 'Viewer';
}

// ==========================================
// SUPABASE STORAGE (FILES) SERVICE
// ==========================================
export const fileStorage = {
  // Upload de arquivo para o bucket 'documents'
  async uploadFile(file: File, path?: string): Promise<{ url: string; path: string } | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado, usando fallback local');
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return {
        url: data.publicUrl,
        path: filePath
      };
    } catch (err) {
      console.error('Erro no upload de arquivo:', err);
      return null;
    }
  },

  // Download de arquivo
  async downloadFile(path: string): Promise<Blob | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(path);

      if (error) {
        console.error('Erro no download:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Erro no download de arquivo:', err);
      return null;
    }
  },

  // Deletar arquivo
  async deleteFile(path: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([path]);

      return !error;
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err);
      return false;
    }
  },

  // Listar arquivos de uma pasta
  async listFiles(folder?: string): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list(folder || '', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) return [];
      return data.map(f => f.name);
    } catch (err) {
      return [];
    }
  },

  // Obter URL pública de um arquivo
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Criar URL assinada (temporária) para acesso privado
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, expiresIn);

      if (error) return null;
      return data.signedUrl;
    } catch (err) {
      return null;
    }
  },

  // Extrair texto de documento (para RAG)
  async extractTextFromFile(file: File): Promise<string> {
    // Para arquivos de texto puro
    if (file.type === 'text/plain') {
      return await file.text();
    }

    // Para PDFs - tentar extrair texto básico
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await this.extractTextFromPDF(arrayBuffer);
        if (text && text.length > 50) {
          return text;
        }
      } catch (e) {
        console.log('PDF text extraction failed, using metadata');
      }
    }

    // Para documentos Word
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await this.extractTextFromDOCX(arrayBuffer);
        if (text && text.length > 50) {
          return text;
        }
      } catch (e) {
        console.log('DOCX text extraction failed, using metadata');
      }
    }

    // Para outros tipos, retornar metadados
    return `Documento: ${file.name} (${file.type})`;
  },

  // Extração básica de texto de PDF (busca por strings de texto no binário)
  async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    const bytes = new Uint8Array(arrayBuffer);
    const text: string[] = [];

    // Buscar por streams de texto no PDF
    let inText = false;
    let currentText = '';

    for (let i = 0; i < bytes.length - 1; i++) {
      // Detectar início de texto (BT) e fim (ET)
      if (bytes[i] === 66 && bytes[i + 1] === 84) { // BT
        inText = true;
        continue;
      }
      if (bytes[i] === 69 && bytes[i + 1] === 84) { // ET
        if (currentText.trim()) {
          text.push(currentText.trim());
        }
        currentText = '';
        inText = false;
        continue;
      }

      // Capturar caracteres imprimíveis
      if (inText && bytes[i] >= 32 && bytes[i] <= 126) {
        currentText += String.fromCharCode(bytes[i]);
      }
    }

    // Também buscar por texto entre parênteses (formato comum em PDFs)
    const stringContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const matches = stringContent.match(/\(([^)]{3,})\)/g);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.slice(1, -1).replace(/\\/g, '');
        if (cleaned.length > 3 && /[a-zA-Z]/.test(cleaned)) {
          text.push(cleaned);
        }
      });
    }

    return text.join(' ').substring(0, 5000); // Limitar tamanho
  },

  // Extração básica de texto de DOCX (arquivo ZIP com XML)
  async extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // DOCX é um arquivo ZIP, precisamos descompactar
      // Esta é uma extração simplificada - procura por texto XML
      const bytes = new Uint8Array(arrayBuffer);
      const content = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

      // Buscar por conteúdo de texto no XML
      const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (textMatches) {
        const text = textMatches
          .map(match => match.replace(/<[^>]+>/g, ''))
          .filter(t => t.trim().length > 0)
          .join(' ');
        return text.substring(0, 5000);
      }

      return '';
    } catch (e) {
      return '';
    }
  }
};

class SupabaseStorageService {
  private currentUserId: string | null = null;

  async init(): Promise<void> {
    // Supabase client is already initialized
    console.log('Supabase storage service initialized');
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          author:profiles!author_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching documents:', error);
        return [];
      }

      const supabaseDocs: Document[] = (data || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type as 'PDF' | 'DOCX' | 'XLSX',
        sector: (doc.sector ? sectorFromDb[doc.sector] : SectorType.PROGEP) || SectorType.PROGEP,
        createdAt: doc.created_at,
        status: capitalizeFirst(doc.status || 'draft') as 'Draft' | 'Published' | 'Archived',
        tags: doc.tags || [],
        summary: doc.description || '', // description no banco -> summary no app
        author: doc.author?.name || 'Sistema',
        size: doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : '0 KB',
        fileUrl: doc.file_url || undefined // caminho do arquivo no storage
      }));

      return supabaseDocs;
    } catch (err) {
      console.error('Error fetching documents from Supabase:', err);
      return [];
    }
  }

  async saveDocument(doc: Document): Promise<void> {
    try {
      // Mapear sector do app para o banco
      const dbSector = doc.sector ? sectorToDb[doc.sector] || null : null;

      // Obter o usuário autenticado do Supabase para o author_id
      const { data: { user } } = await supabase.auth.getUser();
      const authorId = user?.id || this.currentUserId;

      if (!authorId) {
        console.warn('No authenticated user found - document will be saved without author_id');
      }

      const { error } = await supabase
        .from('documents')
        .upsert({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          sector: dbSector, // setor convertido para enum do banco
          status: (doc.status || 'draft').toLowerCase(), // status em minúsculo: draft, pending, published, archived
          tags: doc.tags || [],
          description: doc.summary || '', // coluna correta é 'description', não 'summary'
          author_id: authorId, // OBRIGATÓRIO para RLS policy
          file_url: doc.fileUrl || null, // caminho do arquivo no storage
          file_size: doc.size ? parseInt(doc.size.replace(/[^0-9]/g, '')) || null : null,
          created_at: doc.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Supabase error saving document:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving document to Supabase:', err);
      throw err;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document from Supabase:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
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

    // Retornar o path relativo para uso no download
    return filePath;
  }

  async getFile(filePath: string): Promise<{ name: string; data: Blob; type: string } | null> {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        console.error('Error downloading file:', error);
        return null;
      }

      // Extrair nome do arquivo do path
      const fileName = filePath.split('/').pop() || filePath;

      return {
        name: fileName,
        data: data,
        type: data.type
      };
    } catch (err) {
      console.error('Error in getFile:', err);
      return null;
    }
  }

  // Process methods - schema: id, number, title, description, status, priority, requester_id, assigned_to, current_sector
  async getProcesses(): Promise<Process[]> {
    const { data, error } = await supabase
      .from('processes')
      .select(`
        *,
        assignee:profiles!assigned_to(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching processes:', error);
      return [];
    }

    return (data || []).map(proc => ({
      id: proc.id,
      number: proc.number,
      title: proc.title,
      currentStep: proc.current_sector || proc.status || 'Aguardando',
      status: (proc.status || 'Pending') as 'Pending' | 'In Progress' | 'Approved' | 'Rejected',
      assignedTo: proc.assignee?.name || 'Não atribuído',
      lastUpdate: proc.updated_at || proc.created_at,
      priority: (proc.priority || 'Medium') as 'Low' | 'Medium' | 'High'
    }));
  }

  async saveProcess(proc: Process): Promise<void> {
    // Gerar número do processo se não existir
    const processNumber = proc.number || `PROC-${Date.now().toString().slice(-8)}`;

    // Mapear currentStep para sector do banco (se for um setor válido)
    const dbSector = proc.currentStep ? sectorToDb[proc.currentStep] || null : null;

    // Obter o usuário autenticado do Supabase para o requester_id
    const { data: { user } } = await supabase.auth.getUser();
    const requesterId = user?.id || this.currentUserId;

    const { error } = await supabase
      .from('processes')
      .upsert({
        id: proc.id,
        number: processNumber,
        title: proc.title,
        status: proc.status === 'In Progress' ? 'InProgress' : proc.status, // converter para enum do banco
        priority: proc.priority,
        current_sector: dbSector,
        requester_id: requesterId // OBRIGATÓRIO para RLS policy
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error saving process:', error);
      throw error;
    }
  }

  async getProcess(id: string): Promise<Process | null> {
    const { data, error } = await supabase
      .from('processes')
      .select(`
        *,
        assignee:profiles!assigned_to(id, name)
      `)
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
      currentStep: data.current_sector || data.status || 'Aguardando',
      status: (data.status === 'InProgress' ? 'In Progress' : data.status || 'Pending') as 'Pending' | 'In Progress' | 'Approved' | 'Rejected',
      assignedTo: data.assignee?.name || 'Não atribuído',
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

  // Chat session methods - schema: chat_sessions(id, user_id, title), chat_messages(id, session_id, role, content)
  async getChatSessions(): Promise<ChatSession[]> {
    // Obter o usuário autenticado do Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || this.currentUserId;

    if (!userId) {
      console.warn('No user logged in for chat sessions');
      return [];
    }

    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
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
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
      return [];
    }
  }

  async saveChatSession(session: ChatSession): Promise<void> {
    // Obter o usuário autenticado do Supabase
    const { data: { user } } = await supabase.auth.getUser();

    // Se não há usuário autenticado no Supabase, salvar apenas localmente
    if (!user?.id) {
      console.log('No authenticated Supabase user - chat session saved locally only');
      return;
    }

    try {
      // Primeiro verificar se a sessão já existe (maybeSingle retorna null se não existir)
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', session.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingSession) {
        // Criar nova sessão (INSERT ao invés de UPSERT para evitar problemas de RLS)
        const { error: insertError } = await supabase
          .from('chat_sessions')
          .insert({
            id: session.id,
            title: session.title,
            user_id: user.id,
            created_at: session.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          // Se falhou no insert, tentar update (sessão pode existir de outro usuário)
          console.error('Error creating chat session:', insertError);
          return;
        }
      } else {
        // Atualizar sessão existente
        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({
            title: session.title,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating chat session:', updateError);
          return;
        }
      }

      // Após a sessão existir e estar confirmada, salvar as mensagens
      if (session.messages && session.messages.length > 0) {
        // Salvar mensagens uma a uma para melhor tratamento de erros
        for (const msg of session.messages) {
          // Verificar se a mensagem já existe (maybeSingle retorna null se não existir)
          const { data: existingMsg } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('id', msg.id)
            .maybeSingle();

          if (!existingMsg) {
            const { error: msgError } = await supabase
              .from('chat_messages')
              .insert({
                id: msg.id,
                session_id: session.id,
                role: msg.role,
                content: msg.content,
                created_at: msg.timestamp || new Date().toISOString()
              });

            if (msgError) {
              console.error('Error saving chat message:', msgError);
              // Continuar com as próximas mensagens
            }
          }
        }
      }
    } catch (err) {
      console.error('Error saving chat session:', err);
      // Não lançar erro para não quebrar a experiência do usuário
    }
  }

  async deleteChatSession(id: string): Promise<void> {
    try {
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
    } catch (err) {
      console.error('Error deleting chat session:', err);
      throw err;
    }
  }

  // Settings methods - usando tabela user_settings
  async getSettings(): Promise<any | null> {
    // Obter o usuário autenticado do Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || this.currentUserId;

    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
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
      emailProcesses: data.email_processes,
      emailDocuments: data.email_documents,
      pushBrowser: data.push_browser,
      dailySummary: data.daily_summary,
      aiSuggestions: data.ai_suggestions,
      aiAutoTagging: data.ai_auto_tagging,
      aiAutoSummary: data.ai_auto_summary,
      aiModel: data.ai_model,
      twoFactorEnabled: data.two_factor_enabled,
      sessionTimeout: data.session_timeout
    };
  }

  async saveSettings(settings: any): Promise<void> {
    // Obter o usuário autenticado do Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || this.currentUserId;

    if (!userId) {
      console.error('No user logged in');
      return;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId, // DEVE ser auth.uid() para RLS
        email_processes: settings.emailProcesses,
        email_documents: settings.emailDocuments,
        push_browser: settings.pushBrowser,
        daily_summary: settings.dailySummary,
        ai_suggestions: settings.aiSuggestions,
        ai_auto_tagging: settings.aiAutoTagging,
        ai_auto_summary: settings.aiAutoSummary,
        ai_model: settings.aiModel,
        two_factor_enabled: settings.twoFactorEnabled,
        session_timeout: settings.sessionTimeout,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // User/Auth methods - profiles table links to auth.users
  async saveUser(user: User & { password?: string }): Promise<void> {
    // Nota: profiles.id DEVE corresponder ao auth.users.id
    // O usuário precisa existir em auth.users primeiro (via Supabase Auth)
    const dbRole = roleToDb[user.role] || 'user';
    const dbSector = user.sector ? sectorToDb[user.sector] || null : null;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: dbRole,
        sector: dbSector,
        avatar_url: user.avatarUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      // Se o erro for de FK (usuário não existe em auth.users), logar mas não falhar
      if (profileError.code === '23503') {
        console.warn('User not found in auth.users - profile will be created after authentication');
      } else {
        console.warn('Error saving profile:', profileError);
      }
    }

    this.currentUserId = user.id;
    localStorage.setItem('currentUserId', user.id);
    localStorage.setItem('uema_user_data', JSON.stringify(user));
  }

  async getUser(): Promise<(User & { password?: string }) | null> {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return null;

    // Buscar de profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('User not found in database, using local data');
      // Retornar dados do localStorage se existirem
      const savedUser = localStorage.getItem('uema_user_data');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      return null;
    }

    this.currentUserId = data.id;

    const user = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: (roleFromDb[data.role] || 'Operator') as 'Admin' | 'Manager' | 'Operator' | 'Viewer',
      sector: (data.sector ? sectorFromDb[data.sector] : SectorType.PROGEP) as SectorType,
      avatarUrl: data.avatar_url
    };

    // Salvar localmente como backup
    localStorage.setItem('uema_user_data', JSON.stringify(user));

    return user;
  }

  async getUserByEmail(email: string): Promise<(User & { password?: string }) | null> {
    const { data, error } = await supabase
      .from('profiles')
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
      role: (roleFromDb[data.role] || 'Operator') as 'Admin' | 'Manager' | 'Operator' | 'Viewer',
      sector: (data.sector ? sectorFromDb[data.sector] : SectorType.PROGEP) as SectorType,
      avatarUrl: data.avatar_url
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
