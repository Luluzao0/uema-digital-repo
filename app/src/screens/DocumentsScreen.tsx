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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Input } from '../components';
import { colors, spacing, borderRadius, typography } from '../theme';
import { storage } from '../services/storage';
import { Document, SectorType, User, hasPermission } from '../types';
import { scale, fontScale, getBottomSpace } from '../utils/responsive';

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
            <Ionicons name={icon.name as any} size={scale(24)} color={icon.color} />
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
              <Ionicons name="eye-outline" size={scale(20)} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="download-outline" size={scale(20)} color={colors.success} />
            </TouchableOpacity>
            {canDelete && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={scale(20)} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
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
            placeholder="Buscar documentos..."
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
            <Ionicons name="document-outline" size={scale(64)} color={colors.textMuted} />
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
            <Ionicons name="add" size={scale(28)} color="#fff" />
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
                <Ionicons name="close" size={scale(24)} color={colors.textPrimary} />
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

            <Button title="Criar Documento" onPress={handleAddDocument} style={{ marginTop: scale(20) }} />
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
    borderRadius: scale(8),
    paddingHorizontal: scale(16),
    borderWidth: 1,
    borderColor: colors.border,
    height: scale(48),
    gap: scale(10),
  },
  searchText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontScale(16),
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    gap: scale(6),
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: scale(12),
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
  docCard: {
    marginBottom: scale(10),
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  iconBox: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: fontScale(15),
    color: colors.textPrimary,
    fontWeight: '600',
  },
  docMeta: {
    fontSize: fontScale(12),
    color: colors.textMuted,
    marginTop: scale(2),
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: scale(6),
    gap: scale(6),
  },
  tag: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(20),
  },
  tagText: {
    fontSize: fontScale(10),
    color: colors.primary,
  },
  docActions: {
    flexDirection: 'row',
    gap: scale(6),
  },
  actionBtn: {
    padding: scale(6),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(40),
  },
  emptyText: {
    fontSize: fontScale(15),
    color: colors.textMuted,
    marginTop: scale(12),
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
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    paddingBottom: scale(20) + getBottomSpace(),
    gap: scale(12),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  modalTitle: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectorPicker: {
    marginTop: scale(10),
  },
  pickerLabel: {
    fontSize: fontScale(13),
    color: colors.textMuted,
    marginBottom: scale(10),
  },
  sectorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  sectorOption: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectorOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectorOptionText: {
    fontSize: fontScale(13),
    color: colors.textMuted,
  },
  sectorOptionTextActive: {
    color: '#fff',
  },
});
