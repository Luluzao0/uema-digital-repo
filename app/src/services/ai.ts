import { COHERE_API_KEY } from '../config/env';
import { Document } from '../types';

const COHERE_URL = 'https://api.cohere.ai/v1';

export const aiService = {
  async generateTags(text: string, title: string): Promise<string[]> {
    if (!COHERE_API_KEY) {
      // Fallback: gerar tags simples
      const words = `${title} ${text}`.toLowerCase().split(/\s+/);
      const common = ['documento', 'uema', 'processo', 'de', 'da', 'do', 'para', 'com', 'em', 'o', 'a', 'os', 'as'];
      return [...new Set(words.filter(w => w.length > 3 && !common.includes(w)))].slice(0, 5);
    }

    try {
      const response = await fetch(`${COHERE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: `Analise o seguinte documento e gere 5 tags relevantes em português. Retorne apenas as tags separadas por vírgula, sem explicações.

Título: ${title}
Conteúdo: ${text.substring(0, 1000)}

Tags:`,
          max_tokens: 50,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const tagsText = data.generations?.[0]?.text || '';
      return tagsText.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0).slice(0, 5);
    } catch (err) {
      console.error('Erro ao gerar tags:', err);
      return [];
    }
  },

  async generateSummary(text: string, title: string): Promise<string> {
    if (!COHERE_API_KEY) {
      return `Documento: ${title}. ${text.substring(0, 150)}...`;
    }

    try {
      const response = await fetch(`${COHERE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: `Faça um resumo conciso em português (máximo 2 frases) do seguinte documento:

Título: ${title}
Conteúdo: ${text.substring(0, 2000)}

Resumo:`,
          max_tokens: 100,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      return data.generations?.[0]?.text?.trim() || '';
    } catch (err) {
      console.error('Erro ao gerar resumo:', err);
      return '';
    }
  },

  async chat(message: string, context: Document[]): Promise<string> {
    if (!COHERE_API_KEY) {
      return 'Desculpe, o assistente de IA não está configurado. Configure a chave da API Cohere para usar este recurso.';
    }

    try {
      const contextText = context.map(d => 
        `Documento: ${d.title}\nSetor: ${d.sector}\nTags: ${d.tags?.join(', ')}\nResumo: ${d.summary || 'N/A'}\nConteúdo: ${d.content?.substring(0, 500) || 'N/A'}`
      ).join('\n\n---\n\n');

      const response = await fetch(`${COHERE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          message: message,
          preamble: `Você é um assistente virtual do UEMA Digital, um sistema de gestão documental universitário. Responda em português de forma clara e objetiva. Use apenas as informações dos documentos fornecidos no contexto.

CONTEXTO DOS DOCUMENTOS:
${contextText}

REGRAS:
- Responda apenas com base nos documentos do contexto
- Se não souber, diga que não encontrou a informação
- Seja conciso e direto`,
          temperature: 0.5,
        }),
      });

      const data = await response.json();
      return data.text || 'Não foi possível processar sua mensagem.';
    } catch (err) {
      console.error('Erro no chat:', err);
      return 'Erro ao processar sua mensagem. Tente novamente.';
    }
  },
};
