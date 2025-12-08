import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles
} from 'lucide-react';
import { ChatMessage } from '../types';

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou o assistente virtual da UEMA. Posso ajudar a encontrar documentos, explicar regras de editais ou consultar o status de processos. Como posso ajudar hoje?', timestamp: 'Agora' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateResponse = (text: string) => {
      const lower = text.toLowerCase();
      if (lower.includes('processo')) {
          return 'Verifiquei que você possui processos em andamento. O processo **PROC-2025-00128** está atualmente na fase de Análise Orçamentária na PROPLAD. O prazo estimado para conclusão desta etapa é de 2 dias úteis.';
      }
      if (lower.includes('edital') || lower.includes('concurso')) {
          return 'Sobre o **Edital 01/2025**: As inscrições vão até o dia 30/10. É necessário anexar o Currículo Lattes atualizado e o Plano de Trabalho. Você gostaria que eu listasse os documentos necessários?';
      }
      if (lower.includes('ajuda') || lower.includes('suporte')) {
          return 'Para suporte técnico especializado, você pode abrir um chamado no sistema da Superintendência de TI ou entrar em contato pelo ramal 1234. Posso te ajudar com algo mais simples por aqui?';
      }
      if (lower.includes('status') || lower.includes('andamento')) {
          return 'A maioria dos seus documentos está em dia. Há apenas uma pendência no relatório financeiro do Q3 que aguarda sua assinatura.';
      }
      return 'Entendi. Para fornecer uma resposta mais precisa, estou consultando a base de conhecimento da UEMA... Por favor, verifique se a informação consta no Portal da Transparência ou reformule sua pergunta para ser mais específico.';
  };

  const handleSend = (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const responseText = generateResponse(text);

    setTimeout(() => {
        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    }, 1500);
  };

  const suggestions = [
      "Qual o status do processo 00128?",
      "Baixar edital de concurso docente",
      "Como abrir chamado técnico?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
       {/* Header Amigável */}
       <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white">
              <Bot size={20} />
          </div>
          <div>
              <h3 className="font-bold text-slate-800">Suporte Inteligente</h3>
              <p className="text-xs text-slate-500">Respostas baseadas nos documentos oficiais</p>
          </div>
       </div>

       {/* Área de Mensagens */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafafa]">
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                      {msg.content}
                  </div>
              </div>
          ))}
          {isTyping && (
              <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Bot size={16} />
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none text-xs text-slate-400 italic">
                      Consultando base de dados...
                  </div>
              </div>
          )}
          <div ref={scrollRef} />
       </div>

       {/* Área de Input e Sugestões */}
       <div className="p-4 bg-white border-t border-slate-100">
           {messages.length < 3 && !isTyping && (
               <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                   {suggestions.map((s, i) => (
                       <button 
                        key={i} 
                        onClick={() => handleSend(s)}
                        className="whitespace-nowrap px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                       >
                           <Sparkles size={12} /> {s}
                       </button>
                   ))}
               </div>
           )}

           <form 
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
           >
               <input 
                 type="text" 
                 className="flex-1 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                 placeholder="Digite sua dúvida aqui..."
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 disabled={isTyping}
               />
               <button 
                 type="submit"
                 disabled={!input.trim() || isTyping}
                 className="bg-emerald-600 text-white px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
               >
                   <Send size={20} />
               </button>
           </form>
       </div>
    </div>
  );
};