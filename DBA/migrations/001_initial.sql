-- =====================================================
-- Migration 001: Initial Schema
-- UEMA Digital Repository
-- Data: 2024
-- =====================================================

-- Esta migration cria a estrutura inicial do banco de dados
-- Execute no SQL Editor do Supabase

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TIPOS ENUM
-- =====================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT', 'IMG', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('draft', 'pending', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE process_status AS ENUM ('Pending', 'InProgress', 'Approved', 'Rejected', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE process_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sector_type AS ENUM (
        'Reitoria',
        'Pró-Reitoria de Graduação',
        'Pró-Reitoria de Pesquisa',
        'Pró-Reitoria de Extensão',
        'Pró-Reitoria de Administração',
        'Secretaria Geral',
        'Coordenação de Curso',
        'Biblioteca Central',
        'Núcleo de Tecnologia'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABELA: profiles
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    sector sector_type,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: documents
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type document_type NOT NULL,
    status document_status DEFAULT 'draft',
    file_url TEXT,
    file_size BIGINT,
    tags TEXT[] DEFAULT '{}',
    content_text TEXT,
    sector sector_type,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    parent_id UUID REFERENCES public.documents(id) ON DELETE SET NULL
);

-- =====================================================
-- TABELA: processes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status process_status DEFAULT 'Pending',
    priority process_priority DEFAULT 'Medium',
    requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    current_sector sector_type,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    document_ids UUID[] DEFAULT '{}'
);

-- =====================================================
-- TABELA: process_history
-- =====================================================

CREATE TABLE IF NOT EXISTS public.process_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    from_status process_status,
    to_status process_status NOT NULL,
    from_sector sector_type,
    to_sector sector_type,
    comment TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: chat_sessions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Nova Conversa',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: chat_messages
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: user_settings
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_processes BOOLEAN DEFAULT true,
    email_documents BOOLEAN DEFAULT false,
    push_browser BOOLEAN DEFAULT true,
    daily_summary BOOLEAN DEFAULT true,
    ai_suggestions BOOLEAN DEFAULT true,
    ai_auto_tagging BOOLEAN DEFAULT true,
    ai_auto_summary BOOLEAN DEFAULT false,
    ai_model VARCHAR(50) DEFAULT 'command-r7b-12-2024',
    two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Perfis de usuários complementando auth.users';
COMMENT ON TABLE public.documents IS 'Documentos do repositório digital';
COMMENT ON TABLE public.processes IS 'Processos administrativos';
COMMENT ON TABLE public.process_history IS 'Histórico de tramitação dos processos';
COMMENT ON TABLE public.chat_sessions IS 'Sessões de chat com IA';
COMMENT ON TABLE public.chat_messages IS 'Mensagens das sessões de chat';
COMMENT ON TABLE public.user_settings IS 'Configurações personalizadas do usuário';
COMMENT ON TABLE public.notifications IS 'Notificações do sistema';
