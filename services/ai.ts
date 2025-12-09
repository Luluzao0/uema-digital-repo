// Cohere AI Service for document processing and chat
import { Document } from '../types';

const COHERE_API_KEY = (import.meta as any).env?.VITE_COHERE_API_KEY || '';

interface CohereResponse {
  text: string;
}

interface EmbedResponse {
  embeddings: number[][];
}

interface RerankResponse {
  results: Array<{
    index: number;
    relevance_score: number;
  }>;
}

interface ChatMessage {
  role: 'USER' | 'CHATBOT';
  message: string;
}

interface DocumentWithScore extends Document {
  relevanceScore?: number;
  embedding?: number[];
}

class AIService {
  private apiKey: string;
  private embeddingsCache: Map<string, number[]> = new Map();

  constructor() {
    this.apiKey = COHERE_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  // ==========================================
  // EMBEDDINGS E BUSCA SEMÂNTICA
  // ==========================================

  // Gerar embeddings para texto
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.isConfigured()) return null;

    // Verificar cache
    const cacheKey = text.substring(0, 100);
    if (this.embeddingsCache.has(cacheKey)) {
      return this.embeddingsCache.get(cacheKey)!;
    }

    try {
      const response = await fetch('https://api.cohere.ai/v1/embed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [text],
          model: 'embed-multilingual-v3.0',
          input_type: 'search_document',
          truncate: 'END'
        })
      });

      if (!response.ok) return null;

      const data: EmbedResponse = await response.json();
      const embedding = data.embeddings[0];
      
      // Cachear embedding
      this.embeddingsCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  // Calcular similaridade de cosseno entre dois vetores
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Busca semântica em documentos
  async semanticSearch(
    query: string, 
    documents: Document[], 
    topK: number = 5
  ): Promise<DocumentWithScore[]> {
    if (!this.isConfigured() || documents.length === 0) {
      // Fallback para busca por keywords
      return this.keywordSearch(query, documents, topK);
    }

    try {
      // Gerar embedding da query
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        return this.keywordSearch(query, documents, topK);
      }

      // Gerar embeddings para documentos e calcular similaridade
      // Incluir conteúdo extraído para melhor precisão
      const docsWithScores: DocumentWithScore[] = await Promise.all(
        documents.map(async (doc) => {
          const docText = `${doc.title} ${doc.tags?.join(' ')} ${doc.summary || ''} ${doc.sector} ${doc.content?.substring(0, 500) || ''}`;
          const docEmbedding = await this.generateEmbedding(docText);
          
          const score = docEmbedding 
            ? this.cosineSimilarity(queryEmbedding, docEmbedding)
            : 0;

          return { ...doc, relevanceScore: score };
        })
      );

      // Ordenar por relevância e retornar top K
      return docsWithScores
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, topK);
    } catch (error) {
      console.error('Semantic search error:', error);
      return this.keywordSearch(query, documents, topK);
    }
  }

  // Reranking de documentos usando Cohere Rerank
  async rerankDocuments(
    query: string,
    documents: Document[],
    topK: number = 5
  ): Promise<DocumentWithScore[]> {
    if (!this.isConfigured() || documents.length === 0) {
      return this.keywordSearch(query, documents, topK);
    }

    try {
      // Incluir conteúdo extraído para melhor reranking
      const docTexts = documents.map(doc => 
        `${doc.title}. ${doc.summary || ''} Tags: ${doc.tags?.join(', ')} Setor: ${doc.sector}. ${doc.content?.substring(0, 300) || ''}`
      );

      const response = await fetch('https://api.cohere.ai/v1/rerank', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'rerank-multilingual-v3.0',
          query: query,
          documents: docTexts,
          top_n: topK,
          return_documents: false
        })
      });

      if (!response.ok) {
        return this.keywordSearch(query, documents, topK);
      }

      const data: RerankResponse = await response.json();
      
      return data.results.map(result => ({
        ...documents[result.index],
        relevanceScore: result.relevance_score
      }));
    } catch (error) {
      console.error('Rerank error:', error);
      return this.keywordSearch(query, documents, topK);
    }
  }

  // Busca por palavras-chave (fallback)
  keywordSearch(query: string, documents: Document[], topK: number = 5): DocumentWithScore[] {
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2);
    
    const docsWithScores = documents.map(doc => {
      // Incluir conteúdo extraído na busca por keywords
      const docText = `${doc.title} ${doc.tags?.join(' ')} ${doc.summary || ''} ${doc.sector} ${doc.content || ''}`.toLowerCase();
      const matchCount = keywords.filter(kw => docText.includes(kw)).length;
      const score = matchCount / Math.max(keywords.length, 1);
      
      return { ...doc, relevanceScore: score };
    });

    return docsWithScores
      .filter(d => (d.relevanceScore || 0) > 0)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, topK);
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
  ): Promise<{ text: string; relatedDocs: string[]; relevantDocs: DocumentWithScore[] }> {
    if (!this.isConfigured()) {
      return { 
        text: 'Desculpe, a API de IA não está configurada. Configure VITE_COHERE_API_KEY no arquivo .env', 
        relatedDocs: [],
        relevantDocs: []
      };
    }

    try {
      // Usar busca semântica ou reranking para encontrar documentos relevantes
      let relevantDocs: DocumentWithScore[];
      
      if (documents.length > 10) {
        // Para muitos documentos, usar reranking (mais eficiente)
        relevantDocs = await this.rerankDocuments(userMessage, documents, 5);
      } else {
        // Para poucos documentos, busca semântica completa
        relevantDocs = await this.semanticSearch(userMessage, documents, 5);
      }

      // Build context from relevant documents - incluir conteúdo extraído quando disponível
      let context = '';
      if (relevantDocs.length > 0) {
        context = `\n\nDocumentos encontrados no repositório:
${relevantDocs.map((doc, idx) => {
  const contentPreview = doc.content ? doc.content.substring(0, 500) + '...' : '';
  return `${idx + 1}. "${doc.title}" (Setor: ${doc.sector})
   Resumo: ${doc.summary || 'Não disponível'}
   Tags: ${doc.tags?.join(', ') || 'Nenhuma'}
   ${contentPreview ? `Trecho do conteúdo: ${contentPreview}` : ''}`;
}).join('\n\n')}`;
      }

      const preamble = `Você é o assistente virtual do Repositório Digital da UEMA.

REGRAS IMPORTANTES:
1. SOMENTE mencione documentos que estão LISTADOS no contexto abaixo
2. NÃO invente ou sugira documentos que não existem no contexto
3. Se o contexto mostrar documentos relevantes, cite-os pelo título exato
4. Se NÃO houver documentos relevantes no contexto, diga "Não encontrei documentos específicos sobre isso no repositório"
5. Seja conciso e objetivo nas respostas
6. Use linguagem formal e cordial

Setores da UEMA: PROGEP (Gestão de Pessoas), PROPLAD (Planejamento), PROEXAE (Extensão), PPG (Pós-Graduação), PROG (Graduação), PROTOCOLO (Secretaria)
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
          connectors: relevantDocs.length > 0 ? undefined : undefined, // Podemos adicionar conectores no futuro
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const data: CohereResponse = await response.json();
      return {
        text: data.text,
        relatedDocs: relevantDocs.map(d => d.id),
        relevantDocs: relevantDocs
      };
    } catch (error) {
      console.error('Cohere API Error:', error);
      return { 
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.', 
        relatedDocs: [],
        relevantDocs: []
      };
    }
  }

  // Simple chat without RAG
  async chat(userMessage: string, chatHistory: ChatMessage[] = []): Promise<string> {
    const result = await this.chatWithRAG(userMessage, [], chatHistory);
    return result.text;
  }

  // ==========================================
  // ANÁLISE DE DOCUMENTOS
  // ==========================================

  // Classificar documento automaticamente
  async classifyDocument(title: string, content?: string): Promise<{
    sector: string;
    type: string;
    priority: 'Low' | 'Medium' | 'High';
    confidence: number;
  }> {
    if (!this.isConfigured()) {
      return { sector: 'PROGEP', type: 'PDF', priority: 'Medium', confidence: 0 };
    }

    try {
      const prompt = `Analise o seguinte documento e classifique-o:
Título: "${title}"
${content ? `Conteúdo: "${content.substring(0, 500)}"` : ''}

Responda APENAS em formato JSON com as chaves: sector (PROGEP, PROPLAD, PROEXAE, PPG, PROG ou PROTOCOLO), type (PDF, DOCX, XLSX), priority (Low, Medium, High), confidence (0 a 1).
Exemplo: {"sector": "PROGEP", "type": "PDF", "priority": "Medium", "confidence": 0.85}`;

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-r7b-12-2024',
          message: prompt,
          temperature: 0.2,
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data: CohereResponse = await response.json();
      
      // Tentar extrair JSON da resposta
      const jsonMatch = data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { sector: 'PROGEP', type: 'PDF', priority: 'Medium', confidence: 0.5 };
    } catch (error) {
      console.error('Error classifying document:', error);
      return { sector: 'PROGEP', type: 'PDF', priority: 'Medium', confidence: 0 };
    }
  }

  // Extrair entidades de um documento
  async extractEntities(text: string): Promise<{
    people: string[];
    dates: string[];
    organizations: string[];
    locations: string[];
  }> {
    if (!this.isConfigured()) {
      return { people: [], dates: [], organizations: [], locations: [] };
    }

    try {
      const prompt = `Extraia as entidades do seguinte texto:
"${text.substring(0, 1000)}"

Responda APENAS em formato JSON com as chaves: people (nomes de pessoas), dates (datas), organizations (organizações/empresas), locations (locais).
Exemplo: {"people": ["João Silva"], "dates": ["15/03/2024"], "organizations": ["UEMA"], "locations": ["São Luís"]}`;

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-r7b-12-2024',
          message: prompt,
          temperature: 0.2,
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data: CohereResponse = await response.json();
      const jsonMatch = data.text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { people: [], dates: [], organizations: [], locations: [] };
    } catch (error) {
      console.error('Error extracting entities:', error);
      return { people: [], dates: [], organizations: [], locations: [] };
    }
  }

  // Sugerir documentos relacionados
  async suggestRelatedDocuments(
    currentDoc: Document, 
    allDocuments: Document[]
  ): Promise<Document[]> {
    const otherDocs = allDocuments.filter(d => d.id !== currentDoc.id);
    
    if (otherDocs.length === 0) return [];

    const queryText = `${currentDoc.title} ${currentDoc.tags?.join(' ')} ${currentDoc.summary || ''}`;
    
    // Usar busca semântica para encontrar documentos similares
    const similarDocs = await this.semanticSearch(queryText, otherDocs, 3);
    
    return similarDocs.filter(d => (d.relevanceScore || 0) > 0.3);
  }

  // Gerar perguntas frequentes sobre um documento
  async generateFAQs(document: Document): Promise<string[]> {
    if (!this.isConfigured()) {
      return ['O que é este documento?', 'Qual o objetivo deste documento?'];
    }

    try {
      const prompt = `Gere 3 perguntas frequentes (FAQs) que um usuário poderia ter sobre o seguinte documento:
Título: "${document.title}"
Setor: ${document.sector}
Tags: ${document.tags?.join(', ')}
Resumo: ${document.summary || 'Não disponível'}

Responda APENAS com as perguntas, uma por linha, sem numeração.`;

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-r7b-12-2024',
          message: prompt,
          temperature: 0.5,
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data: CohereResponse = await response.json();
      return data.text.split('\n').filter(q => q.trim().length > 0).slice(0, 3);
    } catch (error) {
      console.error('Error generating FAQs:', error);
      return ['O que é este documento?', 'Qual o objetivo deste documento?'];
    }
  }
}

export const aiService = new AIService();
