import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components';
import { colors, spacing, borderRadius, typography } from '../theme';
import { storage } from '../services/storage';
import { User, SectorType, hasPermission, ProcessStatus } from '../types';

interface ReportsScreenProps {
  user: User;
}

const { width } = Dimensions.get('window');

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ user }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalProcesses: 0,
    processesCompleted: 0,
    processesInProgress: 0,
    processesPending: 0,
    docsBySector: {} as Record<string, number>,
    processesBySector: {} as Record<string, number>,
    avgProcessTime: 0,
  });

  const canExport = hasPermission(user.role, 'canExportReports');

  const loadStats = async () => {
    await storage.init();
    const docs = await storage.getDocuments();
    const processes = await storage.getProcesses();

    const docsBySector: Record<string, number> = {};
    const processesBySector: Record<string, number> = {};

    Object.values(SectorType).forEach(sector => {
      docsBySector[sector] = 0;
      processesBySector[sector] = 0;
    });

    docs.forEach(doc => {
      if (doc.sector) docsBySector[doc.sector] = (docsBySector[doc.sector] || 0) + 1;
    });

    processes.forEach(proc => {
      if (proc.sector) processesBySector[proc.sector] = (processesBySector[proc.sector] || 0) + 1;
    });

    const completed = processes.filter(p => p.status === ProcessStatus.COMPLETED).length;
    const inProgress = processes.filter(p => p.status === ProcessStatus.IN_PROGRESS).length;
    const pending = processes.filter(p => p.status === ProcessStatus.PENDING).length;

    setStats({
      totalDocs: docs.length,
      totalProcesses: processes.length,
      processesCompleted: completed,
      processesInProgress: inProgress,
      processesPending: pending,
      docsBySector,
      processesBySector,
      avgProcessTime: 5.2,
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const StatCard = ({ 
    icon, 
    label, 
    value, 
    color, 
    trend 
  }: { 
    icon: string; 
    label: string; 
    value: number | string; 
    color: string;
    trend?: { value: number; positive: boolean };
  }) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[styles.statIconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {trend && (
          <View style={styles.trendRow}>
            <Ionicons 
              name={trend.positive ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={trend.positive ? colors.success : colors.error} 
            />
            <Text style={[styles.trendText, { color: trend.positive ? colors.success : colors.error }]}>
              {trend.positive ? '+' : ''}{trend.value}%
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  const BarChart = ({ 
    title, 
    data, 
    color 
  }: { 
    title: string; 
    data: Record<string, number>; 
    color: string 
  }) => {
    const maxValue = Math.max(...Object.values(data), 1);
    
    return (
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chartContainer}>
          {Object.entries(data).map(([key, value]) => (
            <View key={key} style={styles.barRow}>
              <Text style={styles.barLabel}>{key}</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: `${(value / maxValue) * 100}%`,
                      backgroundColor: color,
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const DonutChart = () => {
    const total = stats.processesCompleted + stats.processesInProgress + stats.processesPending;
    if (total === 0) return null;

    const segments = [
      { label: 'Concluídos', value: stats.processesCompleted, color: colors.success },
      { label: 'Em Andamento', value: stats.processesInProgress, color: colors.warning },
      { label: 'Pendentes', value: stats.processesPending, color: colors.info },
    ];

    return (
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Status dos Processos</Text>
        <View style={styles.donutContainer}>
          <View style={styles.donutVisual}>
            {/* Simple visual representation */}
            <View style={styles.donutRing}>
              <Text style={styles.donutCenter}>{total}</Text>
              <Text style={styles.donutCenterLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.donutLegend}>
            {segments.map(seg => (
              <View key={seg.label} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                <Text style={styles.legendLabel}>{seg.label}</Text>
                <Text style={styles.legendValue}>
                  {seg.value} ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['rgba(0, 102, 204, 0.15)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Relatórios</Text>
            <Text style={styles.headerSubtitle}>Análise e métricas do sistema</Text>
          </View>
          {canExport && (
            <View style={styles.exportBadge}>
              <Ionicons name="download-outline" size={16} color={colors.primary} />
              <Text style={styles.exportText}>Exportar</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Overview Stats */}
      <Text style={styles.sectionTitle}>Visão Geral</Text>
      <View style={styles.statsGrid}>
        <StatCard 
          icon="document" 
          label="Total Documentos" 
          value={stats.totalDocs}
          color={colors.primary}
          trend={{ value: 12, positive: true }}
        />
        <StatCard 
          icon="git-network" 
          label="Total Processos" 
          value={stats.totalProcesses}
          color={colors.info}
          trend={{ value: 8, positive: true }}
        />
        <StatCard 
          icon="checkmark-circle" 
          label="Processos Concluídos" 
          value={stats.processesCompleted}
          color={colors.success}
        />
        <StatCard 
          icon="time" 
          label="Tempo Médio (dias)" 
          value={stats.avgProcessTime}
          color={colors.warning}
        />
      </View>

      {/* Process Status Chart */}
      <DonutChart />

      {/* Documents by Sector */}
      <BarChart 
        title="Documentos por Setor"
        data={stats.docsBySector}
        color={colors.primary}
      />

      {/* Processes by Sector */}
      <BarChart 
        title="Processos por Setor"
        data={stats.processesBySector}
        color={colors.info}
      />

      {/* Performance Metrics */}
      <Card style={styles.metricsCard}>
        <Text style={styles.chartTitle}>Métricas de Desempenho</Text>
        
        <View style={styles.metricRow}>
          <View style={styles.metricLeft}>
            <Ionicons name="speedometer-outline" size={20} color={colors.success} />
            <View>
              <Text style={styles.metricLabel}>Taxa de Conclusão</Text>
              <Text style={styles.metricValue}>
                {stats.totalProcesses > 0 
                  ? Math.round((stats.processesCompleted / stats.totalProcesses) * 100) 
                  : 0}%
              </Text>
            </View>
          </View>
          <View style={styles.progressMini}>
            <View 
              style={[
                styles.progressMiniFill, 
                { 
                  width: `${stats.totalProcesses > 0 
                    ? (stats.processesCompleted / stats.totalProcesses) * 100 
                    : 0}%` 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricLeft}>
            <Ionicons name="flash-outline" size={20} color={colors.warning} />
            <View>
              <Text style={styles.metricLabel}>Produtividade</Text>
              <Text style={styles.metricValue}>85%</Text>
            </View>
          </View>
          <View style={styles.progressMini}>
            <View style={[styles.progressMiniFill, { width: '85%', backgroundColor: colors.warning }]} />
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricLeft}>
            <Ionicons name="analytics-outline" size={20} color={colors.info} />
            <View>
              <Text style={styles.metricLabel}>Eficiência RAG</Text>
              <Text style={styles.metricValue}>92%</Text>
            </View>
          </View>
          <View style={styles.progressMini}>
            <View style={[styles.progressMiniFill, { width: '92%', backgroundColor: colors.info }]} />
          </View>
        </View>
      </Card>

      {/* Spacer for bottom nav */}
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  headerGradient: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  exportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.md,
  },
  exportText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  statCard: {
    width: (width - spacing.md * 3) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chartCard: {
    margin: spacing.md,
  },
  chartTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  chartContainer: {
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    ...typography.caption,
    color: colors.textMuted,
    width: 80,
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.sm,
    minWidth: 4,
  },
  barValue: {
    ...typography.caption,
    color: colors.textPrimary,
    width: 30,
    textAlign: 'right',
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  donutVisual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 12,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  donutCenter: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  donutCenterLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  donutLegend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...typography.small,
    color: colors.textMuted,
    flex: 1,
  },
  legendValue: {
    ...typography.small,
    color: colors.textPrimary,
  },
  metricsCard: {
    margin: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  metricLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  metricValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  progressMini: {
    width: 100,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressMiniFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
});
