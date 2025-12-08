import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import { CURRENT_USER } from './constants';
import { Layout } from './components/Layout';
import { Login } from './features/auth/Login';
import { Dashboard } from './features/dashboard/Dashboard';
import { Documents } from './features/documents/Documents';
import { Processes } from './features/processes/Processes';
import { Reports } from './features/reports/Reports';
import { Chat } from './features/chat/Chat';
import { Settings } from './features/settings/Settings';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// Global Event Helper for Toasts
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const event = new CustomEvent('show-toast', { detail: { message, type } });
  window.dispatchEvent(event);
};

const Toaster = () => {
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: string}>>([]);

  useEffect(() => {
    const handler = (e: any) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: e.detail.message, type: e.detail.type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    window.addEventListener('show-toast', handler);
    return () => window.removeEventListener('show-toast', handler);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className="animate-enter pointer-events-auto flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/20 min-w-[300px]"
        >
          {toast.type === 'success' && <CheckCircle2 className="text-emerald-400" size={20} />}
          {toast.type === 'error' && <XCircle className="text-red-400" size={20} />}
          {toast.type === 'info' && <AlertCircle className="text-blue-400" size={20} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const handleLogin = () => {
    setIsAuthenticated(true);
    showToast('Login realizado com sucesso!', 'success');
  };

  const handleLogout = () => {
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
        // Fallback for unknown routes
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <h2 className="text-2xl font-bold text-slate-800">Página não encontrada</h2>
                <p className="text-slate-500 mt-2">A seção solicitada não está disponível.</p>
                <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                    Voltar ao Início
                </button>
            </div>
        );
    }
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onChangeView={setCurrentView}
        currentUser={CURRENT_USER}
        onLogout={handleLogout}
      >
        {renderContent()}
      </Layout>
      <Toaster />
    </>
  );
};

export default App;