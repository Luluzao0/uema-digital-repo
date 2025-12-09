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
import { Document, SectorType, User, hasPermission } from '../types';

interface DocumentsScreenProps {
  user: User;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ user }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', sector: SectorType.PROGEP });

  const canCreate = hasPermission(user.role, 'canCreateDocument');
  const canDelete = hasPermission(user.role, 'canDeleteDocument');

  const loadDocuments = async () => {
    await storage.init();
    const docs = await storage.getDocuments();
    setDocuments(docs);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const filteredDocs = documents.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       doc.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchSector = selectedSector === 'all' || doc.sector === selectedSector;
    return matchSearch && matchSector;
  });

  const handleAddDocument = async () => {
    if (!newDoc.title.trim()) {
      Alert.alert('Erro', 'Digite um título para o documento');
      return;
    }

    const doc: Document = {
      id: `doc_${Date.now()}`,
      title: newDoc.title,
      type: 'PDF',
      sector: newDoc.sector,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Draft',
      tags: [],
      author: user.name,
      size: '0 KB',
    };

    await storage.saveDocument(doc);
    await loadDocuments();
    setShowAddModal(false);
    setNewDoc({ title: '', sector: SectorType.PROGEP });
  };

  const handleDelete = (doc: Document) => {
    Alert.alert(
      'Excluir documento',
      `Deseja excluir "${doc.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            await storage.deleteDocument(doc.id);
            await loadDocuments();
          }
        },
      ]
    );
  };

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'PDF': return { name: 'document', color: colors.error };
      case 'XLSX': return { name: 'grid', color: colors.success };
      case 'DOCX': return { name: 'document-text', color: colors.primary };
      default: return { name: 'document', color: colors.textMuted };
    }
  };

  const renderDocument = ({ item }: { item: Document }) => {
    const icon = getDocIcon(item.type);
    
    return (
      <Card style={styles.docCard}>
        <View style={styles.docRow}>
          <View style={[styles.iconBox, { backgroundColor: icon.color + '20' }]}>
            <Ionicons name={icon.name as any} size={24} color={icon.color} />
          </View>
          
          <View style={styles.docInfo}>
            <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.docMeta}>{item.sector} • {item.createdAt} • {item.size}</Text>
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.slice(0, 3).map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.docActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="download-outline" size={20} color={colors.success} />
            </TouchableOpacity>
            {canDelete && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
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
            placeholder="Buscar documentos..."
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedSector === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedSector('all')}
        >
          <Text style={[styles.filterText, selectedSector === 'all' && styles.filterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        {Object.values(SectorType).map(sector => (
          <TouchableOpacity
            key={sector}
            style={[styles.filterChip, selectedSector === sector && styles.filterChipActive]}
            onPress={() => setSelectedSector(sector)}
          >
            <Text style={[styles.filterText, selectedSector === sector && styles.filterTextActive]}>
              {sector}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Documents List */}
      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum documento encontrado</Text>
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
              <Text style={styles.modalTitle}>Novo Documento</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Input
              placeholder="Título do documento"
              value={newDoc.title}
              onChangeText={(text) => setNewDoc({ ...newDoc, title: text })}
              icon="document-text-outline"
            />

            <View style={styles.sectorPicker}>
              <Text style={styles.pickerLabel}>Setor:</Text>
              <View style={styles.sectorOptions}>
                {Object.values(SectorType).map(sector => (
                  <TouchableOpacity
                    key={sector}
                    style={[
                      styles.sectorOption,
                      newDoc.sector === sector && styles.sectorOptionActive
                    ]}
                    onPress={() => setNewDoc({ ...newDoc, sector })}
                  >
                    <Text style={[
                      styles.sectorOptionText,
                      newDoc.sector === sector && styles.sectorOptionTextActive
                    ]}>{sector}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Criar Documento" onPress={handleAddDocument} style={{ marginTop: spacing.lg }} />
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
  docCard: {
    marginBottom: spacing.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  docMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 10,
    color: colors.primary,
  },
  docActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
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
  sectorPicker: {
    marginTop: spacing.sm,
  },
  pickerLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
