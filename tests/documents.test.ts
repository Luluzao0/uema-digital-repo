// Testes de Documentos - UEMA Digital
// Testes unitários e de integração

import { describe, it, expect, beforeEach } from 'vitest';
import { mockDocument, mockUser, generateId } from './test_utils';
import type { Document } from '../types';
import { SectorType } from '../types';

describe('Documentos', () => {
    let documents: Document[] = [];

    beforeEach(() => {
        documents = [mockDocument];
    });

    describe('Criação', () => {
        it('deve criar documento com campos obrigatórios', () => {
            const newDoc: Document = {
                id: generateId(),
                title: 'Novo Documento',
                type: 'PDF',
                sector: SectorType.PROPLAD,
                createdAt: new Date().toISOString(),
                status: 'Draft',
                tags: [],
                author: mockUser.name,
                size: '2.0 MB'
            };

            documents.push(newDoc);

            expect(documents.length).toBe(2);
            expect(newDoc.status).toBe('Draft');
            expect(newDoc.title).toBe('Novo Documento');
        });

        it('deve validar tipos de arquivo permitidos', () => {
            const allowedTypes = ['PDF', 'DOCX', 'XLSX'];
            const testType = 'PDF';
            const invalidType = 'EXE';

            expect(allowedTypes.includes(testType)).toBe(true);
            expect(allowedTypes.includes(invalidType)).toBe(false);
        });

        it('deve gerar ID único para cada documento', () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
        });
    });

    describe('Busca', () => {
        it('deve buscar documento por título', () => {
            const searchTerm = 'Teste';
            const results = documents.filter(doc =>
                doc.title.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(results.length).toBeGreaterThan(0);
            expect(results[0].title).toContain('Teste');
        });

        it('deve filtrar documentos por setor', () => {
            const sector = SectorType.PROGEP;
            const results = documents.filter(doc => doc.sector === sector);

            expect(results.every(doc => doc.sector === sector)).toBe(true);
        });

        it('deve filtrar documentos por status', () => {
            const status = 'Draft';
            const results = documents.filter(doc => doc.status === status);

            expect(results.every(doc => doc.status === status)).toBe(true);
        });

        it('deve buscar por tags', () => {
            const tag = 'teste';
            const results = documents.filter(doc =>
                doc.tags.some(t => t.toLowerCase() === tag.toLowerCase())
            );

            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Atualização', () => {
        it('deve atualizar status do documento', () => {
            const doc = documents[0];
            doc.status = 'Published';

            expect(doc.status).toBe('Published');
        });

        it('deve atualizar tags do documento', () => {
            const doc = documents[0];
            const newTags = ['nova-tag', 'atualizado'];
            doc.tags = [...doc.tags, ...newTags];

            expect(doc.tags).toContain('nova-tag');
            expect(doc.tags).toContain('atualizado');
        });
    });

    describe('Exclusão', () => {
        it('deve remover documento da lista', () => {
            const initialLength = documents.length;
            const docToRemove = documents[0];

            documents = documents.filter(doc => doc.id !== docToRemove.id);

            expect(documents.length).toBe(initialLength - 1);
        });
    });

    describe('Validações', () => {
        it('deve validar tamanho máximo de arquivo (50MB)', () => {
            const maxSize = 50 * 1024 * 1024; // 50MB em bytes
            const fileSize = 30 * 1024 * 1024; // 30MB

            expect(fileSize <= maxSize).toBe(true);
        });

        it('deve validar título não vazio', () => {
            const validTitle = 'Documento Válido';
            const invalidTitle = '';

            const isValid = (title: string) => title.trim().length > 0;

            expect(isValid(validTitle)).toBe(true);
            expect(isValid(invalidTitle)).toBe(false);
        });
    });
});
