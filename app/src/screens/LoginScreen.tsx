import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '../components';
import { colors, spacing, borderRadius, typography } from '../theme';
import { 
  scale, 
  moderateScale, 
  fontScale, 
  wp, 
  hp, 
  screenWidth,
  getBottomSpace,
  isSmallDevice,
  getColumnWidth,
} from '../utils/responsive';
import { authService, isSupabaseConfigured } from '../services/supabase';
import { storage } from '../services/storage';
import { SectorType, User } from '../types';

// Demo users
const DEMO_USERS = {
  'admin@uema.br': {
    id: 'u1',
    name: 'Luis Guilherme',
    email: 'admin@uema.br',
    role: 'Admin' as const,
    sector: SectorType.PROGEP,
    avatarUrl: 'https://picsum.photos/id/1/200/200',
  },
  'gestor@uema.br': {
    id: 'u2',
    name: 'Maria Santos',
    email: 'gestor@uema.br',
    role: 'Manager' as const,
    sector: SectorType.PROPLAD,
    avatarUrl: 'https://picsum.photos/id/64/200/200',
  },
  'usuario@uema.br': {
    id: 'u3',
    name: 'João Silva',
    email: 'usuario@uema.br',
    role: 'Operator' as const,
    sector: SectorType.PROTOCOLO,
    avatarUrl: 'https://picsum.photos/id/91/200/200',
  },
  'visitante@uema.br': {
    id: 'u4',
    name: 'Ana Costa',
    email: 'visitante@uema.br',
    role: 'Viewer' as const,
    sector: SectorType.PROG,
    avatarUrl: 'https://picsum.photos/id/177/200/200',
  },
};

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Tentar login no Supabase
      if (isSupabaseConfigured()) {
        const result = await authService.signIn(email, password);
        if (result.success && result.user) {
          await storage.setAuthenticated(true);
          await storage.saveUser(result.user as User);
          onLogin(result.user as User);
          return;
        }
      }

      // Modo demo
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
      
      if (demoUser) {
        await storage.setAuthenticated(true);
        await storage.saveUser(demoUser);
        onLogin(demoUser);
      } else {
        // Criar usuário genérico
        const user: User = {
          id: `user_${Date.now()}`,
          name: email.split('@')[0].replace('.', ' '),
          email,
          role: 'Operator',
          sector: SectorType.PROGEP,
          avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
        };
        await storage.setAuthenticated(true);
        await storage.saveUser(user);
        onLogin(user);
      }
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo123');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.backgroundDark, colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>UEMA</Text>
            <Text style={styles.logoSubtext}>Digital</Text>
          </View>

          <Text style={styles.subtitle}>Repositório Digital Universitário</Text>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              icon="mail-outline"
              placeholder="Email institucional"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <Input
                icon="lock-closed-outline"
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <Button
              title={isLoading ? 'Entrando...' : 'Entrar'}
              onPress={handleLogin}
              loading={isLoading}
              style={{ marginTop: spacing.md }}
            />
          </View>

          {/* Demo Users */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Acesso rápido (Demo)</Text>
            <View style={styles.demoGrid}>
              {Object.entries(DEMO_USERS).map(([userEmail, user]) => (
                <TouchableOpacity
                  key={userEmail}
                  style={styles.demoCard}
                  onPress={() => selectDemoUser(userEmail)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={styles.demoAvatar}
                  />
                  <Text style={styles.demoName} numberOfLines={1}>{user.name}</Text>
                  <View style={[
                    styles.roleBadge,
                    { backgroundColor: 
                      user.role === 'Admin' ? colors.error + '30' :
                      user.role === 'Manager' ? colors.info + '30' :
                      user.role === 'Operator' ? colors.success + '30' :
                      colors.warning + '30'
                    }
                  ]}>
                    <Text style={[
                      styles.roleText,
                      { color: 
                        user.role === 'Admin' ? colors.error :
                        user.role === 'Manager' ? colors.info :
                        user.role === 'Operator' ? colors.success :
                        colors.warning
                      }
                    ]}>{user.role}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.footer}>© 2025 UEMA Digital</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingTop: hp(8),
    paddingBottom: scale(24) + getBottomSpace(),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: scale(8),
  },
  logoText: {
    fontSize: fontScale(isSmallDevice ? 32 : 42),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logoSubtext: {
    fontSize: fontScale(isSmallDevice ? 18 : 24),
    fontWeight: '300',
    color: colors.primary,
    marginLeft: scale(8),
  },
  subtitle: {
    fontSize: fontScale(14),
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: scale(32),
  },
  form: {
    gap: scale(16),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    padding: scale(16),
    borderRadius: scale(12),
    gap: scale(8),
  },
  errorText: {
    color: colors.error,
    fontSize: fontScale(14),
    flex: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: scale(16),
  },
  demoSection: {
    marginTop: scale(32),
  },
  demoTitle: {
    fontSize: fontScale(14),
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: scale(16),
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    justifyContent: 'center',
  },
  demoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(12),
    padding: scale(12),
    alignItems: 'center',
    width: getColumnWidth(2, 8),
    minWidth: scale(140),
    maxWidth: scale(180),
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoAvatar: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    marginBottom: scale(4),
  },
  demoName: {
    fontSize: fontScale(14),
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(12),
    marginTop: scale(4),
  },
  roleText: {
    fontSize: fontScale(10),
    fontWeight: '600',
  },
  footer: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: scale(32),
  },
});
