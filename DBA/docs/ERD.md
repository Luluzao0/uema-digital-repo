# 📊 Diagrama Entidade-Relacionamento (ERD)

## Visão Geral do Banco de Dados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UEMA Digital - ERD                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │    profiles     │       │  user_settings  │
│   (Supabase)    │       │                 │       │                 │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──1:1──│ id (PK,FK)      │──1:1──│ user_id (PK,FK) │
│ email           │       │ name            │       │ email_processes │
│ created_at      │       │ email           │       │ push_browser    │
│ ...             │       │ avatar_url      │       │ ai_suggestions  │
└─────────────────┘       │ role            │       │ two_factor      │
                          │ sector          │       │ ...             │
                          │ phone           │       └─────────────────┘
                          │ created_at      │
                          │ updated_at      │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │    documents    │  │    processes    │  │  chat_sessions  │
    ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
    │ id (PK)         │  │ id (PK)         │  │ id (PK)         │
    │ title           │  │ number (UNIQUE) │  │ user_id (FK)    │
    │ description     │  │ title           │  │ title           │
    │ type            │  │ description     │  │ created_at      │
    │ status          │  │ status          │  │ updated_at      │
    │ file_url        │  │ priority        │  └────────┬────────┘
    │ file_size       │  │ requester_id(FK)│           │
    │ tags[]          │  │ assigned_to(FK) │           │ 1:N
    │ content_text    │  │ current_sector  │           ▼
    │ sector          │  │ due_date        │  ┌─────────────────┐
    │ author_id (FK)  │  │ document_ids[]  │  │  chat_messages  │
    │ version         │  │ created_at      │  ├─────────────────┤
    │ parent_id (FK)  │  │ updated_at      │  │ id (PK)         │
    │ created_at      │  │ completed_at    │  │ session_id (FK) │
    │ updated_at      │  └────────┬────────┘  │ role            │
    │ published_at    │           │           │ content         │
    └─────────────────┘           │ 1:N       │ created_at      │
                                  ▼           └─────────────────┘
                        ┌─────────────────┐
                        │ process_history │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ process_id (FK) │
                        │ from_status     │
                        │ to_status       │
                        │ from_sector     │
                        │ to_sector       │
                        │ comment         │
                        │ performed_by(FK)│
                        │ created_at      │
                        └─────────────────┘

    ┌─────────────────┐
    │  notifications  │
    ├─────────────────┤
    │ id (PK)         │
    │ user_id (FK)    │◄── profiles.id
    │ title           │
    │ message         │
    │ type            │
    │ read            │
    │ link            │
    │ created_at      │
    └─────────────────┘
```

## Relacionamentos

### 1. profiles ↔ auth.users
- **Tipo**: 1:1
- **Descrição**: Cada usuário do Supabase Auth tem um perfil correspondente
- **Trigger**: Automático na criação de usuário

### 2. profiles ↔ documents
- **Tipo**: 1:N
- **Descrição**: Um usuário pode criar múltiplos documentos
- **FK**: `documents.author_id → profiles.id`

### 3. documents ↔ documents (Self-reference)
- **Tipo**: 1:N
- **Descrição**: Versionamento de documentos
- **FK**: `documents.parent_id → documents.id`

### 4. profiles ↔ processes
- **Tipo**: 1:N (duas vezes)
- **Descrição**: 
  - Solicitante: `processes.requester_id → profiles.id`
  - Responsável: `processes.assigned_to → profiles.id`

### 5. processes ↔ process_history
- **Tipo**: 1:N
- **Descrição**: Histórico de tramitação do processo
- **FK**: `process_history.process_id → processes.id`

### 6. profiles ↔ chat_sessions
- **Tipo**: 1:N
- **Descrição**: Um usuário pode ter múltiplas sessões de chat
- **FK**: `chat_sessions.user_id → profiles.id`

### 7. chat_sessions ↔ chat_messages
- **Tipo**: 1:N
- **Descrição**: Uma sessão contém múltiplas mensagens
- **FK**: `chat_messages.session_id → chat_sessions.id`

### 8. profiles ↔ user_settings
- **Tipo**: 1:1
- **Descrição**: Cada usuário tem suas configurações
- **FK**: `user_settings.user_id → profiles.id`

### 9. profiles ↔ notifications
- **Tipo**: 1:N
- **Descrição**: Um usuário recebe múltiplas notificações
- **FK**: `notifications.user_id → profiles.id`

## Tipos ENUM

```sql
-- Roles de usuário
user_role: admin | manager | user | viewer

-- Tipos de documento
document_type: PDF | DOCX | XLSX | PPTX | TXT | IMG | OTHER

-- Status de documento
document_status: draft | pending | published | archived

-- Status de processo
process_status: Pending | InProgress | Approved | Rejected | Cancelled

-- Prioridade de processo
process_priority: Low | Medium | High | Urgent

-- Setores da UEMA
sector_type: Reitoria | Pró-Reitoria de Graduação | Pró-Reitoria de Pesquisa | ...
```

## Índices Principais

| Tabela | Índice | Tipo | Propósito |
|--------|--------|------|-----------|
| documents | idx_documents_search | GIN (tsvector) | Busca full-text |
| documents | idx_documents_tags | GIN | Busca por tags |
| documents | idx_documents_created | B-tree DESC | Ordenação por data |
| processes | idx_processes_status | B-tree | Filtro por status |
| processes | idx_processes_number | B-tree | Busca por número |
| notifications | idx_notifications_unread | Partial | Notificações não lidas |

## Segurança (RLS)

Todas as tabelas possuem Row Level Security habilitado:

- **profiles**: Visível para autenticados, editável apenas pelo próprio usuário
- **documents**: Publicados visíveis para todos, drafts apenas para autor
- **processes**: Visível apenas para envolvidos (solicitante/responsável)
- **chat_***: Apenas o próprio usuário acessa suas conversas
- **user_settings**: Apenas o próprio usuário
- **notifications**: Apenas o próprio usuário
