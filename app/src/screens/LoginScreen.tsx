import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../components';
import { colors, spacing } from '../theme';
import { 
  scale, 
  fontScale, 
  hp, 
  getBottomSpace,
  isSmallDevice,
} from '../utils/responsive';
import { isSupabaseConfigured } from '../services/supabase';
import { storage } from '../services/storage';
import { User } from '../types';

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
      if (!isSupabaseConfigured()) {
        setError('Sistema não configurado. Configure as variáveis de ambiente do Supabase.');
        setIsLoading(false);
        return;
      }

      // Login com Supabase
      const user = await storage.login(email, password);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoText}>
              Use suas credenciais institucionais para acessar o sistema.
            </Text>
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
  forgotPassword: {
    alignSelf: 'center',
    marginTop: scale(8),
  },
  forgotPasswordText: {
    fontSize: fontScale(14),
    color: colors.primary,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: scale(16),
    borderRadius: scale(12),
    marginTop: scale(32),
    gap: scale(12),
  },
  infoText: {
    flex: 1,
    fontSize: fontScale(13),
    color: colors.textMuted,
    lineHeight: fontScale(18),
  },
  footer: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: scale(32),
  },
});
