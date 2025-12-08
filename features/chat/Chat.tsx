import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User
} from 'lucide-react';
import { ChatMessage } from '../../types';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou o assistente virtual da UEMA. Como posso ajudar?', timestamp: 'Agora' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateResponse = (text: string) => {
      return 'Em análise... Consultando base de dados da UEMA. Por favor, aguarde enquanto verifico sua solicitação no sistema legado.';
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

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] bg-white border border-gray-300 rounded-sm shadow-sm">
       {/* Header Clássico */}
       <div className="px-3 py-2 bg-gray-100 border-b border-gray-300 flex items-center gap-2">
          <div className="font-bold text-gray-700 text-sm">Chat Suporte</div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
       </div>

       {/* Área de Mensagens */}
       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f9f9f9]">
          {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 flex items-center justify-center border border-gray-300 bg-white ${msg.role === 'assistant' ? 'text-blue-600' : 'text-gray-600'}`}>
                      {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`max-w-[70%] p-2 border text-xs ${
                      msg.role === 'user' 
                      ? 'bg-[#d2d6de] border-gray-300 text-gray-800' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}>
                      <p className="font-bold text-[10px] mb-1 opacity-70">{msg.role === 'assistant' ? 'Sistema' : 'Você'} - {msg.timestamp}</p>
                      {msg.content}
                  </div>
              </div>
          ))}
          {isTyping && (
              <div className="text-xs text-gray-500 italic ml-10">
                  O sistema está digitando...
              </div>
          )}
          <div ref={scrollRef} />
       </div>

       {/* Área de Input */}
       <div className="p-3 bg-gray-100 border-t border-gray-300">
           <form 
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
           >
               <input 
                 type="text" 
                 className="flex-1 p-2 border border-gray-300 text-sm focus:border-blue-400 outline-none"
                 placeholder="Digite aqui..."
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 disabled={isTyping}
               />
               <button 
                 type="submit"
                 disabled={!input.trim() || isTyping}
                 className="bg-[#3c8dbc] text-white px-4 border border-blue-700 hover:bg-[#367fa9] text-sm font-bold"
               >
                   Enviar
               </button>
           </form>
       </div>
    </div>
  );
};