-- =====================================================
-- Migration 002: Indexes and Triggers
-- UEMA Digital Repository
-- Data: 2024
-- =====================================================

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Documentos
CREATE INDEX IF NOT EXISTS idx_documents_author ON public.documents(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_sector ON public.documents(sector);
CREATE INDEX IF NOT EXISTS idx_documents_created ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING GIN(tags);

-- Índice para busca full-text em português
CREATE INDEX IF NOT EXISTS idx_documents_search ON public.documents 
    USING GIN(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content_text, '')));

-- Processos
CREATE INDEX IF NOT EXISTS idx_processes_requester ON public.processes(requester_id);
CREATE INDEX IF NOT EXISTS idx_processes_assigned ON public.processes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_processes_status ON public.processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_priority ON public.processes(priority);
CREATE INDEX IF NOT EXISTS idx_processes_sector ON public.processes(current_sector);
CREATE INDEX IF NOT EXISTS idx_processes_created ON public.processes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processes_number ON public.processes(number);

-- Histórico de Processos
CREATE INDEX IF NOT EXISTS idx_process_history_process ON public.process_history(process_id);
CREATE INDEX IF NOT EXISTS idx_process_history_created ON public.process_history(created_at DESC);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);

-- Notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_documents_updated_at ON public.documents;
CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_processes_updated_at ON public.processes;
CREATE TRIGGER trigger_processes_updated_at
    BEFORE UPDATE ON public.processes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trigger_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- FUNÇÃO: Gerar número de processo automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_process_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    seq_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Só gera se não foi fornecido
    IF NEW.number IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Buscar próximo número sequencial do ano
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(number FROM 'PROC-' || year_part || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM public.processes
    WHERE number LIKE 'PROC-' || year_part || '-%';
    
    -- Formatar: PROC-2024-0001
    new_number := 'PROC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    NEW.number := new_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_process_number ON public.processes;
CREATE TRIGGER trigger_process_number
    BEFORE INSERT ON public.processes
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_process_number();

-- =====================================================
-- FUNÇÃO: Criar perfil automaticamente após signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Criar configurações padrão
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNÇÃO: Registrar histórico de processo
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_process_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar mudança de status ou setor
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.current_sector IS DISTINCT FROM NEW.current_sector THEN
        INSERT INTO public.process_history (
            process_id,
            from_status,
            to_status,
            from_sector,
            to_sector,
            performed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            OLD.current_sector,
            NEW.current_sector,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_process_history ON public.processes;
CREATE TRIGGER trigger_process_history
    AFTER UPDATE ON public.processes
    FOR EACH ROW EXECUTE FUNCTION public.log_process_change();
