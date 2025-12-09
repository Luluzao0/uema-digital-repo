-- =====================================================
-- Migration 003: Row Level Security Policies
-- UEMA Digital Repository
-- Data: 2024
-- =====================================================

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: profiles
-- =====================================================

DROP POLICY IF EXISTS "Profiles visíveis para autenticados" ON public.profiles;
CREATE POLICY "Profiles visíveis para autenticados"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários atualizam próprio perfil" ON public.profiles;
CREATE POLICY "Usuários atualizam próprio perfil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins podem criar perfis" ON public.profiles;
CREATE POLICY "Admins podem criar perfis"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- POLÍTICAS: documents
-- =====================================================

DROP POLICY IF EXISTS "Documentos publicados visíveis" ON public.documents;
CREATE POLICY "Documentos publicados visíveis"
    ON public.documents FOR SELECT
    TO authenticated
    USING (
        status = 'published' OR 
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

DROP POLICY IF EXISTS "Usuários criam documentos" ON public.documents;
CREATE POLICY "Usuários criam documentos"
    ON public.documents FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Autores atualizam documentos" ON public.documents;
CREATE POLICY "Autores atualizam documentos"
    ON public.documents FOR UPDATE
    TO authenticated
    USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

DROP POLICY IF EXISTS "Autores deletam documentos" ON public.documents;
CREATE POLICY "Autores deletam documentos"
    ON public.documents FOR DELETE
    TO authenticated
    USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- POLÍTICAS: processes
-- =====================================================

DROP POLICY IF EXISTS "Processos visíveis para envolvidos" ON public.processes;
CREATE POLICY "Processos visíveis para envolvidos"
    ON public.processes FOR SELECT
    TO authenticated
    USING (
        requester_id = auth.uid() OR 
        assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

DROP POLICY IF EXISTS "Usuários criam processos" ON public.processes;
CREATE POLICY "Usuários criam processos"
    ON public.processes FOR INSERT
    TO authenticated
    WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Responsáveis atualizam processos" ON public.processes;
CREATE POLICY "Responsáveis atualizam processos"
    ON public.processes FOR UPDATE
    TO authenticated
    USING (
        assigned_to = auth.uid() OR
        requester_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- =====================================================
-- POLÍTICAS: process_history
-- =====================================================

DROP POLICY IF EXISTS "Histórico visível para envolvidos" ON public.process_history;
CREATE POLICY "Histórico visível para envolvidos"
    ON public.process_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.processes p 
            WHERE p.id = process_id 
            AND (p.requester_id = auth.uid() OR p.assigned_to = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

DROP POLICY IF EXISTS "Sistema insere histórico" ON public.process_history;
CREATE POLICY "Sistema insere histórico"
    ON public.process_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =====================================================
-- POLÍTICAS: chat_sessions
-- =====================================================

DROP POLICY IF EXISTS "Usuários veem próprias sessões" ON public.chat_sessions;
CREATE POLICY "Usuários veem próprias sessões"
    ON public.chat_sessions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários criam próprias sessões" ON public.chat_sessions;
CREATE POLICY "Usuários criam próprias sessões"
    ON public.chat_sessions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários atualizam próprias sessões" ON public.chat_sessions;
CREATE POLICY "Usuários atualizam próprias sessões"
    ON public.chat_sessions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários deletam próprias sessões" ON public.chat_sessions;
CREATE POLICY "Usuários deletam próprias sessões"
    ON public.chat_sessions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS: chat_messages
-- =====================================================

DROP POLICY IF EXISTS "Usuários veem próprias mensagens" ON public.chat_messages;
CREATE POLICY "Usuários veem próprias mensagens"
    ON public.chat_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions 
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuários criam próprias mensagens" ON public.chat_messages;
CREATE POLICY "Usuários criam próprias mensagens"
    ON public.chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions 
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS: user_settings
-- =====================================================

DROP POLICY IF EXISTS "Usuários veem próprias configurações" ON public.user_settings;
CREATE POLICY "Usuários veem próprias configurações"
    ON public.user_settings FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários atualizam próprias configurações" ON public.user_settings;
CREATE POLICY "Usuários atualizam próprias configurações"
    ON public.user_settings FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários criam próprias configurações" ON public.user_settings;
CREATE POLICY "Usuários criam próprias configurações"
    ON public.user_settings FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS: notifications
-- =====================================================

DROP POLICY IF EXISTS "Usuários veem próprias notificações" ON public.notifications;
CREATE POLICY "Usuários veem próprias notificações"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Sistema cria notificações" ON public.notifications;
CREATE POLICY "Sistema cria notificações"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários atualizam próprias notificações" ON public.notifications;
CREATE POLICY "Usuários atualizam próprias notificações"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários deletam próprias notificações" ON public.notifications;
CREATE POLICY "Usuários deletam próprias notificações"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
