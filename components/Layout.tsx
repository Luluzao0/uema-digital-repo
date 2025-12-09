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
  Loader2
} from 'lucide-react';
import { ViewState, User as UserType, Document, Process } from '../types';
import { showToast } from '../App';
import { storage } from '../services/storage';

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
  
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Seu processo foi aprovado.', time: '2 min atrás', unread: true },
    { id: 2, text: 'Novo documento disponível na PROGEP.', time: '1h atrás', unread: false },
    { id: 3, text: 'Reunião do conselho agendada.', time: '3h atrás', unread: true },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Fechar busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({...n, unread: false})));
    showToast('Todas notificações marcadas como lidas', 'info');
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
                      <Search size={14} className="text-blue-100" />
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
            <div className="relative">
                <button 
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  className="p-2 hover:bg-white/10 rounded-sm relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-3 bg-red-500 rounded text-[9px] flex items-center justify-center font-bold">{unreadCount}</span>
                  )}
                </button>
                
                {showNotifications && (
                    <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-sm shadow-lg border border-gray-300 z-50 text-gray-800">
                        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <span className="font-bold text-xs text-gray-600">Notificações</span>
                            <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Limpar</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.map(n => (
                                <div key={n.id} className={`px-3 py-2 border-b border-gray-100 hover:bg-gray-50 flex gap-2 ${n.unread ? 'bg-blue-50' : ''}`}>
                                    <Bell size={14} className="mt-1 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-800">{n.text}</p>
                                        <p className="text-[10px] text-gray-400">{n.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Menu Usuário */}
            <div className="relative border-l border-white/20 pl-4 ml-2">
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