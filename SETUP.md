# Configuração Final do UEMA Digital

## ✅ Funcionalidades Implementadas

### 1. Autenticação Real (Supabase Auth)
- Login com email/senha
- Cadastro de novos usuários
- Recuperação de senha por email
- Sessão persistente
- Logout

### 2. Storage do Supabase
- Upload de arquivos para bucket `documents`
- Download de arquivos
- URLs públicas e assinadas
- Listagem de arquivos
- Exclusão de arquivos

### 3. Chat com RAG (Cohere AI)
- Busca semântica usando embeddings
- Reranking de documentos por relevância
- Contexto de documentos nas respostas
- Fallback para busca por keywords
- Geração de tags e resumos automáticos

### 4. Busca Semântica
- Embeddings multilíngues (embed-multilingual-v3.0)
- Similaridade de cosseno
- Reranking com modelo multilíngue
- Cache de embeddings para performance

### 5. Dashboard com Dados Reais
- Estatísticas calculadas em tempo real
- Contagem de usuários do Supabase
- Tendências mensais
- Indicador de conexão Realtime

### 6. Notificações em Tempo Real
- Componente de notificações
- Supabase Realtime para atualizações
- Notificações do browser (push)
- Marcar como lida
- Badge de não lidas

---

## 🔧 Configuração do Supabase

### Passo 1: Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e a chave anônima (anon key)

### Passo 2: Configurar Variáveis de Ambiente
Crie/edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_COHERE_API_KEY=sua-chave-cohere
```

### Passo 3: Criar Bucket de Storage
1. No Supabase, vá em **Storage**
2. Clique em **New bucket**
3. Nome: `documents`
4. Marque **Public bucket** (ou configure RLS)
5. Clique em **Create bucket**

### Passo 4: Configurar Políticas do Bucket
```sql
-- Permitir leitura pública
CREATE POLICY "Leitura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Permitir upload para usuários autenticados
CREATE POLICY "Upload autenticado" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
  );

-- Permitir exclusão pelo dono
CREATE POLICY "Exclusão pelo dono" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Passo 5: Executar Migrações do Banco
Execute os scripts SQL em `DBA/migrations/` na ordem:
1. `001_initial.sql`
2. `002_indexes_triggers.sql`
3. `003_rls_policies.sql`

### Passo 6: Habilitar Realtime
1. Vá em **Database > Replication**
2. Habilite Realtime para as tabelas:
   - `documents`
   - `processes`
   - `notifications`

---

## 🔑 Configuração do Cohere AI

### Obter API Key
1. Acesse [cohere.com](https://cohere.com)
2. Crie uma conta ou faça login
3. Vá em **API Keys**
4. Copie sua chave de API
5. Adicione ao `.env`: `VITE_COHERE_API_KEY=sua-chave`

### Modelos Utilizados
- **Chat**: `command-r7b-12-2024` (respostas em português)
- **Embeddings**: `embed-multilingual-v3.0` (busca semântica)
- **Rerank**: `rerank-multilingual-v3.0` (reordenação por relevância)

---

## 🚀 Executando o Projeto

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview
```

---

## 📁 Estrutura de Arquivos Atualizada

```
services/
├── supabase.ts     # Cliente Supabase + Auth + Realtime
├── storage.ts      # Storage de dados + File Storage
└── ai.ts           # Cohere AI + RAG + Busca Semântica

components/
├── Notifications.tsx   # Componente de notificações em tempo real
├── Layout.tsx
├── Modal.tsx
└── DockNavigation.tsx

features/
├── auth/
│   └── Login.tsx       # Login/Registro/Recuperação de senha
├── chat/
│   └── Chat.tsx        # Chat com RAG
├── dashboard/
│   └── Dashboard.tsx   # Dashboard com dados reais
└── reports/
    └── Reports.tsx     # Relatórios com métricas reais
```

---

## ✨ Funcionalidades Extras

### Classificação Automática de Documentos
```typescript
import { aiService } from './services/ai';

const classification = await aiService.classifyDocument(
  'Título do Documento',
  'Conteúdo opcional...'
);
// Retorna: { sector, type, priority, confidence }
```

### Extração de Entidades
```typescript
const entities = await aiService.extractEntities('Texto do documento...');
// Retorna: { people, dates, organizations, locations }
```

### Sugestão de Documentos Relacionados
```typescript
const related = await aiService.suggestRelatedDocuments(
  currentDocument,
  allDocuments
);
```

### Geração de FAQs
```typescript
const faqs = await aiService.generateFAQs(document);
// Retorna array de perguntas frequentes
```

---

## 🔒 Segurança

- Senhas nunca são armazenadas em texto plano (Supabase Auth)
- RLS (Row Level Security) habilitado nas tabelas
- Tokens JWT com refresh automático
- URLs assinadas para arquivos privados
- Validação de email institucional (@uema.br)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique as variáveis de ambiente
2. Confira os logs do console
3. Verifique se o Supabase está configurado corretamente
4. Teste se a API do Cohere está funcionando
