// Data Models based on the specification

export enum SectorType {
  PROGEP = 'PROGEP',
  PROPLAD = 'PROPLAD',
  PROTOCOLO = 'PROTOCOLO',
  PROEXAE = 'PROEXAE',
  PPG = 'PPG',
  PROG = 'PROG'
}

export type UserRole = 'Admin' | 'Manager' | 'Operator' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sector: SectorType;
  avatarUrl?: string;
}

// Permissões por role
export const ROLE_PERMISSIONS = {
  Admin: {
    canCreateDocument: true,
    canEditDocument: true,
    canDeleteDocument: true,
    canPublishDocument: true,
    canCreateProcess: true,
    canApproveProcess: true,
    canRejectProcess: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: true,
    canAccessSettings: true,
    canAccessChat: true,
    description: 'Acesso total ao sistema',
  },
  Manager: {
    canCreateDocument: true,
    canEditDocument: true,
    canDeleteDocument: false, // Só do próprio setor
    canPublishDocument: true,
    canCreateProcess: true,
    canApproveProcess: true,
    canRejectProcess: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: false,
    canAccessSettings: true,
    canAccessChat: true,
    description: 'Gerencia documentos e processos do setor',
  },
  Operator: {
    canCreateDocument: true,
    canEditDocument: true, // Só próprios
    canDeleteDocument: false,
    canPublishDocument: false,
    canCreateProcess: true,
    canApproveProcess: false,
    canRejectProcess: false,
    canViewReports: true,
    canExportReports: false,
    canManageUsers: false,
    canAccessSettings: true,
    canAccessChat: true,
    description: 'Cria e edita documentos e processos',
  },
  Viewer: {
    canCreateDocument: false,
    canEditDocument: false,
    canDeleteDocument: false,
    canPublishDocument: false,
    canCreateProcess: false,
    canApproveProcess: false,
    canRejectProcess: false,
    canViewReports: true,
    canExportReports: false,
    canManageUsers: false,
    canAccessSettings: true,
    canAccessChat: true,
    description: 'Apenas visualização',
  },
} as const;

// Helper para verificar permissões
export const hasPermission = (role: UserRole, permission: keyof typeof ROLE_PERMISSIONS.Admin): boolean => {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
};

export interface Document {
  id: string;
  title: string;
  type: 'PDF' | 'DOCX' | 'XLSX';
  sector: SectorType;
  createdAt: string;
  status: 'Draft' | 'Published' | 'Archived';
  tags: string[]; // AI Generated tags
  summary?: string; // AI Generated summary
  author: string;
  size: string;
  fileUrl?: string; // Storage path for file download
  content?: string; // Extracted text content for RAG
}

export interface Process {
  id: string;
  number: string;
  title: string;
  currentStep: string;
  status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected';
  assignedTo: string;
  lastUpdate: string;
  priority: 'Low' | 'Medium' | 'High';
}

// Chat & RAG Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relatedDocs?: string[]; // IDs of docs used for RAG
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
  context?: string[]; // IDs of documents in this context
  messages: ChatMessage[];
}

// Navigation Types
export type ViewState = 'dashboard' | 'documents' | 'processes' | 'reports' | 'chat' | 'settings';