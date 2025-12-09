# 🗄️ DBA - Database Administration

Este diretório contém toda a configuração e documentação do banco de dados do UEMA Digital.

## 📊 Banco de Dados Escolhido: Supabase

**Supabase** é uma alternativa open-source ao Firebase que oferece:
- PostgreSQL como banco de dados
- Autenticação integrada
- Storage para arquivos
- Real-time subscriptions
- API REST automática

## 🚀 Setup Inicial

### 1. Criar conta no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie as credenciais (URL e anon key)

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 3. Executar migrations
```bash
# As migrations estão em DBA/migrations/
# Execute no SQL Editor do Supabase
```

## 📁 Estrutura do Diretório

```
DBA/
├── README.md              # Esta documentação
├── schema.sql             # Schema completo do banco
├── migrations/            # Migrations incrementais
│   ├── 001_initial.sql
│   └── 002_indexes.sql
├── seeds/                 # Dados iniciais
│   └── initial_data.sql
└── docs/                  # Documentação adicional
    └── ERD.md             # Diagrama ER
```

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Dashboard](https://app.supabase.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
