// Data Models - Mesmo do sistema web

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
    canDeleteDocument: false,
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
    canEditDocument: true,
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
  tags: string[];
  summary?: string;
  author: string;
  size: string;
  fileUrl?: string;
  content?: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relatedDocs?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
  context?: string[];
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
