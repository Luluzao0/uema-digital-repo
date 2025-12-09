import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewState } from './types';
import { CURRENT_USER } from './constants';
import { DockNavigation } from './components/DockNavigation';
import { Login } from './features/auth/Login';
import { Dashboard } from './features/dashboard/Dashboard';
import { Documents } from './features/documents/Documents';
import { Processes } from './features/processes/Processes';
import { Reports } from './features/reports/Reports';
import { Chat } from './features/chat/Chat';
import { Settings } from './features/settings/Settings';
import { CheckCircle2, XCircle, AlertCircle, Bell, Search, User } from 'lucide-react';
import { storage } from './services/storage';

// Global Event Helper for Toasts
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const event = new CustomEvent('show-toast', { detail: { message, type } });
  window.dispatchEvent(event);
};

const Toaster = () => {
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: string}>>([]);

  useEffect(() => {
    const handler = (e: CustomEvent<{message: string, type: string}>) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: e.detail.message, type: e.detail.type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    window.addEventListener('show-toast', handler as EventListener);
    return () => window.removeEventListener('show-toast', handler as EventListener);
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div 
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 glass-strong rounded-2xl min-w-[300px]"
          >
            {toast.type === 'success' && <CheckCircle2 className="text-emerald-400" size={20} />}
            {toast.type === 'error' && <XCircle className="text-red-400" size={20} />}
            {toast.type === 'info' && <AlertCircle className="text-blue-400" size={20} />}
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Floating Header Component
const FloatingHeader = ({ userName, userPhoto }: { userName: string; userPhoto?: string }) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      className="fixed top-6 right-6 z-40 flex items-center gap-3"
    >
      {/* Search Toggle */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 250, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <input
              type="text"
              placeholder="Buscar..."
              autoFocus
              className="w-full h-10 px-4 glass rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              onBlur={() => setShowSearch(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowSearch(!showSearch)}
        className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        <Search className="w-5 h-5 text-white/70" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-white/70" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
          3
        </span>
      </motion.button>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 px-3 py-2 glass rounded-xl cursor-pointer"
      >
        {userPhoto ? (
          <img src={userPhoto} alt={userName} className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="text-sm font-medium text-white/90 hidden sm:block">{userName}</span>
      </motion.div>
    </motion.div>
  );
};

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 }
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [userPhoto, setUserPhoto] = useState<string | undefined>();

  useEffect(() => {
    // Load user photo from storage
    const loadUserData = async () => {
      await storage.init();
      const settings = await storage.getSettings();
      if (settings?.photoUrl) {
        setUserPhoto(settings.photoUrl);
      }
    };
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    showToast('Login realizado com sucesso!', 'success');
  };

  const handleLogout = async () => {
    await storage.init();
    await storage.setAuthenticated(false);
    localStorage.removeItem('uema_remember');
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    showToast('Você saiu do sistema.', 'info');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'documents':
        return <Documents />;
      case 'processes':
        return <Processes />;
      case 'reports':
        return <Reports />;
      case 'chat':
        return <Chat />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <motion.div 
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center justify-center h-[50vh] text-center"
          >
            <h2 className="text-2xl font-bold text-white">Página não encontrada</h2>
            <p className="text-white/50 mt-2">A seção solicitada não está disponível.</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('dashboard')}
              className="mt-4 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              Voltar ao Início
            </motion.button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Floating Header */}
      <FloatingHeader userName={CURRENT_USER.name} userPhoto={userPhoto} />
      
      {/* Main Content */}
      <main className="relative z-10 px-6 pt-6 pb-32 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Dock Navigation */}
      <DockNavigation 
        currentPage={currentView}
        onNavigate={(page) => setCurrentView(page as ViewState)}
        onLogout={handleLogout}
      />
      
      <Toaster />
    </div>
  );
};

export default App;