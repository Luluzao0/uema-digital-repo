import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components';
import { colors, spacing, borderRadius, typography } from '../theme';
import { User, UserRole } from '../types';
import { scale, fontScale, getBottomSpace } from '../utils/responsive';

interface SettingsScreenProps {
  user: User;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onLogout }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    biometric: false,
    autoSync: true,
    aiSuggestions: true,
    ragEnabled: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
          onPress: () => Alert.alert('Sucesso', 'Cache limpo com sucesso!') 
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

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle,
    value, 
    onToggle,
    rightElement,
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string;
    value?: boolean;
    onToggle?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      activeOpacity={onToggle ? 0.7 : 1}
      onPress={onToggle}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={scale(20)} color={colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {value !== undefined && onToggle && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary + '50' }}
          thumbColor={value ? colors.primary : '#666'}
        />
      )}
      {rightElement}
    </TouchableOpacity>
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

      {/* Account Settings */}
      <SectionTitle title="Conta" />
      <Card style={styles.settingCard}>
        <SettingRow 
          icon="person-outline" 
          title="Editar Perfil"
          subtitle="Nome, foto e informações"
          rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
        />
        <SettingRow 
          icon="key-outline" 
          title="Alterar Senha"
          subtitle="Segurança da conta"
          rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
        />
        <SettingRow 
          icon="finger-print-outline" 
          title="Biometria"
          subtitle="Login com impressão digital"
          value={settings.biometric}
          onToggle={() => toggleSetting('biometric')}
        />
      </Card>

      {/* Notifications */}
      <SectionTitle title="Notificações" />
      <Card style={styles.settingCard}>
        <SettingRow 
          icon="notifications-outline" 
          title="Notificações Push"
          subtitle="Receber alertas no dispositivo"
          value={settings.notifications}
          onToggle={() => toggleSetting('notifications')}
        />
        <SettingRow 
          icon="mail-outline" 
          title="Email"
          subtitle="Resumos e alertas por email"
          rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
        />
      </Card>

      {/* Appearance */}
      <SectionTitle title="Aparência" />
      <Card style={styles.settingCard}>
        <SettingRow 
          icon="moon-outline" 
          title="Modo Escuro"
          subtitle="Tema escuro ativado"
          value={settings.darkMode}
          onToggle={() => toggleSetting('darkMode')}
        />
        <SettingRow 
          icon="text-outline" 
          title="Tamanho da Fonte"
          subtitle="Padrão"
          rightElement={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
        />
      </Card>

      {/* AI Settings */}
      <SectionTitle title="Inteligência Artificial" />
      <Card style={styles.settingCard}>
        <SettingRow 
          icon="sparkles-outline" 
          title="Sugestões de IA"
          subtitle="Tags e resumos automáticos"
          value={settings.aiSuggestions}
          onToggle={() => toggleSetting('aiSuggestions')}
        />
        <SettingRow 
          icon="search-outline" 
          title="RAG (Busca Semântica)"
          subtitle="Contexto inteligente no chat"
          value={settings.ragEnabled}
          onToggle={() => toggleSetting('ragEnabled')}
        />
        <SettingRow 
          icon="hardware-chip-outline" 
          title="Modelo de IA"
          subtitle="Cohere Command-R+"
          rightElement={
            <View style={styles.modelBadge}>
              <Text style={styles.modelBadgeText}>Ativo</Text>
            </View>
          }
        />
      </Card>

      {/* Data */}
      <SectionTitle title="Dados e Sincronização" />
      <Card style={styles.settingCard}>
        <SettingRow 
          icon="sync-outline" 
          title="Sincronização Automática"
          subtitle="Manter dados atualizados"
          value={settings.autoSync}
          onToggle={() => toggleSetting('autoSync')}
        />
        <SettingRow 
          icon="cloud-download-outline" 
          title="Dados Offline"
          subtitle="12 MB armazenados"
          rightElement={<Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />}
        />
        <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIcon}>
              <Ionicons name="trash-outline" size={scale(20)} color={colors.warning} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Limpar Cache</Text>
              <Text style={styles.settingSubtitle}>Remover dados temporários</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      {/* About */}
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
          rightElement={<Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />}
        />
        <SettingRow 
          icon="shield-checkmark-outline" 
          title="Política de Privacidade"
          rightElement={<Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />}
        />
        <SettingRow 
          icon="help-circle-outline" 
          title="Central de Ajuda"
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
  modelBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    backgroundColor: colors.success + '30',
    borderRadius: scale(4),
  },
  modelBadgeText: {
    fontSize: fontScale(12),
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
});
