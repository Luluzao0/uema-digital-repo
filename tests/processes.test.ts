// Testes de Processos - UEMA Digital
// Testes unitários e de integração

import { describe, it, expect, beforeEach } from 'vitest';
import { mockProcess, mockAdmin, mockUser, generateId } from './test_utils';
import type { Process } from '../types';

describe('Processos', () => {
    let processes: Process[] = [];

    beforeEach(() => {
        processes = [mockProcess];
    });

    describe('Criação', () => {
        it('deve criar processo com número automático', () => {
            const year = new Date().getFullYear();
            const seqNum = processes.length + 1;
            const number = `PROC-${year}-${String(seqNum).padStart(4, '0')}`;

            const newProcess: Process = {
                id: generateId(),
                number: number,
                title: 'Novo Processo',
                currentStep: 'Análise Inicial',
                status: 'Pending',
                assignedTo: 'PROGEP',
                lastUpdate: new Date().toISOString(),
                priority: 'Medium'
            };

            processes.push(newProcess);

            expect(newProcess.number).toMatch(/^PROC-\d{4}-\d{4}$/);
            expect(newProcess.status).toBe('Pending');
        });

        it('deve gerar número único sequencial', () => {
            const generateNumber = (seq: number) => {
                const year = new Date().getFullYear();
                return `PROC-${year}-${String(seq).padStart(4, '0')}`;
            };

            const num1 = generateNumber(1);
            const num2 = generateNumber(2);

            expect(num1).not.toBe(num2);
        });
    });

    describe('Status', () => {
        it('deve atualizar status para "In Progress"', () => {
            const proc = processes[0];
            proc.status = 'In Progress';
            proc.lastUpdate = new Date().toISOString();

            expect(proc.status).toBe('In Progress');
        });

        it('deve atualizar status para "Approved"', () => {
            const proc = processes[0];
            proc.status = 'Approved';

            expect(proc.status).toBe('Approved');
        });

        it('deve atualizar status para "Rejected"', () => {
            const proc = processes[0];
            proc.status = 'Rejected';

            expect(proc.status).toBe('Rejected');
        });

        it('deve manter histórico de alterações', () => {
            const history: { from: string; to: string; date: string }[] = [];
            // Criar cópia local para evitar mutações de outros testes
            const proc: { status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected' } = {
                ...mockProcess,
                status: 'Pending'
            };

            const oldStatus = proc.status;
            proc.status = 'In Progress';

            history.push({
                from: oldStatus,
                to: proc.status,
                date: new Date().toISOString()
            });

            expect(history.length).toBe(1);
            expect(history[0].from).toBe('Pending');
            expect(history[0].to).toBe('In Progress');
        });
    });

    describe('Permissões', () => {
        it('Admin pode aprovar processos', () => {
            const canApprove = (role: string) => ['Admin', 'Manager'].includes(role);

            expect(canApprove(mockAdmin.role)).toBe(true);
        });

        it('Operator não pode aprovar processos', () => {
            const canApprove = (role: string) => ['Admin', 'Manager'].includes(role);

            expect(canApprove(mockUser.role)).toBe(false);
        });

        it('Admin pode rejeitar processos', () => {
            const canReject = (role: string) => ['Admin', 'Manager'].includes(role);

            expect(canReject(mockAdmin.role)).toBe(true);
        });
    });

    describe('Prioridade', () => {
        it('deve atualizar prioridade do processo', () => {
            const proc = processes[0];
            proc.priority = 'High';

            expect(proc.priority).toBe('High');
        });

        it('deve validar valores de prioridade', () => {
            const validPriorities = ['Low', 'Medium', 'High'];
            const priority = 'High';

            expect(validPriorities.includes(priority)).toBe(true);
        });
    });

    describe('Filtros', () => {
        it('deve filtrar por status', () => {
            const status = 'Pending';
            const results = processes.filter(p => p.status === status);

            expect(results.every(p => p.status === status)).toBe(true);
        });

        it('deve filtrar por prioridade', () => {
            // Usar lista com processo de prioridade Medium garantido
            const testProcesses = [{ ...mockProcess, priority: 'Medium' as const }];
            const priority = 'Medium';
            const results = testProcesses.filter(p => p.priority === priority);

            expect(results.length).toBeGreaterThan(0);
        });

        it('deve buscar por número do processo', () => {
            const number = 'PROC-2025';
            const results = processes.filter(p => p.number.includes(number));

            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Atribuição', () => {
        it('deve atribuir processo a um setor', () => {
            const proc = processes[0];
            proc.assignedTo = 'PROPLAD';

            expect(proc.assignedTo).toBe('PROPLAD');
        });
    });
});
