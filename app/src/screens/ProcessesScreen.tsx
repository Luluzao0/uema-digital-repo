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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button, Input } from '../components';
import { colors, spacing, borderRadius, typography } from '../theme';
import { scale, fontScale, hp, getBottomSpace } from '../utils/responsive';
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={scale(20)} color={colors.textMuted} />
          <TextInput
            style={styles.searchText}
            placeholder="Buscar processos..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={scale(20)} color={colors.textMuted} />
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
            <Ionicons name="git-network-outline" size={scale(64)} color={colors.textMuted} />
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
            <Ionicons name="add" size={scale(28)} color="#fff" />
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
                <Ionicons name="close" size={scale(24)} color={colors.textPrimary} />
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

            <Button title="Criar Processo" onPress={handleAddProcess} style={{ marginTop: scale(20) }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    padding: scale(16),
    paddingBottom: 0,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    borderWidth: 1,
    borderColor: colors.border,
    height: scale(48),
    gap: scale(8),
  },
  searchText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontScale(16),
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    gap: scale(4),
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontScale(12),
    color: colors.textMuted,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: scale(16),
    paddingBottom: scale(100) + getBottomSpace(),
  },
  processCard: {
    marginBottom: scale(16),
  },
  processHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  processLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  processNumber: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(12),
    gap: scale(4),
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  statusText: {
    fontSize: fontScale(11),
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  priorityText: {
    fontSize: fontScale(10),
    fontWeight: '600',
  },
  processTitle: {
    fontSize: fontScale(16),
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: scale(4),
  },
  processDesc: {
    fontSize: fontScale(14),
    color: colors.textMuted,
    marginBottom: scale(8),
  },
  processFooter: {
    flexDirection: 'row',
    gap: scale(16),
  },
  processInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  processInfoText: {
    fontSize: fontScale(12),
    color: colors.textMuted,
  },
  progressContainer: {
    marginTop: scale(16),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(4),
  },
  progressLabel: {
    fontSize: fontScale(12),
    color: colors.textMuted,
  },
  progressValue: {
    fontSize: fontScale(12),
    color: colors.primary,
  },
  progressBar: {
    height: scale(6),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: scale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: scale(3),
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(16),
    paddingVertical: scale(8),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: scale(4),
  },
  advanceBtnText: {
    fontSize: fontScale(14),
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(48),
  },
  emptyText: {
    fontSize: fontScale(16),
    color: colors.textMuted,
    marginTop: scale(16),
  },
  fab: {
    position: 'absolute',
    right: scale(16),
    bottom: scale(16) + getBottomSpace(),
  },
  fabGradient: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
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
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(24),
    gap: scale(16),
    maxHeight: '85%',
    paddingBottom: scale(24) + getBottomSpace(),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  modalTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionSection: {
    marginTop: scale(8),
  },
  optionLabel: {
    fontSize: fontScale(14),
    color: colors.textMuted,
    marginBottom: scale(8),
  },
  optionRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  optionBtn: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionBtnText: {
    fontSize: fontScale(14),
    color: colors.textMuted,
  },
  sectorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  sectorOption: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectorOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectorOptionText: {
    fontSize: fontScale(14),
    color: colors.textMuted,
  },
  sectorOptionTextActive: {
    color: '#fff',
  },
});
