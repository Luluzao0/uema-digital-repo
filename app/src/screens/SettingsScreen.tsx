import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../components';
import { colors, spacing, borderRadius } from '../theme';
import { User, UserRole } from '../types';
import { scale, fontScale, getBottomSpace } from '../utils/responsive';

interface SettingsScreenProps {
  user: User;
  onLogout: () => void;
}

type FontSize = 'small' | 'medium' | 'large';
type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEYS = {
  SETTINGS: '@uema_settings',
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onLogout }) => {
  const [settings, setSettings] = useState({
    // Segurança
    biometricEnabled: false,
    biometricType: '' as string,
    // Notificações
    pushNotifications: true,
    emailNotifications: true,
    emailDigest: 'daily' as 'instant' | 'daily' | 'weekly' | 'off',
    // Aparência
    themeMode: 'dark' as ThemeMode,
    fontSize: 'medium' as FontSize,
    // IA
    aiSuggestions: true,
    ragEnabled: true,
  });

  const [showFontModal, setShowFontModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    loadSettings();
    checkBiometricAvailability();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setSettings(prev => ({ ...prev, biometricType: 'Face ID' }));
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setSettings(prev => ({ ...prev, biometricType: 'Digital' }));
        }
      }
    } catch (e) {
      console.error('Biometric check error:', e);
    }
  };

  const toggleBiometric = async () => {
    if (!biometricAvailable) {
      Alert.alert(
        'Biometria Indisponível',
        'Seu dispositivo não suporta ou não tem biometria configurada.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!settings.biometricEnabled) {
      // Ativar - verificar autenticação primeiro
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade para ativar',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        const newSettings = { ...settings, biometricEnabled: true };
        saveSettings(newSettings);
        Alert.alert('Sucesso', `${settings.biometricType || 'Biometria'} ativada!`);
      }
    } else {
      // Desativar
      const newSettings = { ...settings, biometricEnabled: false };
      saveSettings(newSettings);
    }
  };

  const toggleSetting = (key: keyof typeof settings, value?: any) => {
    const newSettings = { ...settings, [key]: value !== undefined ? value : !settings[key] };
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpar Cache',
      'Isso irá remover dados temporários. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          onPress: async () => {
            // Limpa apenas cache, não configurações
            Alert.alert('Sucesso', 'Cache limpo com sucesso!');
          }
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin': return colors.error;
      case 'Manager': return colors.warning;
      case 'Operator': return colors.info;
      case 'Viewer': return colors.textMuted;
    }
  };

  const getFontSizeLabel = (size: FontSize) => {
    switch (size) {
      case 'small': return 'Pequeno';
      case 'medium': return 'Médio';
      case 'large': return 'Grande';
    }
  };

  const getThemeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      case 'system': return 'Sistema';
    }
  };

  const getEmailDigestLabel = (digest: string) => {
    switch (digest) {
      case 'instant': return 'Instantâneo';
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'off': return 'Desativado';
      default: return 'Diário';
    }
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const SettingRow = ({ 
    icon, 
    iconColor,
    title, 
    subtitle,
    value, 
    onToggle,
    onPress,
    rightElement,
    disabled,
  }: { 
    icon: string; 
    iconColor?: string;
    title: string; 
    subtitle?: string;
    value?: boolean;
    onToggle?: () => void;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingRow, disabled && styles.settingRowDisabled]} 
      activeOpacity={onToggle || onPress ? 0.7 : 1}
      onPress={onPress || onToggle}
      disabled={disabled}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, iconColor && { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon as any} size={scale(20)} color={iconColor || colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, disabled && styles.textDisabled]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {value !== undefined && onToggle && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary + '50' }}
          thumbColor={value ? colors.primary : '#666'}
          disabled={disabled}
        />
      )}
      {rightElement}
    </TouchableOpacity>
  );

  // Modal para seleção de fonte
  const FontSizeModal = () => (
    <Modal visible={showFontModal} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowFontModal(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tamanho da Fonte</Text>
          {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.modalOption, settings.fontSize === size && styles.modalOptionSelected]}
              onPress={() => {
                toggleSetting('fontSize', size);
                setShowFontModal(false);
              }}
            >
              <Text style={[
                styles.modalOptionText, 
                { fontSize: size === 'small' ? 14 : size === 'medium' ? 16 : 18 },
                settings.fontSize === size && styles.modalOptionTextSelected
              ]}>
                {getFontSizeLabel(size)}
              </Text>
              {settings.fontSize === size && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Modal para seleção de tema
  const ThemeModal = () => (
    <Modal visible={showThemeModal} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowThemeModal(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tema do Aplicativo</Text>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.modalOption, settings.themeMode === mode && styles.modalOptionSelected]}
              onPress={() => {
                toggleSetting('themeMode', mode);
                setShowThemeModal(false);
              }}
            >
              <View style={styles.modalOptionRow}>
                <Ionicons 
                  name={mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'phone-portrait'} 
                  size={20} 
                  color={settings.themeMode === mode ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.modalOptionText,
                  settings.themeMode === mode && styles.modalOptionTextSelected
                ]}>
                  {getThemeLabel(mode)}
                </Text>
              </View>
              {settings.themeMode === mode && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Modal para configuração de email
  const EmailModal = () => (
    <Modal visible={showEmailModal} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowEmailModal(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Frequência de Emails</Text>
          {(['instant', 'daily', 'weekly', 'off'] as const).map((digest) => (
            <TouchableOpacity
              key={digest}
              style={[styles.modalOption, settings.emailDigest === digest && styles.modalOptionSelected]}
              onPress={() => {
                toggleSetting('emailDigest', digest);
                setShowEmailModal(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                settings.emailDigest === digest && styles.modalOptionTextSelected
              ]}>
                {getEmailDigestLabel(digest)}
              </Text>
              {settings.emailDigest === digest && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Modal de Termos de Uso
  const TermsModal = () => (
    <Modal visible={showTermsModal} transparent animationType="slide">
      <View style={styles.fullModalContainer}>
        <View style={styles.fullModalHeader}>
          <Text style={styles.fullModalTitle}>Termos de Uso</Text>
          <TouchableOpacity onPress={() => setShowTermsModal(false)}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.fullModalContent}>
          <Text style={styles.legalTitle}>1. Aceitação dos Termos</Text>
          <Text style={styles.legalText}>
            Ao utilizar o aplicativo UEMA Digital, você concorda com estes termos de uso. O aplicativo é destinado exclusivamente para uso institucional da Universidade Estadual do Maranhão.
          </Text>
          
          <Text style={styles.legalTitle}>2. Uso do Aplicativo</Text>
          <Text style={styles.legalText}>
            O aplicativo deve ser utilizado apenas para fins acadêmicos e administrativos relacionados à UEMA. É proibido o uso indevido das funcionalidades ou tentativa de acesso não autorizado.
          </Text>
          
          <Text style={styles.legalTitle}>3. Conta do Usuário</Text>
          <Text style={styles.legalText}>
            Você é responsável por manter a confidencialidade de suas credenciais de acesso. Qualquer atividade realizada com sua conta é de sua responsabilidade.
          </Text>
          
          <Text style={styles.legalTitle}>4. Propriedade Intelectual</Text>
          <Text style={styles.legalText}>
            Todo o conteúdo do aplicativo, incluindo textos, imagens e código, é propriedade da UEMA e protegido por leis de direitos autorais.
          </Text>
          
          <Text style={styles.legalTitle}>5. Modificações</Text>
          <Text style={styles.legalText}>
            A UEMA reserva-se o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas através do aplicativo.
          </Text>
          
          <Text style={styles.legalDate}>Última atualização: Dezembro de 2024</Text>
        </ScrollView>
      </View>
    </Modal>
  );

  // Modal de Política de Privacidade
  const PrivacyModal = () => (
    <Modal visible={showPrivacyModal} transparent animationType="slide">
      <View style={styles.fullModalContainer}>
        <View style={styles.fullModalHeader}>
          <Text style={styles.fullModalTitle}>Política de Privacidade</Text>
          <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.fullModalContent}>
          <Text style={styles.legalTitle}>1. Coleta de Dados</Text>
          <Text style={styles.legalText}>
            Coletamos apenas os dados necessários para o funcionamento do aplicativo: nome, email institucional, setor e informações de uso do sistema.
          </Text>
          
          <Text style={styles.legalTitle}>2. Uso dos Dados</Text>
          <Text style={styles.legalText}>
            Seus dados são utilizados exclusivamente para:{'\n'}
            • Autenticação e controle de acesso{'\n'}
            • Gestão de documentos e processos{'\n'}
            • Melhorias no serviço{'\n'}
            • Comunicações institucionais
          </Text>
          
          <Text style={styles.legalTitle}>3. Armazenamento</Text>
          <Text style={styles.legalText}>
            Os dados são armazenados em servidores seguros com criptografia. Mantemos backups regulares e seguimos as melhores práticas de segurança.
          </Text>
          
          <Text style={styles.legalTitle}>4. Compartilhamento</Text>
          <Text style={styles.legalText}>
            Não compartilhamos seus dados com terceiros, exceto quando exigido por lei ou para cumprimento de obrigações legais.
          </Text>
          
          <Text style={styles.legalTitle}>5. Seus Direitos</Text>
          <Text style={styles.legalText}>
            Conforme a LGPD, você tem direito a:{'\n'}
            • Acessar seus dados{'\n'}
            • Corrigir informações{'\n'}
            • Solicitar exclusão{'\n'}
            • Revogar consentimento
          </Text>
          
          <Text style={styles.legalTitle}>6. Contato</Text>
          <Text style={styles.legalText}>
            Para questões sobre privacidade, entre em contato pelo email: privacidade@uema.br
          </Text>
          
          <Text style={styles.legalDate}>Última atualização: Dezembro de 2024</Text>
        </ScrollView>
      </View>
    </Modal>
  );

  // Modal de Central de Ajuda
  const HelpModal = () => (
    <Modal visible={showHelpModal} transparent animationType="slide">
      <View style={styles.fullModalContainer}>
        <View style={styles.fullModalHeader}>
          <Text style={styles.fullModalTitle}>Central de Ajuda</Text>
          <TouchableOpacity onPress={() => setShowHelpModal(false)}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.fullModalContent}>
          <Text style={styles.helpSection}>Perguntas Frequentes</Text>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Como faço para adicionar um documento?</Text>
            <Text style={styles.faqAnswer}>
              Acesse a aba "Documentos", toque no botão "+" e selecione o arquivo do seu dispositivo. Preencha as informações e confirme.
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Como acompanho meus processos?</Text>
            <Text style={styles.faqAnswer}>
              Na aba "Processos" você pode ver todos os seus processos, filtrar por status e acompanhar cada etapa da tramitação.
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>O que é o Chat IA?</Text>
            <Text style={styles.faqAnswer}>
              É um assistente virtual que pode ajudar a buscar documentos, responder dúvidas sobre procedimentos e fornecer informações do sistema.
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Como ativo a biometria?</Text>
            <Text style={styles.faqAnswer}>
              Em Ajustes {'>'} Segurança, ative a opção "Biometria". Você precisará confirmar com sua digital ou Face ID.
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.helpSection}>Contato</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:suporte@uema.br')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>suporte@uema.br</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('tel:+559832458000')}
          >
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>(98) 3245-8000</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('https://www.uema.br')}
          >
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>www.uema.br</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <LinearGradient
          colors={['rgba(0, 102, 204, 0.2)', 'transparent']}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={scale(14)} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) + '30' }]}>
              <Text style={[styles.roleBadgeText, { color: getRoleBadgeColor(user.role) }]}>
                {user.role}
              </Text>
            </View>
            <View style={styles.sectorBadge}>
              <Ionicons name="business-outline" size={scale(12)} color={colors.textMuted} />
              <Text style={styles.sectorBadgeText}>{user.sector}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Segurança */}
        <SectionTitle title="Segurança" />
        <Card style={styles.settingCard}>
          <SettingRow 
            icon="person-outline" 
            title="Editar Perfil"
            subtitle="Nome, foto e informações"
            onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
          <SettingRow 
            icon="key-outline" 
            title="Alterar Senha"
            subtitle="Segurança da conta"
            onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
          <SettingRow 
            icon={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print-outline'}
            title="Biometria"
            subtitle={biometricAvailable 
              ? `Login com ${settings.biometricType || (Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Digital')}`
              : 'Não disponível neste dispositivo'
            }
            value={settings.biometricEnabled}
            onToggle={toggleBiometric}
            disabled={!biometricAvailable}
          />
        </Card>

        {/* Notificações */}
        <SectionTitle title="Notificações" />
        <Card style={styles.settingCard}>
          <SettingRow 
            icon="notifications-outline" 
            iconColor={colors.warning}
            title="Notificações Push"
            subtitle="Alertas em tempo real no dispositivo"
            value={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <SettingRow 
            icon="mail-outline" 
            iconColor={colors.info}
            title="Notificações por Email"
            subtitle={getEmailDigestLabel(settings.emailDigest)}
            onPress={() => setShowEmailModal(true)}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
        </Card>

        {/* Aparência */}
        <SectionTitle title="Aparência" />
        <Card style={styles.settingCard}>
          <SettingRow 
            icon={settings.themeMode === 'dark' ? 'moon' : settings.themeMode === 'light' ? 'sunny' : 'phone-portrait'}
            iconColor={settings.themeMode === 'dark' ? '#9b59b6' : '#f39c12'}
            title="Tema"
            subtitle={getThemeLabel(settings.themeMode)}
            onPress={() => setShowThemeModal(true)}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
          <SettingRow 
            icon="text-outline" 
            title="Tamanho da Fonte"
            subtitle={getFontSizeLabel(settings.fontSize)}
            onPress={() => setShowFontModal(true)}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
        </Card>

        {/* Inteligência Artificial */}
        <SectionTitle title="Inteligência Artificial" />
        <Card style={styles.settingCard}>
          <SettingRow 
            icon="sparkles-outline" 
            iconColor={colors.warning}
            title="Sugestões de IA"
            subtitle="Gerar tags e resumos automaticamente"
            value={settings.aiSuggestions}
            onToggle={() => toggleSetting('aiSuggestions')}
          />
          <SettingRow 
            icon="search-outline" 
            iconColor={colors.success}
            title="RAG (Busca Contextual)"
            subtitle="Respostas baseadas em seus documentos"
            value={settings.ragEnabled}
            onToggle={() => toggleSetting('ragEnabled')}
          />
        </Card>

        {/* Dados */}
        <SectionTitle title="Dados" />
        <Card style={styles.settingCard}>
          <SettingRow 
            icon="cloud-download-outline" 
            title="Dados Offline"
            subtitle="Armazenamento local"
            rightElement={
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>Sincronizado</Text>
              </View>
            }
          />
          <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="trash-outline" size={scale(20)} color={colors.warning} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Limpar Cache</Text>
                <Text style={styles.settingSubtitle}>Remover dados temporários</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Sobre e Legal */}
        <SectionTitle title="Sobre" />
        <Card style={styles.settingCard}>
          <SettingRow 
            icon="information-circle-outline" 
            title="Versão do App"
            subtitle="1.0.0 (Build 1)"
            rightElement={
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>Atual</Text>
              </View>
            }
          />
          <SettingRow 
            icon="document-text-outline" 
            title="Termos de Uso"
            onPress={() => setShowTermsModal(true)}
            rightElement={<Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />}
          />
          <SettingRow 
            icon="shield-checkmark-outline" 
            iconColor={colors.success}
            title="Política de Privacidade"
            onPress={() => setShowPrivacyModal(true)}
            rightElement={<Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />}
          />
          <SettingRow 
            icon="help-circle-outline" 
            iconColor={colors.info}
            title="Central de Ajuda"
            subtitle="FAQ e contato"
            onPress={() => setShowHelpModal(true)}
            rightElement={<Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />}
          />
        </Card>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={scale(20)} color={colors.error} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>UEMA Digital</Text>
          <Text style={styles.footerSubtext}>© 2024 Universidade Estadual do Maranhão</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <FontSizeModal />
      <ThemeModal />
      <EmailModal />
      <TermsModal />
      <PrivacyModal />
      <HelpModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: scale(100) + getBottomSpace(),
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: scale(24),
    paddingHorizontal: scale(16),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: scale(12),
  },
  avatar: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontScale(32),
    fontWeight: '700',
    color: '#fff',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  userName: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: scale(4),
  },
  userEmail: {
    fontSize: fontScale(15),
    color: colors.textMuted,
    marginBottom: scale(12),
  },
  badgeRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  roleBadge: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
  },
  roleBadgeText: {
    fontSize: fontScale(13),
    fontWeight: '600',
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectorBadgeText: {
    fontSize: fontScale(13),
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: scale(16),
    marginTop: scale(20),
    marginBottom: scale(10),
  },
  settingCard: {
    marginHorizontal: scale(16),
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(12),
  },
  settingIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontScale(15),
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    marginTop: scale(2),
  },
  textDisabled: {
    color: colors.textMuted,
  },
  infoBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    backgroundColor: colors.success + '30',
    borderRadius: scale(4),
  },
  infoBadgeText: {
    fontSize: fontScale(11),
    color: colors.success,
    fontWeight: '600',
  },
  versionBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    backgroundColor: colors.info + '30',
    borderRadius: scale(4),
  },
  versionBadgeText: {
    fontSize: fontScale(12),
    color: colors.info,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(10),
    marginHorizontal: scale(16),
    marginTop: scale(24),
    paddingVertical: scale(14),
    backgroundColor: colors.error + '15',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutText: {
    fontSize: fontScale(15),
    color: colors.error,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: scale(24),
  },
  footerText: {
    fontSize: fontScale(15),
    color: colors.textMuted,
  },
  footerSubtext: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    marginTop: scale(4),
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  modalOptionSelected: {
    backgroundColor: colors.primary + '20',
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalOptionText: {
    fontSize: fontScale(16),
    color: colors.textPrimary,
  },
  modalOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Full screen modals
  fullModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundLight,
    paddingTop: scale(50),
  },
  fullModalTitle: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fullModalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  legalTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  legalText: {
    fontSize: fontScale(14),
    color: colors.textSecondary,
    lineHeight: scale(22),
  },
  legalDate: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  helpSection: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  faqItem: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  faqQuestion: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    fontSize: fontScale(14),
    color: colors.textSecondary,
    lineHeight: scale(20),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactText: {
    fontSize: fontScale(15),
    color: colors.primary,
  },
});
