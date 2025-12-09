import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Input } from '../components';
import { colors, spacing, borderRadius, typography } from '../theme';
import { storage } from '../services/storage';
import { Process, SectorType, User, hasPermission, ProcessStatus } from '../types';

interface ProcessesScreenProps {
  user: User;
}

export const ProcessesScreen: React.FC<ProcessesScreenProps> = ({ user }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProcess, setNewProcess] = useState({
    title: '',
    description: '',
    sector: SectorType.PROGEP,
    priority: 'Medium' as Process['priority'],
  });

  const canCreate = hasPermission(user.role, 'canCreateProcess');
  const canAdvance = hasPermission(user.role, 'canAdvanceProcess');

  const loadProcesses = async () => {
    await storage.init();
    const procs = await storage.getProcesses();
    setProcesses(procs);
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProcesses();
    setRefreshing(false);
  };

  const filteredProcesses = processes.filter(proc => {
    const matchSearch = proc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       proc.number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || proc.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAddProcess = async () => {
    if (!newProcess.title.trim()) {
      Alert.alert('Erro', 'Digite um título para o processo');
      return;
    }

    const proc: Process = {
      id: `proc_${Date.now()}`,
      number: `${new Date().getFullYear()}.${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      title: newProcess.title,
      description: newProcess.description,
      status: ProcessStatus.IN_PROGRESS,
      sector: newProcess.sector,
      priority: newProcess.priority,
      createdAt: new Date().toISOString().split('T')[0],
      currentStep: 1,
      totalSteps: 5,
    };

    await storage.saveProcess(proc);
    await loadProcesses();
    setShowAddModal(false);
    setNewProcess({
      title: '',
      description: '',
      sector: SectorType.PROGEP,
      priority: 'Medium',
    });
  };

  const handleAdvance = async (proc: Process) => {
    if (!canAdvance) {
      Alert.alert('Sem permissão', 'Você não tem permissão para avançar processos');
      return;
    }

    if (proc.currentStep && proc.totalSteps && proc.currentStep >= proc.totalSteps) {
      const updatedProc = { ...proc, status: ProcessStatus.COMPLETED };
      await storage.saveProcess(updatedProc);
    } else {
      const updatedProc = {
        ...proc,
        currentStep: (proc.currentStep || 1) + 1,
      };
      await storage.saveProcess(updatedProc);
    }
    await loadProcesses();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ProcessStatus.IN_PROGRESS: return colors.warning;
      case ProcessStatus.COMPLETED: return colors.success;
      case ProcessStatus.PENDING: return colors.info;
      case ProcessStatus.CANCELLED: return colors.error;
      default: return colors.textMuted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return colors.error;
      case 'Medium': return colors.warning;
      case 'Low': return colors.success;
      default: return colors.textMuted;
    }
  };

  const statusLabels: { [key: string]: string } = {
    'all': 'Todos',
    [ProcessStatus.IN_PROGRESS]: 'Em Andamento',
    [ProcessStatus.PENDING]: 'Pendente',
    [ProcessStatus.COMPLETED]: 'Concluído',
    [ProcessStatus.CANCELLED]: 'Cancelado',
  };

  const renderProcess = ({ item }: { item: Process }) => {
    const progress = item.currentStep && item.totalSteps 
      ? (item.currentStep / item.totalSteps) * 100 
      : 0;

    return (
      <Card style={styles.processCard}>
        <View style={styles.processHeader}>
          <View style={styles.processLeft}>
            <Text style={styles.processNumber}>#{item.number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '30' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {statusLabels[item.status]}
              </Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, { borderColor: getPriorityColor(item.priority) }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority === 'High' ? 'Alta' : item.priority === 'Medium' ? 'Média' : 'Baixa'}
            </Text>
          </View>
        </View>

        <Text style={styles.processTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.processDesc} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.processFooter}>
          <View style={styles.processInfo}>
            <Ionicons name="business-outline" size={14} color={colors.textMuted} />
            <Text style={styles.processInfoText}>{item.sector}</Text>
          </View>
          <View style={styles.processInfo}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.processInfoText}>{item.createdAt}</Text>
          </View>
        </View>

        {item.currentStep && item.totalSteps && (
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progresso</Text>
              <Text style={styles.progressValue}>{item.currentStep}/{item.totalSteps} etapas</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {canAdvance && item.status === ProcessStatus.IN_PROGRESS && (
          <TouchableOpacity 
            style={styles.advanceBtn}
            onPress={() => handleAdvance(item)}
          >
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            <Text style={styles.advanceBtnText}>Avançar Etapa</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchText}
            placeholder="Buscar processos..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {['all', ProcessStatus.IN_PROGRESS, ProcessStatus.PENDING, ProcessStatus.COMPLETED].map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
              {statusLabels[status]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Processes List */}
      <FlatList
        data={filteredProcesses}
        keyExtractor={(item) => item.id}
        renderItem={renderProcess}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="git-network-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum processo encontrado</Text>
          </View>
        }
      />

      {/* FAB */}
      {canCreate && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Processo</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Input
              placeholder="Título do processo"
              value={newProcess.title}
              onChangeText={(text) => setNewProcess({ ...newProcess, title: text })}
              icon="document-text-outline"
            />

            <Input
              placeholder="Descrição (opcional)"
              value={newProcess.description}
              onChangeText={(text) => setNewProcess({ ...newProcess, description: text })}
              icon="text-outline"
              multiline
            />

            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Prioridade:</Text>
              <View style={styles.optionRow}>
                {(['Low', 'Medium', 'High'] as const).map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.optionBtn,
                      newProcess.priority === priority && { 
                        backgroundColor: getPriorityColor(priority) + '30',
                        borderColor: getPriorityColor(priority) 
                      }
                    ]}
                    onPress={() => setNewProcess({ ...newProcess, priority })}
                  >
                    <Text style={[
                      styles.optionBtnText,
                      newProcess.priority === priority && { color: getPriorityColor(priority) }
                    ]}>
                      {priority === 'High' ? 'Alta' : priority === 'Medium' ? 'Média' : 'Baixa'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Setor:</Text>
              <View style={styles.sectorOptions}>
                {Object.values(SectorType).map(sector => (
                  <TouchableOpacity
                    key={sector}
                    style={[
                      styles.sectorOption,
                      newProcess.sector === sector && styles.sectorOptionActive
                    ]}
                    onPress={() => setNewProcess({ ...newProcess, sector })}
                  >
                    <Text style={[
                      styles.sectorOptionText,
                      newProcess.sector === sector && styles.sectorOptionTextActive
                    ]}>{sector}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Criar Processo" onPress={handleAddProcess} style={{ marginTop: spacing.lg }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
    gap: spacing.sm,
  },
  searchText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  processCard: {
    marginBottom: spacing.md,
  },
  processHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  processLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  processNumber: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  processTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  processDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  processFooter: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  processInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  processInfoText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressValue: {
    ...typography.caption,
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  advanceBtnText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  optionSection: {
    marginTop: spacing.sm,
  },
  optionLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionBtnText: {
    ...typography.small,
    color: colors.textMuted,
  },
  sectorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sectorOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectorOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectorOptionText: {
    ...typography.small,
    color: colors.textMuted,
  },
  sectorOptionTextActive: {
    color: '#fff',
  },
});
