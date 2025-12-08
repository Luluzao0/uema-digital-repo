import React, { useState } from 'react';
import { User, Bell, Lock, Cpu, Save } from 'lucide-react';
import { CURRENT_USER } from '../../constants';
import { showToast } from '../../App';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'ai' | 'security'>('profile');
  
  const [profileData, setProfileData] = useState({
      name: CURRENT_USER.name,
      role: 'Gerente Administrativo'
  });

  const tabs = [
    { id: 'profile', label: 'Dados Pessoais', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'ai', label: 'Configuração IA', icon: Cpu },
    { id: 'security', label: 'Segurança', icon: Lock },
  ];

  const handleSave = () => {
    showToast('Dados atualizados.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 border-b-2 border-gray-300 pb-2">
        <h1 className="text-xl font-bold text-gray-800 uppercase">Configurações do Sistema</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar Tabs - Estilo Lista */}
        <div className="w-full md:w-60 shrink-0 bg-white border border-gray-300 rounded-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2 px-3 py-3 text-sm font-semibold text-left border-l-4 border-b border-gray-100 last:border-b-0
                  ${isActive 
                    ? 'bg-gray-50 border-l-[#3c8dbc] text-[#3c8dbc]' 
                    : 'border-l-transparent text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area - Box */}
        <div className="flex-1 bg-white border border-gray-300 rounded-sm shadow-sm p-6 min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase border-b border-gray-200 pb-2 mb-4">Editar Perfil</h3>
              
              <div className="flex gap-4 items-start mb-6">
                 <img src={CURRENT_USER.avatarUrl} className="w-16 h-16 border border-gray-300 p-1 bg-white" />
                 <button className="text-xs text-blue-600 hover:underline mt-1">Alterar Foto</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-sm text-sm focus:border-blue-400 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Email</label>
                  <input type="email" defaultValue={CURRENT_USER.email} className="w-full p-2 border border-gray-300 bg-gray-100 rounded-sm text-sm" disabled />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Cargo</label>
                  <input 
                    type="text" 
                    value={profileData.role} 
                    onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-sm text-sm focus:border-blue-400 outline-none" 
                   />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 text-right">
                <button onClick={handleSave} className="bg-[#3c8dbc] text-white px-4 py-2 rounded-sm font-bold text-xs hover:bg-[#367fa9]">
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </div>
          )}
          
          {/* Fallback simples para outras abas */}
          {activeTab !== 'profile' && (
              <div className="text-center text-gray-500 py-10">
                  <p className="text-sm">Módulo de configuração não carregado.</p>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};