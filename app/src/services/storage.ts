import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document, Process, ChatSession, User, SectorType } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  DOCUMENTS: 'uema_documents',
  PROCESSES: 'uema_processes',
  CHATS: 'uema_chats',
  USER: 'uema_user',
  AUTHENTICATED: 'uema_authenticated',
};

// Mock Data
const MOCK_DOCS: Document[] = [
  {
    id: 'd1',
    title: 'Edital de Concurso Docente 01/2025',
    type: 'PDF',
    sector: SectorType.PROGEP,
    createdAt: '2025-10-18',
    status: 'Published',
    tags: ['Concurso', 'Docente', 'Efetivo'],
    summary: 'Documento regulamenta o processo seletivo para 40 vagas de professor efetivo.',
    author: 'Maria Silva',
    size: '2.4 MB'
  },
  {
    id: 'd2',
    title: 'Relatório Financeiro Q3 2025',
    type: 'XLSX',
    sector: SectorType.PROPLAD,
    createdAt: '2025-10-15',
    status: 'Draft',
    tags: ['Financeiro', 'Orçamento', 'Q3'],
    summary: 'Análise preliminar dos gastos e empenhos do terceiro trimestre.',
    author: 'João Souza',
    size: '850 KB'
  },
  {
    id: 'd3',
    title: 'Projeto de Extensão: UEMA Comunidade',
    type: 'DOCX',
    sector: SectorType.PROEXAE,
    createdAt: '2025-10-10',
    status: 'Published',
    tags: ['Extensão', 'Comunidade', 'Bolsas'],
    author: 'Ana Pereira',
    size: '1.2 MB'
  },
];

const MOCK_PROCESSES: Process[] = [
  {
    id: 'p1',
    number: 'PROC-2025-00128',
    title: 'Aquisição de Equipamentos de TI',
    currentStep: 'Análise Orçamentária',
    status: 'In Progress',
    assignedTo: 'PROPLAD',
    lastUpdate: '2025-10-19',
    priority: 'High'
  },
  {
    id: 'p2',
    number: 'PROC-2025-00145',
    title: 'Progressão Funcional - Dept. História',
    currentStep: 'Validação Documental',
    status: 'Pending',
    assignedTo: 'PROGEP',
    lastUpdate: '2025-10-18',
    priority: 'Medium'
  },
  {
    id: 'p3',
    number: 'PROC-2025-00099',
    title: 'Reformulação PPC Engenharia Civil',
    currentStep: 'Concluído',
    status: 'Approved',
    assignedTo: 'PROG',
    lastUpdate: '2025-10-10',
    priority: 'Low'
  }
];

class Storage {
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    // Inicializar com dados mock se não existirem
    const docs = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!docs) {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(MOCK_DOCS));
    }
    
    const procs = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSES);
    if (!procs) {
      await AsyncStorage.setItem(STORAGE_KEYS.PROCESSES, JSON.stringify(MOCK_PROCESSES));
    }
    
    const chats = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);
    if (!chats) {
      await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify([]));
    }
    
    this.initialized = true;
  }

  // Documents
  async getDocuments(): Promise<Document[]> {
    await this.init();
    
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            title: d.title,
            type: d.type,
            sector: d.sector,
            createdAt: d.created_at?.split('T')[0] || '',
            status: d.status === 'published' ? 'Published' : d.status === 'draft' ? 'Draft' : 'Archived',
            tags: d.tags || [],
            summary: d.description,
            author: 'Sistema',
            size: d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : 'N/A',
            fileUrl: d.file_url,
            content: d.content_text,
          }));
        }
      } catch (err) {
        console.log('Usando storage local para documentos');
      }
    }
    
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : MOCK_DOCS;
  }

  async saveDocument(doc: Document): Promise<void> {
    const docs = await this.getDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.unshift(doc);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('documents').upsert({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          sector: doc.sector,
          status: doc.status.toLowerCase(),
          tags: doc.tags,
          description: doc.summary,
          file_url: doc.fileUrl,
          content_text: doc.content,
        });
      } catch (err) {
        console.log('Documento salvo apenas localmente');
      }
    }
  }

  async deleteDocument(id: string): Promise<void> {
    const docs = await this.getDocuments();
    const filtered = docs.filter(d => d.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(filtered));
    
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('documents').delete().eq('id', id);
      } catch (err) {
        console.log('Documento deletado apenas localmente');
      }
    }
  }

  // Processes
  async getProcesses(): Promise<Process[]> {
    await this.init();
    
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('processes').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          return data.map(p => ({
            id: p.id,
            number: p.number,
            title: p.title,
            currentStep: p.current_sector || 'Triagem',
            status: p.status === 'InProgress' ? 'In Progress' : p.status,
            assignedTo: p.assigned_to || 'N/A',
            lastUpdate: p.updated_at?.split('T')[0] || '',
            priority: p.priority,
          }));
        }
      } catch (err) {
        console.log('Usando storage local para processos');
      }
    }
    
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSES);
    return data ? JSON.parse(data) : MOCK_PROCESSES;
  }

  async saveProcess(proc: Process): Promise<void> {
    const procs = await this.getProcesses();
    const index = procs.findIndex(p => p.id === proc.id);
    
    if (index >= 0) {
      procs[index] = proc;
    } else {
      procs.unshift(proc);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.PROCESSES, JSON.stringify(procs));
  }

  // Chat Sessions
  async getChatSessions(): Promise<ChatSession[]> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);
    return data ? JSON.parse(data) : [];
  }

  async saveChatSession(session: ChatSession): Promise<void> {
    const sessions = await this.getChatSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(sessions));
  }

  async deleteChatSession(id: string): Promise<void> {
    const sessions = await this.getChatSessions();
    const filtered = sessions.filter(s => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(filtered));
  }

  // User
  async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  }

  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async isAuthenticated(): Promise<boolean> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTHENTICATED);
    return data === 'true';
  }

  async setAuthenticated(value: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTHENTICATED, value ? 'true' : 'false');
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.AUTHENTICATED,
    ]);
  }
}

export const storage = new Storage();
