# UEMA Digital - Mobile App

Aplicativo móvel do sistema UEMA Digital desenvolvido com Expo React Native.

## 📱 Funcionalidades

- **Dashboard**: Visão geral de documentos, processos e métricas
- **Documentos**: Listagem, upload, busca e gerenciamento de documentos
- **Processos**: Acompanhamento de processos administrativos
- **Chat IA**: Assistente virtual com RAG para consultas
- **Relatórios**: Análises e métricas do sistema
- **Configurações**: Perfil, notificações e preferências

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app no dispositivo (para testes)

### Instalação

```bash
# Entrar na pasta do app
cd app

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm start
```

### Executar no dispositivo

- **Android**: Escaneie o QR Code com o app Expo Go
- **iOS**: Escaneie o QR Code com a câmera do iPhone

## 📦 Build para Produção

### Configurar EAS Build

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar o projeto (primeira vez)
eas build:configure
```

### Gerar APK (Android)

```bash
# Build de preview (APK direto)
eas build --platform android --profile preview

# Build de produção (AAB para Play Store)
eas build --platform android --profile production
```

### Gerar IPA (iOS)

```bash
# Build para simulador
eas build --platform ios --profile development

# Build de produção (para App Store)
eas build --platform ios --profile production
```

## 📋 Configuração de Ambiente

Crie o arquivo `src/config/env.ts` com suas credenciais:

```typescript
export const ENV = {
  SUPABASE_URL: 'sua-url-do-supabase',
  SUPABASE_ANON_KEY: 'sua-chave-anonima',
  COHERE_API_KEY: 'sua-chave-cohere',
};
```

## 🏗️ Estrutura do Projeto

```
app/
├── App.tsx              # Entry point
├── app.json             # Configuração Expo
├── eas.json             # Configuração EAS Build
├── package.json
├── assets/              # Ícones e imagens
└── src/
    ├── components/      # Componentes reutilizáveis
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── Input.tsx
    │   └── index.ts
    ├── config/
    │   └── env.ts       # Variáveis de ambiente
    ├── navigation/
    │   └── index.tsx    # Configuração de navegação
    ├── screens/         # Telas do app
    │   ├── LoginScreen.tsx
    │   ├── DashboardScreen.tsx
    │   ├── DocumentsScreen.tsx
    │   ├── ProcessesScreen.tsx
    │   ├── ChatScreen.tsx
    │   ├── ReportsScreen.tsx
    │   ├── SettingsScreen.tsx
    │   └── index.ts
    ├── services/        # Serviços e APIs
    │   ├── supabase.ts
    │   ├── storage.ts
    │   └── ai.ts
    ├── theme/           # Estilos e tema
    │   └── index.ts
    └── types/           # Definições TypeScript
        └── index.ts
```

## 🔐 Usuários de Demonstração

| Papel     | Email              | Permissões                    |
|-----------|--------------------|------------------------------ |
| Admin     | admin@uema.br      | Acesso total                  |
| Gestor    | gestor@uema.br     | Criar, editar, exportar       |
| Operador  | usuario@uema.br    | Criar, visualizar             |
| Visitante | visitante@uema.br  | Apenas visualização           |

## 📲 Publicação nas Lojas

### Google Play Store

1. Configure `google-services-key.json` com credenciais da Google Play Console
2. Atualize `eas.json` com as informações da conta
3. Execute: `eas submit --platform android`

### Apple App Store

1. Configure Apple Developer Account
2. Atualize `eas.json` com Apple ID e Team ID
3. Execute: `eas submit --platform ios`

## 🛠️ Tecnologias

- **Expo SDK 54**
- **React Native 0.81**
- **TypeScript**
- **React Navigation 7**
- **Supabase** (Auth, Database, Storage)
- **Cohere AI** (RAG e processamento de linguagem)
- **Expo Linear Gradient**
- **Expo Blur**
- **AsyncStorage**

## 📄 Licença

© 2024 Universidade Estadual do Maranhão (UEMA)
