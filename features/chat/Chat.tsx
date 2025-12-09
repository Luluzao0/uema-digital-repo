import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User,
  Loader2,
  History,
  Plus,
  Trash2,
  FileText,
  X,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { ChatMessage, ChatSession, Document } from '../../types';
import { storage } from '../../services/storage';
import { aiService } from '../../services/ai';

// Componente de bolha de mensagem animada
const ChatBubble: React.FC<{ message: ChatMessage; isUser: boolean }> = ({ message, isUser }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
          isUser 
            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
        }`}
      >
        {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
      </motion.div>
      
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={`p-4 rounded-3xl ${
            isUser 
              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-tr-lg' 
              : 'bg-white/5 border border-white/10 rounded-tl-lg backdrop-blur-xl'
          }`}
        >
          <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </motion.div>
        <p className={`text-[10px] text-white/40 mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp}
        </p>
      </div>
    </motion.div>
  );
};

// Componente de indicador de digitação
const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-3"
    >
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
        <Bot size={18} className="text-white" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-3xl rounded-tl-lg px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <motion.div
            className="flex gap-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.div>
          <span className="text-xs text-white/50 ml-2">Pensando...</span>
        </div>
      </div>
    </motion.div>
  );
};

export const Chat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [useRAG, setUseRAG] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      await storage.init();
      const [loadedSessions, loadedDocs] = await Promise.all([
        storage.getChatSessions(),
        storage.getDocuments()
      ]);
      setSessions(loadedSessions);
      setDocuments(loadedDocs);
      
      if (loadedSessions.length === 0) {
        createNewSession();
      } else {
        setCurrentSession(loadedSessions[0]);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isTyping]);

  const createNewSession = async () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Nova Conversa',
      messages: [
        { 
          id: '1', 
          role: 'assistant', 
          content: `Olá! Sou o assistente virtual da UEMA. ${documents.length > 0 ? `Tenho acesso a ${documents.length} documentos do repositório que posso usar para te ajudar melhor.` : ''} Como posso ajudar?`, 
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await storage.saveChatSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    setShowSidebar(false);
  };

  const deleteSession = async (sessionId: string) => {
    await storage.deleteChatSession(sessionId);
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    
    if (currentSession?.id === sessionId) {
      if (newSessions.length > 0) {
        setCurrentSession(newSessions[0]);
      } else {
        createNewSession();
      }
    }
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSession(session);
    setShowSidebar(false);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !currentSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
      title: currentSession.messages.length <= 1 ? text.slice(0, 30) + '...' : currentSession.title,
      updatedAt: new Date().toISOString()
    };

    setCurrentSession(updatedSession);
    setInput('');
    setIsTyping(true);

    const history = updatedMessages.slice(1, -1).map(m => ({
      role: (m.role === 'assistant' ? 'CHATBOT' : 'USER') as 'USER' | 'CHATBOT',
      message: m.content
    }));

    let responseText: string;
    if (useRAG && documents.length > 0) {
      const result = await aiService.chatWithRAG(text, documents, history);
      responseText = result.text;
    } else {
      responseText = await aiService.chat(text, history);
    }

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    const finalSession = {
      ...updatedSession,
      messages: [...updatedMessages, botMsg],
      updatedAt: new Date().toISOString()
    };

    setCurrentSession(finalSession);
    await storage.saveChatSession(finalSession);
    setSessions(prev => prev.map(s => s.id === finalSession.id ? finalSession : s));
    setIsTyping(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-[calc(100vh-12rem)] relative"
    >
      {/* Sidebar Panel */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-white/5 backdrop-blur-2xl border-r border-white/10 z-20 flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-white/60" />
                  <span className="text-white font-medium">Histórico</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSidebar(false)}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X size={18} />
                </motion.button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {sessions.map((session, idx) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => selectSession(session)}
                    className={`p-3 rounded-2xl cursor-pointer flex justify-between items-center group transition-all ${
                      currentSession?.id === session.id 
                        ? 'bg-white/10 border border-white/20' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{session.title}</p>
                      <p className="text-xs text-white/40">{session.messages.length} mensagens</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                      className="text-white/30 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
              
              <div className="p-3 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createNewSession}
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl text-white font-medium flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Nova Conversa
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSidebar(true)}
              className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <History size={20} />
            </motion.button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Assistente UEMA</h2>
                <p className="text-xs text-white/50">Online • Powered by Cohere AI</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {documents.length > 0 && (
              <motion.label
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                  useRAG 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                    : 'bg-white/5 border border-white/10 text-white/50'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={useRAG} 
                  onChange={e => setUseRAG(e.target.checked)}
                  className="sr-only"
                />
                <FileText size={16} />
                <span className="text-xs font-medium">RAG ({documents.length})</span>
              </motion.label>
            )}
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={createNewSession}
              className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </motion.button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="popLayout">
            {currentSession?.messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isUser={msg.role === 'user'}
              />
            ))}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative"
          >
            <div className="relative flex items-center gap-3">
              <motion.div
                className="flex-1 relative"
                whileFocus={{ scale: 1.01 }}
              >
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all pr-12"
                  placeholder={useRAG ? "Pergunte sobre seus documentos..." : "Digite sua mensagem..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isTyping}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <MessageCircle size={18} className="text-white/20" />
                </div>
              </motion.div>
              
              <motion.button
                type="submit"
                disabled={!input.trim() || isTyping}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/25"
              >
                {isTyping ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </motion.button>
            </div>
          </form>
          
          <p className="text-center text-[10px] text-white/30 mt-3">
            IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </motion.div>
  );
};