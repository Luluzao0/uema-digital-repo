// Data Models based on the specification

export enum SectorType {
  PROGEP = 'PROGEP',
  PROPLAD = 'PROPLAD',
  PROTOCOLO = 'PROTOCOLO',
  PROEXAE = 'PROEXAE',
  PPG = 'PPG',
  PROG = 'PROG'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Operator' | 'Viewer';
  sector: SectorType;
  avatarUrl?: string;
}

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
  lastMessage: string;
  updatedAt: string;
  context?: string[]; // IDs of documents in this context
  messages: ChatMessage[];
}

// Navigation Types
export type ViewState = 'dashboard' | 'documents' | 'processes' | 'reports' | 'chat' | 'settings';