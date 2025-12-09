// Cohere AI Service for document processing and chat
import { Document } from '../types';

const COHERE_API_KEY = (import.meta as any).env?.VITE_COHERE_API_KEY || '';

interface CohereResponse {
  text: string;
}

interface ChatMessage {
  role: 'USER' | 'CHATBOT';
  message: string;
}

class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = COHERE_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  // Generate tags for a document based on its content/title
  async generateTags(title: string, content?: string): Promise<string[]> {
    if (!this.isConfigured()) {
      return ['Documento', 'UEMA'];
    }

    try {
      const prompt = `Analise o seguinte documento e gere de 3 a 5 tags relevantes em português.
Documento: "${title}"
${content ? `Conteúdo: "${content.substring(0, 500)}"` : ''}

Responda APENAS com as tags separadas por vírgula, sem explicações. Exemplo: Tag1, Tag2, Tag3`;

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-r7b-12-2024',
          message: prompt,
          temperature: 0.3,
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data: CohereResponse = await response.json();
      const tags = data.text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      return tags.slice(0, 5);
    } catch (error) {
      console.error('Error generating tags:', error);
      return ['Documento', 'UEMA'];
    }
  }

  // Generate summary for a document
  async generateSummary(title: string, content?: string): Promise<string> {
    if (!this.isConfigured()) {
      return 'Resumo não disponível - API não configurada.';
    }

    try {
      const prompt = `Gere um resumo conciso em português (máximo 2 frases) para o seguinte documento:
Título: "${title}"
${content ? `Conteúdo: "${content.substring(0, 1000)}"` : ''}

Responda APENAS com o resumo, sem introduções.`;

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-r7b-12-2024',
          message: prompt,
          temperature: 0.3,
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data: CohereResponse = await response.json();
      return data.text.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Resumo não disponível.';
    }
  }

  // RAG-enhanced chat - search documents and use as context
  async chatWithRAG(
    userMessage: string, 
    documents: Document[], 
    chatHistory: ChatMessage[] = []
  ): Promise<{ text: string; relatedDocs: string[] }> {
    if (!this.isConfigured()) {
      return { 
        text: 'Desculpe, a API de IA não está configurada. Configure VITE_COHERE_API_KEY no arquivo .env', 
        relatedDocs: [] 
      };
    }

    try {
      // Simple keyword search to find relevant documents
      const keywords = userMessage.toLowerCase().split(' ').filter(w => w.length > 3);
      const relevantDocs = documents.filter(doc => {
        const docText = `${doc.title} ${doc.tags?.join(' ')} ${doc.summary || ''} ${doc.sector}`.toLowerCase();
        return keywords.some(kw => docText.includes(kw));
      }).slice(0, 3);

      // Build context from relevant documents
      let context = '';
      if (relevantDocs.length > 0) {
        context = `\n\nDocumentos relevantes encontrados no sistema:\n${relevantDocs.map(doc => 
          `- ${doc.title} (${doc.sector}): ${doc.summary || 'Sem resumo'} [Tags: ${doc.tags?.join(', ')}]`
        ).join('\n')}`;
      }

      const preamble = `Você é o assistente virtual do Repositório Digital da UEMA (Universidade Estadual do Maranhão).
Suas funções são:
- Ajudar usuários a encontrar documentos e processos
- Responder dúvidas sobre procedimentos administrativos
- Auxiliar na navegação do sistema
- Fornecer informações sobre setores (PROGEP, PROPLAD, PROEXAE, PPG, PROG, PROTOCOLO)

Seja cordial, objetivo e use linguagem formal. Se encontrar documentos relevantes no contexto, mencione-os na resposta.
${context}`;

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-r7b-12-2024',
          message: userMessage,
          preamble: preamble,
          chat_history: chatHistory,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const data: CohereResponse = await response.json();
      return {
        text: data.text,
        relatedDocs: relevantDocs.map(d => d.id)
      };
    } catch (error) {
      console.error('Cohere API Error:', error);
      return { 
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.', 
        relatedDocs: [] 
      };
    }
  }

  // Simple chat without RAG
  async chat(userMessage: string, chatHistory: ChatMessage[] = []): Promise<string> {
    const result = await this.chatWithRAG(userMessage, [], chatHistory);
    return result.text;
  }
}

export const aiService = new AIService();
