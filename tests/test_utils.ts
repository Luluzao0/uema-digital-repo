// Test utilities for UEMA Digital
// Funções auxiliares para testes

import type { User, Document, Process, ChatSession } from '../types';
import { SectorType } from '../types';

// Mock de usuário para testes
export const mockUser: User = {
    id: 'test-user-id',
    name: 'Usuário Teste',
    email: 'teste@uema.br',
    role: 'Operator',
    sector: SectorType.PROGEP,
    avatarUrl: 'https://example.com/avatar.jpg'
};

export const mockAdmin: User = {
    id: 'test-admin-id',
    name: 'Admin Teste',
    email: 'admin@uema.br',
    role: 'Admin',
    sector: SectorType.PROGEP,
    avatarUrl: 'https://example.com/admin.jpg'
};

// Mock de documento
export const mockDocument: Document = {
    id: 'test-doc-id',
    title: 'Documento de Teste',
    type: 'PDF',
    sector: SectorType.PROGEP,
    createdAt: new Date().toISOString(),
    status: 'Draft',
    tags: ['teste', 'mock'],
    summary: 'Este é um documento de teste',
    author: 'Usuário Teste',
    size: '1.5 MB'
};

// Mock de processo
export const mockProcess: Process = {
    id: 'test-proc-id',
    number: 'PROC-2025-0001',
    title: 'Processo de Teste',
    currentStep: 'Análise',
    status: 'Pending',
    assignedTo: 'Setor Responsável',
    lastUpdate: new Date().toISOString(),
    priority: 'Medium'
};

// Mock de sessão de chat
export const mockChatSession: ChatSession = {
    id: 'test-chat-id',
    title: 'Conversa de Teste',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
        {
            id: 'msg-1',
            role: 'user',
            content: 'Olá, preciso de ajuda',
            timestamp: new Date().toISOString()
        },
        {
            id: 'msg-2',
            role: 'assistant',
            content: 'Olá! Como posso ajudar?',
            timestamp: new Date().toISOString()
        }
    ]
};

// Helper para simular delay de API
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para gerar IDs únicos
export const generateId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper para verificar permissões
export const checkPermission = (user: User, permission: string): boolean => {
    const permissions: Record<string, string[]> = {
        Admin: ['create', 'read', 'update', 'delete', 'approve', 'manage'],
        Manager: ['create', 'read', 'update', 'approve'],
        Operator: ['create', 'read', 'update'],
        Viewer: ['read']
    };
    return permissions[user.role]?.includes(permission) ?? false;
};

// Mock do localStorage para testes
export const mockLocalStorage = () => {
    const store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(key => delete store[key]); }
    };
};
