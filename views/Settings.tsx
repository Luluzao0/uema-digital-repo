import React, { useState } from 'react';
import { User, Bell, Lock, Cpu, Save, Shield, Key, Smartphone, Mail } from 'lucide-react';
import { CURRENT_USER } from '../constants';
import { showToast } from '../App';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'ai' | 'security'>('profile');
  
  // Local state for profile inputs to allow editing simulation
  const [profileData, setProfileData] = useState({
      name: CURRENT_USER.name,
      role: 'Gerente Administrativo'
  });

  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'ai', label: 'Preferências de IA', icon: Cpu },
    { id: 'security', label: 'Segurança', icon: Lock },
  ];

  const handleSave = () => {
    showToast('Configurações salvas com sucesso!');
  };

  const ToggleItem = ({ title, desc, defaultChecked = false }: { title: string, desc: string, defaultChecked?: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div>
            <h4 className="font-semibold text-slate-800">{title}</h4>
            <p className="text-sm text-slate-500">{desc}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie seus dados, preferências e ajustes do sistema.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
                  ${isActive 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
                    : 'text-slate-500 hover:bg-white hover:text-slate-800'
                  }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[500px]">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Informações Pessoais</h2>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group cursor-pointer">
                  <img 
                    src={CURRENT_USER.avatarUrl} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 group-hover:border-emerald-100 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-medium">Alterar</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{profileData.name}</h3>
                  <p className="text-sm text-slate-500">{CURRENT_USER.role} • {CURRENT_USER.sector}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Institucional</label>
                  <input type="email" defaultValue={CURRENT_USER.email} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Departamento</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                    <option>{CURRENT_USER.sector}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Cargo</label>
                  <input 
                    type="text" 
                    value={profileData.role} 
                    onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                   />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                  <Save size={18} />
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
             <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Inteligência Artificial (UEMA Brain)</h2>
                
                <div className="space-y-4">
                    <ToggleItem 
                        title="Auto-Classificação de Documentos"
                        desc="Permitir que a IA sugira tags e categorias automaticamente ao fazer upload."
                        defaultChecked
                    />
                    <ToggleItem 
                        title="Resumo Automático de Processos"
                        desc="Gerar resumos executivos de processos com mais de 10 páginas."
                        defaultChecked
                    />
                    
                    <div className="p-4 border border-slate-200 rounded-xl">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nível de Criatividade (Temperatura)</label>
                        <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div className="flex justify-between text-xs text-slate-400 mt-2">
                            <span>Preciso</span>
                            <span>Equilibrado</span>
                            <span>Criativo</span>
                        </div>
                    </div>
                </div>
                 <div className="pt-6 flex justify-end">
                    <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                      <Save size={18} />
                      Salvar Preferências
                    </button>
                </div>
             </div>
          )}

          {activeTab === 'notifications' && (
             <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Preferências de Notificação</h2>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Mail size={16} /> E-mail
                        </h3>
                        <div className="space-y-3">
                             <ToggleItem title="Atualizações de Processos" desc="Receber e-mail quando um processo mudar de status." defaultChecked />
                             <ToggleItem title="Novos Documentos" desc="Receber e-mail quando um documento for compartilhado com meu setor." />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Bell size={16} /> Push (Navegador)
                        </h3>
                        <div className="space-y-3">
                             <ToggleItem title="Alertas em Tempo Real" desc="Exibir pop-ups no canto da tela." defaultChecked />
                             <ToggleItem title="Mensagens do Chat" desc="Notificar novas respostas do assistente." defaultChecked />
                        </div>
                    </div>
                </div>
                <div className="pt-6 flex justify-end">
                    <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                      <Save size={18} />
                      Salvar Preferências
                    </button>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-6 animate-fade-in">
                 <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Segurança da Conta</h2>
                 
                 <div className="space-y-6">
                     <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                         <Shield className="text-amber-600 shrink-0 mt-0.5" size={20} />
                         <div>
                             <h4 className="font-bold text-amber-800 text-sm">Autenticação de Dois Fatores (2FA)</h4>
                             <p className="text-xs text-amber-700 mt-1">Recomendamos ativar o 2FA para maior segurança no acesso aos dados da universidade.</p>
                             <button className="mt-3 text-xs font-bold bg-amber-200 text-amber-800 px-3 py-1.5 rounded hover:bg-amber-300 transition-colors">
                                 Configurar 2FA
                             </button>
                         </div>
                     </div>

                     <div className="space-y-4">
                         <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Key size={16} /> Alterar Senha
                         </h3>
                         <div className="grid grid-cols-1 gap-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Senha Atual</label>
                                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nova Senha</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Confirmar Nova Senha</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                                </div>
                             </div>
                         </div>
                     </div>
                 </div>
                 <div className="pt-6 flex justify-end">
                    <button onClick={handleSave} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm">
                      <Save size={18} />
                      Atualizar Senha
                    </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};