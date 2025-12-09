import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { storage } from '../services/storage';
import { Document, Process, User } from '../types';
import { 
  scale, 
  fontScale, 
  wp, 
  hp, 
  screenWidth,
  getColumnWidth,
  getBottomSpace,
  isSmallDevice,
  isTablet,
} from '../utils/responsive';

interface DashboardScreenProps {
  user: User;
  onNavigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onNavigate }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    await storage.init();
    const [docs, procs] = await Promise.all([
      storage.getDocuments(),
      storage.getProcesses(),
    ]);
    setDocuments(docs);
    setProcesses(procs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const stats = [
    { 
      label: 'Documentos', 
      value: documents.length, 
      icon: 'document-text',
      gradient: ['#3c8dbc', '#2a6f94'],
      onPress: () => onNavigate('Documents'),
    },
    { 
      label: 'Processos', 
      value: processes.length, 
      icon: 'git-branch',
      gradient: ['#00a65a', '#008d4c'],
      onPress: () => onNavigate('Processes'),
    },
    { 
      label: 'Pendentes', 
      value: processes.filter(p => p.status === 'Pending').length, 
      icon: 'time',
      gradient: ['#f39c12', '#d68910'],
      onPress: () => onNavigate('Processes'),
    },
    { 
      label: 'Aprovados', 
      value: processes.filter(p => p.status === 'Approved').length, 
      icon: 'checkmark-circle',
      gradient: ['#00c0ef', '#00a0c0'],
      onPress: () => onNavigate('Processes'),
    },
  ];

  const recentDocs = documents.slice(0, 3);
  const recentProcesses = processes.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return colors.success;
      case 'In Progress': return colors.info;
      case 'Pending': return colors.warning;
      case 'Rejected': return colors.error;
      default: return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user.name.split(' ')[0]}!</Text>
        <Text style={styles.subGreeting}>Bem-vindo ao UEMA Digital</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={stat.label}
            style={styles.statCard}
            onPress={stat.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={stat.gradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statGradient}
            >
              <Ionicons name={stat.icon as any} size={scale(28)} color="#fff" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Documents */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Documentos Recentes</Text>
          <TouchableOpacity onPress={() => onNavigate('Documents')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {recentDocs.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum documento encontrado</Text>
          </Card>
        ) : (
          recentDocs.map((doc) => (
            <Card key={doc.id} style={styles.listCard}>
              <View style={styles.listItem}>
                <View style={[styles.docIcon, { 
                  backgroundColor: doc.type === 'PDF' ? colors.error + '20' : 
                                   doc.type === 'XLSX' ? colors.success + '20' : 
                                   colors.primary + '20' 
                }]}>
                  <Ionicons 
                    name={doc.type === 'PDF' ? 'document' : doc.type === 'XLSX' ? 'grid' : 'document-text'} 
                    size={scale(20)} 
                    color={doc.type === 'PDF' ? colors.error : doc.type === 'XLSX' ? colors.success : colors.primary} 
                  />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>{doc.title}</Text>
                  <Text style={styles.listSubtitle}>{doc.sector} • {doc.createdAt}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>{doc.status}</Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Recent Processes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Processos Recentes</Text>
          <TouchableOpacity onPress={() => onNavigate('Processes')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {recentProcesses.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum processo encontrado</Text>
          </Card>
        ) : (
          recentProcesses.map((proc) => (
            <Card key={proc.id} style={styles.listCard}>
              <View style={styles.listItem}>
                <View style={[styles.docIcon, { backgroundColor: getStatusColor(proc.status) + '20' }]}>
                  <Ionicons name="git-branch" size={scale(20)} color={getStatusColor(proc.status)} />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>{proc.title}</Text>
                  <Text style={styles.listSubtitle}>{proc.number} • {proc.currentStep}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(proc.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(proc.status) }]}>
                    {proc.status === 'In Progress' ? 'Em Prog.' : proc.status}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('Documents')}>
            <Ionicons name="add-circle" size={scale(24)} color={colors.primary} />
            <Text style={styles.actionText}>Novo Doc</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('Processes')}>
            <Ionicons name="git-branch" size={scale(24)} color={colors.success} />
            <Text style={styles.actionText}>Processo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('Chat')}>
            <Ionicons name="chatbubbles" size={scale(24)} color={colors.info} />
            <Text style={styles.actionText}>Suporte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('Reports')}>
            <Ionicons name="bar-chart" size={scale(24)} color={colors.warning} />
            <Text style={styles.actionText}>Relatórios</Text>
          </TouchableOpacity>
        </View>
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
    padding: spacing.md,
    paddingBottom: scale(100) + getBottomSpace(),
  },
  header: {
    marginBottom: scale(24),
  },
  greeting: {
    fontSize: fontScale(24),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: fontScale(16),
    color: colors.textMuted,
    marginTop: scale(4),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginBottom: scale(24),
  },
  statCard: {
    width: getColumnWidth(2, 8),
    minWidth: scale(150),
  },
  statGradient: {
    padding: scale(16),
    borderRadius: scale(16),
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontScale(28),
    fontWeight: '700',
    color: '#fff',
    marginTop: scale(8),
  },
  statLabel: {
    fontSize: fontScale(14),
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginBottom: scale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  sectionTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: fontScale(14),
    color: colors.primary,
  },
  listCard: {
    marginBottom: scale(8),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
  },
  docIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: fontScale(16),
    color: colors.textPrimary,
    fontWeight: '600',
  },
  listSubtitle: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    marginTop: scale(2),
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  statusText: {
    fontSize: fontScale(11),
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontScale(16),
    color: colors.textMuted,
    textAlign: 'center',
    padding: scale(24),
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(8),
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: 'center',
    width: getColumnWidth(4, 8),
    minWidth: scale(70),
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: fontScale(12),
    color: colors.textSecondary,
    marginTop: scale(4),
  },
});
