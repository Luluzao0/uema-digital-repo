-- =====================================================
-- UEMA Digital - Schema do Banco de Dados
-- Banco: PostgreSQL (Supabase)
-- Versão: 1.1.0
-- Data: 2024
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca textual

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Caso os ENUMs já existam, ignorar erros
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Operator', 'Viewer');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('PDF', 'DOCX', 'XLSX');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('Draft', 'Published', 'Archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE process_status AS ENUM ('Pending', 'In Progress', 'Approved', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE process_priority AS ENUM ('Low', 'Medium', 'High');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE sector_type AS ENUM ('PROGEP', 'PROPLAD', 'PROTOCOLO', 'PROEXAE', 'PPG', 'PROG');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'Operator',
    sector VARCHAR(50) DEFAULT 'PROGEP',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Documentos
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    name VARCHAR(500), -- alias para title
    type VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft',
    file_url TEXT,
    size VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    summary TEXT,
    description TEXT, -- alias para summary
    sector VARCHAR(50),
    category VARCHAR(50), -- alias para sector
    author VARCHAR(255),
    uploaded_by VARCHAR(255), -- alias para author
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Processos
CREATE TABLE IF NOT EXISTS public.processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    current_step VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending',
    priority VARCHAR(20) DEFAULT 'Medium',
    assigned_to VARCHAR(255),
    assignee VARCHAR(255), -- alias para assigned_to
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Sessões de Chat
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Nova Conversa',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Mensagens do Chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Configurações do Usuário
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'pt-BR',
    notifications JSONB DEFAULT '{"email": true, "push": true, "sound": true}',
    accessibility JSONB DEFAULT '{"highContrast": false, "fontSize": "medium"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Documentos
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_sector ON public.documents(sector);
CREATE INDEX IF NOT EXISTS idx_documents_created ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING GIN(tags);

-- Processos
CREATE INDEX IF NOT EXISTS idx_processes_assigned ON public.processes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_processes_status ON public.processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_priority ON public.processes(priority);
CREATE INDEX IF NOT EXISTS idx_processes_created ON public.processes(created_at DESC);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_documents_updated_at ON public.documents;
CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_processes_updated_at ON public.processes;
CREATE TRIGGER trigger_processes_updated_at
    BEFORE UPDATE ON public.processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trigger_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_settings_updated_at ON public.settings;
CREATE TRIGGER trigger_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Função para gerar número do processo automaticamente
CREATE OR REPLACE FUNCTION generate_process_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    seq_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    IF NEW.number IS NULL OR NEW.number = '' THEN
        year_part := TO_CHAR(NOW(), 'YYYY');
        
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(number FROM 'PROC-' || year_part || '-(\d+)') AS INTEGER)
        ), 0) + 1
        INTO seq_num
        FROM public.processes
        WHERE number LIKE 'PROC-' || year_part || '-%';
        
        new_number := 'PROC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
        NEW.number := new_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_process_number ON public.processes;
CREATE TRIGGER trigger_process_number
    BEFORE INSERT ON public.processes
    FOR EACH ROW
    EXECUTE FUNCTION generate_process_number();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - OPCIONAL
-- Descomente se quiser usar autenticação do Supabase
-- =====================================================

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Por enquanto, permitir acesso público (para desenvolvimento)
-- Em produção, habilite RLS e crie políticas adequadas

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir usuário admin padrão (se não existir)
INSERT INTO public.users (id, name, email, password_hash, role, sector)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Administrador',
    'admin@uema.br',
    'admin123', -- Senha para desenvolvimento (em produção use bcrypt hash)
    'Admin',
    'PROGEP'
) ON CONFLICT (email) DO NOTHING;
