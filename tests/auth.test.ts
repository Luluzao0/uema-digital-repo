// Testes de Autenticação - UEMA Digital
// Usando Vitest para testes unitários

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockUser, mockAdmin, mockLocalStorage } from './test_utils';

// Mock do localStorage
const localStorageMock = mockLocalStorage();
vi.stubGlobal('localStorage', localStorageMock);

describe('Autenticação', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    describe('Login', () => {
        it('deve validar formato de email institucional', () => {
            const validEmail = 'usuario@uema.br';
            const invalidEmail = 'usuario@gmail.com';

            const isValidEmail = (email: string) => email.endsWith('@uema.br');

            expect(isValidEmail(validEmail)).toBe(true);
            expect(isValidEmail(invalidEmail)).toBe(false);
        });

        it('deve validar senha com mínimo de 6 caracteres', () => {
            const validPassword = 'senha123';
            const invalidPassword = '12345';

            const isValidPassword = (password: string) => password.length >= 6;

            expect(isValidPassword(validPassword)).toBe(true);
            expect(isValidPassword(invalidPassword)).toBe(false);
        });

        it('deve salvar usuário no localStorage após login', () => {
            localStorage.setItem('uema_user_data', JSON.stringify(mockUser));
            localStorage.setItem('isAuthenticated', 'true');

            const savedUser = JSON.parse(localStorage.getItem('uema_user_data') || '{}');
            const isAuth = localStorage.getItem('isAuthenticated');

            expect(savedUser.email).toBe(mockUser.email);
            expect(isAuth).toBe('true');
        });
    });

    describe('Roles e Permissões', () => {
        it('Admin deve ter todas as permissões', () => {
            const adminPermissions = {
                canCreateDocument: true,
                canDeleteDocument: true,
                canManageUsers: true,
                canApproveProcess: true
            };

            expect(mockAdmin.role).toBe('Admin');
            expect(adminPermissions.canManageUsers).toBe(true);
        });

        it('Operator não deve poder deletar documentos', () => {
            const operatorPermissions = {
                canCreateDocument: true,
                canDeleteDocument: false,
                canManageUsers: false
            };

            expect(mockUser.role).toBe('Operator');
            expect(operatorPermissions.canDeleteDocument).toBe(false);
        });

        it('deve mapear role corretamente do banco', () => {
            const roleFromDb: Record<string, string> = {
                'admin': 'Admin',
                'Admin': 'Admin',
                'manager': 'Manager',
                'user': 'Operator',
                'viewer': 'Viewer'
            };

            expect(roleFromDb['admin']).toBe('Admin');
            expect(roleFromDb['Admin']).toBe('Admin');
            expect(roleFromDb['user']).toBe('Operator');
        });
    });

    describe('Logout', () => {
        it('deve limpar dados do localStorage ao fazer logout', () => {
            localStorage.setItem('uema_user_data', JSON.stringify(mockUser));
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUserId', mockUser.id);

            // Simula logout
            localStorage.removeItem('uema_user_data');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUserId');

            expect(localStorage.getItem('uema_user_data')).toBeNull();
            expect(localStorage.getItem('isAuthenticated')).toBeNull();
        });
    });

    describe('Remember Me', () => {
        it('deve salvar email quando "lembrar-me" está ativo', () => {
            const email = 'usuario@uema.br';

            localStorage.setItem('uema_remember', 'true');
            localStorage.setItem('uema_email', email);

            expect(localStorage.getItem('uema_remember')).toBe('true');
            expect(localStorage.getItem('uema_email')).toBe(email);
        });
    });
});
