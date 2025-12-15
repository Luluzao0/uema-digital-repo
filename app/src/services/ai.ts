import { Document } from '../types';

export const aiService = {
  async generateTags(text: string, title: string): Promise<string[]> {
    // Gera tags baseadas no conteúdo
    const words = `${title} ${text}`.toLowerCase().split(/\s+/);
    const stopWords = ['documento', 'uema', 'processo', 'de', 'da', 'do', 'para', 'com', 'em', 'o', 'a', 'os', 'as', 'um', 'uma', 'que', 'no', 'na', 'por', 'se', 'ao', 'ou', 'e', 'como', 'este', 'esta'];
    return [...new Set(words.filter(w => w.length > 3 && !stopWords.includes(w)))].slice(0, 5);
  },

  async generateSummary(text: string, title: string): Promise<string> {
    const preview = text.substring(0, 150).trim();
    return `${title}: ${preview}${text.length > 150 ? '...' : ''}`;
  },

  async chat(message: string, context: Document[]): Promise<string> {
    const msg = message.toLowerCase().trim();

    // Saudações
    if (/^(oi|olá|ola|hey|eai|e ai|bom dia|boa tarde|boa noite|opa|salve)/.test(msg)) {
      return 'Olá! 👋 Como posso ajudar?\n\nExperimente:\n• "documentos" - listar docs\n• "processos" - ver status\n• "ajuda" - mais opções';
    }

    // Agradecimentos
    if (/obrigad|valeu|thanks|vlw/.test(msg)) {
      return 'Por nada! 😊 Precisa de mais alguma coisa?';
    }

    // Ajuda
    if (/ajuda|help|como|funciona|\?$/.test(msg)) {
      return '📋 Posso ajudar com:\n\n• "documentos" - listar documentos\n• "processos" - informações de processos\n• "relatórios" - acessar relatórios\n• "resumo" - visão geral do sistema\n\nNavegue pelo menu inferior para acessar cada função.';
    }

    // Documentos
    if (/documento|doc|arquivo|listar/.test(msg)) {
      if (context.length === 0) {
        return '📄 Nenhum documento encontrado.\n\nAcesse a aba "Documentos" para adicionar novos.';
      }
      const docs = context.slice(0, 5).map((d, i) => `${i + 1}. ${d.title}`).join('\n');
      const extra = context.length > 5 ? `\n\n+${context.length - 5} documento(s)...` : '';
      return `📄 ${context.length} documento(s):\n\n${docs}${extra}\n\nAcesse "Documentos" para ver todos.`;
    }

    // Processos
    if (/processo|tramit|pendente|andamento/.test(msg)) {
      return '📋 Para ver seus processos:\n\n1. Toque em "Processos" no menu\n2. Veja o status de cada um\n3. Filtre por situação\n\nLá você acompanha todo o andamento.';
    }

    // Relatórios
    if (/relat|report|estatist|gráfico|grafico/.test(msg)) {
      return '📊 Para acessar relatórios:\n\n1. Toque em "Relatórios" no menu\n2. Escolha o tipo de relatório\n3. Defina o período\n\nVocê pode exportar em PDF ou Excel.';
    }

    // Resumo/Status
    if (/resumo|status|geral|total|quant/.test(msg)) {
      return `📊 Resumo do Sistema:\n\n📄 Documentos: ${context.length}\n\nUse o menu inferior para navegar entre as funções.`;
    }

    // Configurações
    if (/config|ajuste|setting|perfil/.test(msg)) {
      return '⚙️ Para configurações:\n\nAcesse "Ajustes" no menu inferior.\nLá você pode:\n• Editar perfil\n• Alterar notificações\n• Sair da conta';
    }

    // Busca específica
    if (/buscar|procurar|encontrar|pesquisar/.test(msg)) {
      return '🔍 Para buscar:\n\n1. Acesse a aba desejada (Documentos/Processos)\n2. Use a barra de busca no topo\n3. Digite palavras-chave\n\nOs resultados aparecem em tempo real.';
    }

    // Resposta padrão mais amigável
    return `Entendi: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"\n\n🤔 Não tenho uma resposta específica, mas posso ajudar com:\n\n• "documentos"\n• "processos"\n• "ajuda"\n\nOu navegue pelo menu inferior.`;
  },
};
