import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Lock, Cpu, Save, Camera, Loader2, X, Shield, Sparkles, Check } from 'lucide-react';
import { CURRENT_USER } from '../../constants';
import { showToast } from '../../App';
import { storage } from '../../services/storage';

// Toggle Switch animado
const AnimatedToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => {
  return (
    <motion.button
      onClick={() => onChange(!checked)}
      className={`relative w-14 h-8 rounded-full transition-colors ${
        checked ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'
      }`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
        animate={{ left: checked ? '30px' : '4px' }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
};

// Item de configuração com toggle
const SettingToggleItem: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ title, description, checked, onChange }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-colors"
    >
      <div className="flex-1">
        <h4 className="text-white font-medium">{title}</h4>
        <p className="text-sm text-white/50">{description}</p>
      </div>
      <AnimatedToggle checked={checked} onChange={onChange} />
    </motion.div>
  );
};

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'ai' | 'security'>('profile');
  const [avatarUrl, setAvatarUrl] = useState(CURRENT_USER.avatarUrl);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    name: CURRENT_USER.name,
    role: 'Gerente Administrativo'
  });

  const [notifications, setNotifications] = useState({
    emailProcessos: true,
    emailDocumentos: false,
    pushBrowser: true,
    resumoDiario: true
  });

  const [aiConfig, setAiConfig] = useState({
    enableSuggestions: true,
    autoTagging: true,
    autoSummary: false,
    model: 'command-r7b-12-2024'
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30'
  });

  useEffect(() => {
    const loadSettings = async () => {
      await storage.init();
      const savedSettings = await storage.getSettings();
      if (savedSettings) {
        if (savedSettings.avatarUrl) setAvatarUrl(savedSettings.avatarUrl);
        if (savedSettings.profileData) setProfileData(savedSettings.profileData);
        if (savedSettings.notifications) setNotifications(savedSettings.notifications);
        if (savedSettings.aiConfig) setAiConfig(savedSettings.aiConfig);
        if (savedSettings.security) setSecurity(savedSettings.security);
      }
    };
    loadSettings();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione uma imagem.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 2MB.', 'error');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxSize = 200;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setAvatarUrl(resizedBase64);
          
          const currentSettings = await storage.getSettings() || {};
          await storage.saveSettings({ ...currentSettings, avatarUrl: resizedBase64 });
          
          setIsUploadingPhoto(false);
          showToast('Foto atualizada com sucesso!', 'success');
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingPhoto(false);
      showToast('Erro ao fazer upload da foto.', 'error');
    }
  };

  const handleRemovePhoto = async () => {
    setAvatarUrl(CURRENT_USER.avatarUrl);
    const currentSettings = await storage.getSettings() || {};
    await storage.saveSettings({ ...currentSettings, avatarUrl: null });
    showToast('Foto removida.', 'info');
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User, gradient: 'from-purple-500 to-pink-500' },
    { id: 'notifications', label: 'Notificações', icon: Bell, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'ai', label: 'Inteligência Artificial', icon: Sparkles, gradient: 'from-orange-500 to-yellow-500' },
    { id: 'security', label: 'Segurança', icon: Shield, gradient: 'from-green-500 to-emerald-500' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    const currentSettings = await storage.getSettings() || {};
    await storage.saveSettings({
      ...currentSettings,
      profileData,
      notifications,
      aiConfig,
      security
    });
    setTimeout(() => {
      setIsSaving(false);
      showToast('Configurações salvas com sucesso!', 'success');
    }, 500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-white/60">Gerencie suas preferências e configurações da conta</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-72 space-y-2"
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` 
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                  <Icon size={20} />
                </div>
                <span className="font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto"
                  >
                    <Check size={18} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 min-h-[500px]"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Dados Pessoais</h2>
                
                {/* Avatar Section */}
                <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="relative group">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative"
                    >
                      <img 
                        src={avatarUrl} 
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20" 
                      />
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                          <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                      )}
                    </motion.div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                    >
                      <Camera size={16} /> Alterar Foto
                    </motion.button>
                    {avatarUrl !== CURRENT_USER.avatarUrl && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRemovePhoto}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm"
                      >
                        <X size={16} /> Remover
                      </motion.button>
                    )}
                    <p className="text-xs text-white/40">JPG, PNG. Máximo 2MB.</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/60 font-medium">Nome Completo</label>
                    <input 
                      type="text" 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-white/60 font-medium">Email</label>
                    <input 
                      type="email" 
                      value={CURRENT_USER.email} 
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-white/60 font-medium">Cargo</label>
                    <input 
                      type="text" 
                      value={profileData.role} 
                      onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-medium disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Salvar Alterações
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Preferências de Notificação</h2>
                
                <div className="space-y-3">
                  <SettingToggleItem
                    title="Email - Novos Processos"
                    description="Receber email quando um processo for atribuído"
                    checked={notifications.emailProcessos}
                    onChange={(checked) => setNotifications({...notifications, emailProcessos: checked})}
                  />
                  
                  <SettingToggleItem
                    title="Email - Novos Documentos"
                    description="Receber email quando documentos forem publicados"
                    checked={notifications.emailDocumentos}
                    onChange={(checked) => setNotifications({...notifications, emailDocumentos: checked})}
                  />
                  
                  <SettingToggleItem
                    title="Notificações Push"
                    description="Receber notificações no navegador"
                    checked={notifications.pushBrowser}
                    onChange={(checked) => setNotifications({...notifications, pushBrowser: checked})}
                  />
                  
                  <SettingToggleItem
                    title="Resumo Diário"
                    description="Receber um resumo diário das atividades"
                    checked={notifications.resumoDiario}
                    onChange={(checked) => setNotifications({...notifications, resumoDiario: checked})}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-medium disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Salvar Preferências
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Configurações de IA</h2>
                
                {/* Info Banner */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-orange-400" size={20} />
                    <p className="text-sm text-white/80">
                      Configure como a IA auxiliará no processamento de documentos e no assistente virtual.
                    </p>
                  </div>
                </motion.div>

                <div className="space-y-3">
                  <SettingToggleItem
                    title="Sugestões Inteligentes"
                    description="Receber sugestões baseadas no contexto"
                    checked={aiConfig.enableSuggestions}
                    onChange={(checked) => setAiConfig({...aiConfig, enableSuggestions: checked})}
                  />
                  
                  <SettingToggleItem
                    title="Etiquetagem Automática"
                    description="Gerar tags automaticamente ao fazer upload"
                    checked={aiConfig.autoTagging}
                    onChange={(checked) => setAiConfig({...aiConfig, autoTagging: checked})}
                  />
                  
                  <SettingToggleItem
                    title="Resumo Automático"
                    description="Gerar resumo de documentos automaticamente"
                    checked={aiConfig.autoSummary}
                    onChange={(checked) => setAiConfig({...aiConfig, autoSummary: checked})}
                  />

                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <label className="text-white font-medium block mb-3">Modelo de IA</label>
                    <select 
                      value={aiConfig.model}
                      onChange={e => setAiConfig({...aiConfig, model: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 cursor-pointer"
                    >
                      <option value="command-r7b-12-2024" className="bg-[#1a1a2e]">Cohere Command R7B (Econômico)</option>
                      <option value="command-r" className="bg-[#1a1a2e]">Cohere Command R (Avançado)</option>
                      <option value="command-r-plus" className="bg-[#1a1a2e]">Cohere Command R+ (Premium)</option>
                    </select>
                    <p className="text-xs text-white/40 mt-2">Modelo utilizado para chat e geração de conteúdo</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl text-white font-medium disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Salvar Configurações
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Segurança da Conta</h2>
                
                <div className="space-y-3">
                  <SettingToggleItem
                    title="Autenticação em Dois Fatores"
                    description="Adicionar camada extra de segurança ao login"
                    checked={security.twoFactor}
                    onChange={(checked) => setSecurity({...security, twoFactor: checked})}
                  />

                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <label className="text-white font-medium block mb-3">Tempo de Sessão</label>
                    <select 
                      value={security.sessionTimeout}
                      onChange={e => setSecurity({...security, sessionTimeout: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50 cursor-pointer"
                    >
                      <option value="15" className="bg-[#1a1a2e]">15 minutos</option>
                      <option value="30" className="bg-[#1a1a2e]">30 minutos</option>
                      <option value="60" className="bg-[#1a1a2e]">1 hora</option>
                      <option value="120" className="bg-[#1a1a2e]">2 horas</option>
                    </select>
                    <p className="text-xs text-white/40 mt-2">Desconectar automaticamente após inatividade</p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <label className="text-white font-medium block mb-3">Alterar Senha</label>
                    <div className="space-y-3">
                      <input 
                        type="password" 
                        placeholder="Senha atual"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                      />
                      <input 
                        type="password" 
                        placeholder="Nova senha"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                      />
                      <input 
                        type="password" 
                        placeholder="Confirmar nova senha"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                    Atualizar Segurança
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};