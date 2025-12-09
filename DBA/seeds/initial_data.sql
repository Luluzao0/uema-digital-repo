-- =====================================================
-- Seed Data: Dados Iniciais para Desenvolvimento
-- UEMA Digital Repository
-- =====================================================

-- NOTA: Este arquivo é apenas para ambiente de desenvolvimento!
-- NÃO execute em produção.

-- =====================================================
-- DADOS DE EXEMPLO PARA DOCUMENTOS
-- =====================================================

-- Inserir documentos de exemplo (após ter um usuário criado)
-- Substitua 'USER_ID_AQUI' pelo ID real do usuário

/*
INSERT INTO public.documents (title, description, type, status, tags, sector, author_id)
VALUES 
    ('Regimento Interno UEMA', 
     'Documento oficial contendo o regimento interno da universidade', 
     'PDF', 
     'published', 
     ARRAY['regimento', 'oficial', 'institucional'],
     'Reitoria',
     'USER_ID_AQUI'),
     
    ('Calendário Acadêmico 2024', 
     'Calendário oficial com todas as datas importantes do ano letivo', 
     'PDF', 
     'published', 
     ARRAY['calendário', 'acadêmico', '2024'],
     'Pró-Reitoria de Graduação',
     'USER_ID_AQUI'),
     
    ('Manual do Servidor', 
     'Guia completo para servidores da UEMA', 
     'DOCX', 
     'published', 
     ARRAY['manual', 'servidor', 'rh'],
     'Pró-Reitoria de Administração',
     'USER_ID_AQUI'),
     
    ('Plano de Desenvolvimento Institucional', 
     'PDI 2024-2028 da Universidade Estadual do Maranhão', 
     'PDF', 
     'published', 
     ARRAY['pdi', 'planejamento', 'institucional'],
     'Reitoria',
     'USER_ID_AQUI'),
     
    ('Edital de Bolsas de Pesquisa', 
     'Edital para seleção de bolsistas de iniciação científica', 
     'PDF', 
     'published', 
     ARRAY['edital', 'bolsa', 'pesquisa', 'pibic'],
     'Pró-Reitoria de Pesquisa',
     'USER_ID_AQUI');
*/

-- =====================================================
-- DADOS DE EXEMPLO PARA PROCESSOS
-- =====================================================

/*
INSERT INTO public.processes (title, description, status, priority, current_sector, requester_id)
VALUES 
    ('Solicitação de Férias', 
     'Pedido de férias para o período de janeiro/2024', 
     'Pending', 
     'Medium',
     'Pró-Reitoria de Administração',
     'USER_ID_AQUI'),
     
    ('Aquisição de Equipamentos', 
     'Processo para aquisição de computadores para o laboratório', 
     'InProgress', 
     'High',
     'Pró-Reitoria de Administração',
     'USER_ID_AQUI'),
     
    ('Aprovação de Projeto de Pesquisa', 
     'Submissão de projeto para análise do comitê de ética', 
     'Pending', 
     'High',
     'Pró-Reitoria de Pesquisa',
     'USER_ID_AQUI'),
     
    ('Renovação de Contrato', 
     'Processo de renovação de contrato de servidor temporário', 
     'Approved', 
     'Medium',
     'Secretaria Geral',
     'USER_ID_AQUI'),
     
    ('Solicitação de Transporte', 
     'Pedido de veículo para visita técnica', 
     'Rejected', 
     'Low',
     'Pró-Reitoria de Administração',
     'USER_ID_AQUI');
*/

-- =====================================================
-- FUNÇÃO PARA POPULAR DADOS DE TESTE
-- =====================================================

-- Esta função pode ser chamada para popular dados de teste
-- Uso: SELECT seed_test_data('uuid-do-usuario');

CREATE OR REPLACE FUNCTION seed_test_data(test_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    doc_count INTEGER;
    proc_count INTEGER;
BEGIN
    -- Inserir documentos de teste
    INSERT INTO public.documents (title, description, type, status, tags, sector, author_id)
    VALUES 
        ('Regimento Interno UEMA', 'Documento oficial contendo o regimento interno', 'PDF', 'published', ARRAY['regimento', 'oficial'], 'Reitoria', test_user_id),
        ('Calendário Acadêmico 2024', 'Calendário oficial do ano letivo', 'PDF', 'published', ARRAY['calendário', '2024'], 'Pró-Reitoria de Graduação', test_user_id),
        ('Manual do Servidor', 'Guia completo para servidores', 'DOCX', 'published', ARRAY['manual', 'servidor'], 'Pró-Reitoria de Administração', test_user_id),
        ('Edital PIBIC 2024', 'Edital de bolsas de iniciação científica', 'PDF', 'published', ARRAY['edital', 'pibic'], 'Pró-Reitoria de Pesquisa', test_user_id),
        ('Relatório Anual 2023', 'Relatório de atividades do ano anterior', 'PDF', 'published', ARRAY['relatório', '2023'], 'Reitoria', test_user_id);
    
    GET DIAGNOSTICS doc_count = ROW_COUNT;
    
    -- Inserir processos de teste
    INSERT INTO public.processes (title, description, status, priority, current_sector, requester_id, assigned_to)
    VALUES 
        ('Solicitação de Férias', 'Pedido de férias para janeiro', 'Pending', 'Medium', 'Pró-Reitoria de Administração', test_user_id, test_user_id),
        ('Aquisição de Equipamentos', 'Compra de computadores', 'InProgress', 'High', 'Pró-Reitoria de Administração', test_user_id, test_user_id),
        ('Aprovação de Projeto', 'Projeto de pesquisa para análise', 'Pending', 'High', 'Pró-Reitoria de Pesquisa', test_user_id, test_user_id),
        ('Renovação de Contrato', 'Renovação de servidor temporário', 'Approved', 'Medium', 'Secretaria Geral', test_user_id, test_user_id),
        ('Solicitação de Transporte', 'Veículo para visita técnica', 'Rejected', 'Low', 'Pró-Reitoria de Administração', test_user_id, test_user_id);
    
    GET DIAGNOSTICS proc_count = ROW_COUNT;
    
    RETURN 'Inseridos ' || doc_count || ' documentos e ' || proc_count || ' processos de teste.';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIO
-- =====================================================

-- Para usar em desenvolvimento:
-- 1. Crie um usuário através da autenticação do Supabase
-- 2. Pegue o UUID do usuário
-- 3. Execute: SELECT seed_test_data('seu-uuid-aqui');
