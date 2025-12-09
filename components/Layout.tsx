import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  GitPullRequest, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  MessageSquareText,
  User,
  ChevronDown,
  HelpCircle,
  Home,
  BarChart3,
  X,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Trash2
} from 'lucide-react';
import { ViewState, User as UserType, Document, Process } from '../types';
import { showToast } from '../App';
import { storage } from '../services/storage';
import { realtimeService, isSupabaseConfigured } from '../services/supabase';

interface NotificationItem {
  id: string | number;
  text: string;
  time: string;
  unread: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: UserType;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView, 
  currentUser,
  onLogout 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ docs: Document[], processes: Process[] }>({ docs: [], processes: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, text: 'Bem-vindo ao UEMA Digital!', time: 'Agora', unread: true, type: 'success' },
    { id: 2, text: 'Sistema atualizado com novos recursos.', time: '1h atrás', unread: true, type: 'info' },
    { id: 3, text: 'Confira os novos relatórios disponíveis.', time: '3h atrás', unread: false, type: 'info' },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Carregar notificações do servidor e configurar realtime
  useEffect(() => {
    const loadAndSubscribe = async () => {
      if (isSupabaseConfigured() && currentUser?.id) {
        try {
          // Carregar notificações existentes
          const serverNotifs = await realtimeService.getUnreadNotifications(currentUser.id);
          if (serverNotifs.length > 0) {
            const mapped: NotificationItem[] = serverNotifs.map(n => ({
              id: n.id,
              text: n.message,
              time: formatTimeAgo(n.created_at),
              unread: !n.read,
              type: n.type
            }));
            setNotifications(prev => [...mapped, ...prev.filter(p => typeof p.id === 'number')]);
          }
          
          // Inscrever para notificações em tempo real
          const channel = realtimeService.subscribeToNotifications(currentUser.id, (notification) => {
            const newNotif: NotificationItem = {
              id: notification.id,
              text: notification.message,
              time: 'Agora',
              unread: true,
              type: notification.type
            };
            setNotifications(prev => [newNotif, ...prev]);
            
            // Mostrar notificação do browser se permitido
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
              });
            }
            
            showToast(notification.message, notification.type || 'info');
          });
          
          return () => {
            realtimeService.unsubscribe(channel);
          };
        } catch (err) {
          console.log('Notificações em modo local');
        }
      }
      
      // Solicitar permissão para notificações do browser
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };
    
    loadAndSubscribe();
  }, [currentUser?.id]);

  // Formatar tempo relativo
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    
    // Usar setTimeout para evitar que o click do botão seja capturado
    const handleClick = (event: MouseEvent) => {
      setTimeout(() => handleClickOutside(event), 0);
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Busca global
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults({ docs: [], processes: [] });
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      setShowSearchResults(true);

      await storage.init();
      const [allDocs, allProcesses] = await Promise.all([
        storage.getDocuments(),
        storage.getProcesses()
      ]);

      const query = searchQuery.toLowerCase();
      
      const docs = allDocs.filter(d => 
        d.title.toLowerCase().includes(query) ||
        d.sector.toLowerCase().includes(query) ||
        d.tags?.some(t => t.toLowerCase().includes(query)) ||
        d.summary?.toLowerCase().includes(query)
      ).slice(0, 5);

      const processes = allProcesses.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.number.toLowerCase().includes(query) ||
        p.currentStep.toLowerCase().includes(query)
      ).slice(0, 5);

      setSearchResults({ docs, processes });
      setIsSearching(false);
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearchResultClick = (type: 'document' | 'process') => {
    setSearchQuery('');
    setShowSearchResults(false);
    onChangeView(type === 'document' ? 'documents' : 'processes');
  };

  const markAllRead = async () => {
    // Marcar no servidor se configurado
    if (isSupabaseConfigured()) {
      try {
        await Promise.all(
          notifications
            .filter(n => n.unread && typeof n.id === 'string')
            .map(n => realtimeService.markAsRead(String(n.id)))
        );
      } catch (err) {
        console.log('Erro ao marcar como lidas no servidor');
      }
    }
    
    setNotifications(notifications.map(n => ({...n, unread: false})));
    showToast('Todas notificações marcadas como lidas', 'info');
  };

  const deleteNotification = (id: string | number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-4
        ${isActive 
          ? 'bg-slate-700 text-white border-blue-400' 
          : 'text-slate-300 hover:bg-slate-700 hover:text-white border-transparent'
        }`}
      >
        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
        <span>{label}</span>
      </button>
    );
  };

  const getPageTitle = () => {
      switch(currentView) {
          case 'dashboard': return 'Visão Geral';
          case 'documents': return 'Gestão de Arquivos';
          case 'processes': return 'Fluxo de Processos';
          case 'reports': return 'Relatórios Gerenciais';
          case 'chat': return 'Assistente Virtual';
          case 'settings': return 'Configurações';
          default: return '';
      }
  };

  return (
    <div className="flex h-screen bg-[#ecf0f5] font-sans">
      {/* Sidebar Escura Clássica */}
      <aside className="w-60 bg-[#222d32] flex flex-col z-20 shadow-lg">
        <div className="h-14 flex items-center px-4 bg-[#1a2226] text-white">
           <div className="flex items-center gap-2 cursor-pointer font-bold tracking-wider" onClick={() => onChangeView('dashboard')}>
              <span className="text-xl">UEMA</span>
              <span className="text-xs text-blue-400 uppercase mt-1">Digital</span>
           </div>
        </div>

        {/* User Info in Sidebar (Very 2010s) */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-700 bg-[#222d32]">
            <img src={currentUser.avatarUrl} className="w-10 h-10 rounded-full border-2 border-slate-600" />
            <div>
                <p className="text-white text-xs font-semibold">{currentUser.name}</p>
                <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-[10px] text-slate-400">Online</p>
                </div>
            </div>
        </div>

        <nav className="flex-1 py-4 space-y-0 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#1a2226]">Navegação Principal</div>
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="documents" icon={FileText} label="Documentos" />
          <NavItem view="processes" icon={GitPullRequest} label="Processos" />
          <NavItem view="reports" icon={BarChart3} label="Relatórios" />
          
          <div className="px-4 py-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#1a2226]">Sistema</div>
          <NavItem view="chat" icon={MessageSquareText} label="Suporte" />
          <NavItem view="settings" icon={Settings} label="Configurações" />
        </nav>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Azul Corporativo */}
        <header className="h-14 bg-[#3c8dbc] text-white flex items-center justify-between px-4 shadow-sm z-10">
          <div className="flex items-center gap-3">
             {/* Toggle Sidebar Icon simulation */}
             <div className="cursor-pointer hover:bg-white/10 p-2 rounded">
                <div className="space-y-1">
                    <div className="w-4 h-0.5 bg-white"></div>
                    <div className="w-4 h-0.5 bg-white"></div>
                    <div className="w-4 h-0.5 bg-white"></div>
                </div>
             </div>
             <h2 className="text-sm font-semibold uppercase tracking-wide hidden sm:block">
                {getPageTitle()}
             </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Busca Global */}
            <div ref={searchRef} className="relative hidden md:block">
                <div className="flex items-center bg-black/10 rounded-sm px-2 py-1 border border-transparent focus-within:bg-white focus-within:text-black transition-all w-64">
                    <input 
                      type="text" 
                      placeholder="Buscar documentos e processos..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                      className="bg-transparent text-sm w-full outline-none text-white placeholder:text-blue-100 focus:text-black" 
                    />
                    {searchQuery ? (
                      <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} className="text-blue-100 hover:text-white">
                        <X size={14} />
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')?.focus()}
                        className="text-blue-100 hover:text-white cursor-pointer"
                      >
                        <Search size={14} />
                      </button>
                    )}
                </div>

                {/* Resultados da Busca */}
                {showSearchResults && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-sm shadow-lg border border-gray-300 z-50 text-gray-800 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Buscando...</span>
                      </div>
                    ) : (
                      <>
                        {searchResults.docs.length === 0 && searchResults.processes.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Nenhum resultado para "{searchQuery}"
                          </div>
                        ) : (
                          <>
                            {searchResults.docs.length > 0 && (
                              <div>
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                                  <FileText size={12} /> Documentos ({searchResults.docs.length})
                                </div>
                                {searchResults.docs.map(doc => (
                                  <button 
                                    key={doc.id}
                                    onClick={() => handleSearchResultClick('document')}
                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 flex items-center gap-2"
                                  >
                                    {doc.type === 'XLSX' ? <FileSpreadsheet size={14} className="text-green-600" /> : <FileText size={14} className="text-red-500" />}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-800 font-medium truncate">{doc.title}</p>
                                      <p className="text-xs text-gray-500">{doc.sector} • {doc.createdAt}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            {searchResults.processes.length > 0 && (
                              <div>
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                                  <GitPullRequest size={12} /> Processos ({searchResults.processes.length})
                                </div>
                                {searchResults.processes.map(proc => (
                                  <button 
                                    key={proc.id}
                                    onClick={() => handleSearchResultClick('process')}
                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 flex items-center gap-2"
                                  >
                                    <GitPullRequest size={14} className="text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-800 font-medium truncate">{proc.title}</p>
                                      <p className="text-xs text-gray-500">{proc.number} • {proc.status}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
            </div>

            {/* Notificações */}
            <div className="relative" ref={notificationRef}>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setShowNotifications(prev => !prev); 
                    setShowUserMenu(false); 
                  }}
                  className="p-2 hover:bg-white/10 rounded-sm relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">{unreadCount}</span>
                  )}
                </button>
                
                {showNotifications && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 text-gray-800"
                      style={{ zIndex: 9999 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg flex justify-between items-center">
                            <span className="font-bold text-sm text-gray-700">Notificações ({unreadCount} novas)</span>
                            <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Marcar como lidas</button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                Nenhuma notificação
                              </div>
                            ) : (
                              notifications.map(n => (
                                <div key={n.id} className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex gap-3 group cursor-pointer ${n.unread ? 'bg-blue-50' : ''}`}>
                                    {n.type === 'success' ? <CheckCircle size={16} className="mt-0.5 text-green-500 flex-shrink-0" /> :
                                     n.type === 'warning' ? <AlertTriangle size={16} className="mt-0.5 text-yellow-500 flex-shrink-0" /> :
                                     n.type === 'error' ? <XCircle size={16} className="mt-0.5 text-red-500 flex-shrink-0" /> :
                                     <Info size={16} className="mt-0.5 text-blue-500 flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800">{n.text}</p>
                                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                </div>
                              ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Menu Usuário */}
            <div className="relative border-l border-white/20 pl-4 ml-2" ref={userMenuRef}>
                <button 
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                    className="flex items-center gap-2 hover:text-blue-100"
                >
                    <span className="text-sm font-semibold hidden sm:block">{currentUser.name}</span>
                    <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full border border-white/50" />
                </button>

                {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-sm shadow-lg border border-gray-300 py-1 z-50">
                        <div className="px-4 py-3 bg-blue-500 text-white text-center mb-1">
                            <p className="text-sm font-bold">{currentUser.name}</p>
                            <p className="text-xs opacity-80">{currentUser.role}</p>
                        </div>
                        <button onClick={() => onChangeView('settings')} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <Settings size={14} /> Minha Conta
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-gray-100 flex items-center gap-2">
                            <LogOut size={14} /> Sair do Sistema
                        </button>
                    </div>
                )}
            </div>
          </div>
        </header>

        {/* Breadcrumb Section (Classic) */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm">
            <h1 className="text-lg font-normal text-gray-800">
                {getPageTitle()} 
                <small className="text-gray-500 text-xs ml-2 font-light">Painel de Controle</small>
            </h1>
            <div className="flex items-center gap-1 text-xs text-gray-500">
                <Home size={12} />
                <span>Home</span>
                {currentView !== 'dashboard' && (
                    <>
                        <span>&gt;</span>
                        <span className="text-gray-700 font-semibold capitalize">{currentView}</span>
                    </>
                )}
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#ecf0f5] p-6">
           {children}
        </main>
      </div>
    </div>
  );
};