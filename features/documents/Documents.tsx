import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  FileText,
  FileSpreadsheet,
  Download, 
  Trash2,
  Upload,
  Loader2,
  Sparkles,
  Eye,
  Tag,
  X,
  File,
  Filter
} from 'lucide-react';
import { Document, SectorType, hasPermission, UserRole } from '../../types';
import { showToast } from '../../App';
import { storage, fileStorage } from '../../services/storage';
import { aiService } from '../../services/ai';

// Obter role do usuário atual
const getCurrentUserRole = (): UserRole => {
  try {
    const userData = localStorage.getItem('uema_user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.role || 'Viewer';
    }
  } catch {
    // ignore
  }
  return 'Viewer';
};

// Floating Document Card Component
const FloatingDocCard = ({ 
  doc, 
  onView, 
  onDownload, 
  onDelete,
  index
}: { 
  doc: Document; 
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  index: number;
}) => {
  const gradients = [
    'from-blue-500/20 to-purple-500/20',
    'from-emerald-500/20 to-cyan-500/20',
    'from-orange-500/20 to-red-500/20',
    'from-pink-500/20 to-purple-500/20',
    'from-cyan-500/20 to-blue-500/20',
  ];
  
  const gradient = gradients[index % gradients.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`glass rounded-2xl p-5 cursor-pointer group bg-gradient-to-br ${gradient}`}
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          doc.type === 'XLSX' ? 'bg-emerald-500/20' : 
          doc.type === 'DOCX' ? 'bg-blue-500/20' : 'bg-red-500/20'
        }`}>
          {doc.type === 'XLSX' ? (
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          ) : doc.type === 'DOCX' ? (
            <FileText className="w-6 h-6 text-blue-400" />
          ) : (
            <FileText className="w-6 h-6 text-red-400" />
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Download className="w-4 h-4 text-white/70" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </motion.button>
        </div>
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-white mb-1 line-clamp-2">{doc.title}</h3>
      <p className="text-xs text-white/50 mb-3">{doc.size} • {doc.createdAt}</p>
      
      {/* Tags */}
      {doc.tags && doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {doc.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60">
              {tag}
            </span>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-xs text-white/40">+{doc.tags.length - 3}</span>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-xs px-2 py-1 bg-white/10 rounded-lg text-white/60">
          {doc.sector}
        </span>
        <Eye className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
      </div>
    </motion.div>
  );
};

// Modal Component (inline)
const GlassModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode; 
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass-strong rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </motion.button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [docData, setDocData] = useState({ title: '', sector: SectorType.PROGEP, type: 'PDF' });
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState('');
  
  // Permissões do usuário atual
  const userRole = getCurrentUserRole();
  const canCreate = hasPermission(userRole, 'canCreateDocument');
  const canDelete = hasPermission(userRole, 'canDeleteDocument');
  const canEdit = hasPermission(userRole, 'canEditDocument');

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        await storage.init();
        const docs = await storage.getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
        showToast('Erro ao carregar documentos', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setDocData({ ...docData, title: selectedFile.name.split('.')[0] });
    }
  };

  const handleGenerateAI = async () => {
    if (!docData.title) {
      showToast('Digite um título primeiro', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const [tags, summary] = await Promise.all([
        aiService.generateTags(docData.title),
        aiService.generateSummary(docData.title)
      ]);
      setGeneratedTags(tags);
      setGeneratedSummary(summary);
      showToast('Tags e resumo gerados com IA!', 'success');
    } catch (error) {
      showToast('Erro ao gerar com IA', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFile(null);
    setDocData({ title: '', sector: SectorType.PROGEP, type: 'PDF' });
    setGeneratedTags([]);
    setGeneratedSummary('');
  };

  const handleSave = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const docId = crypto.randomUUID(); // Gerar UUID válido
      const fileUrl = await storage.saveFile(docId, file); // Obter o path do arquivo salvo
      
      // Extrair conteúdo do arquivo para RAG
      const extractedContent = await fileStorage.extractTextFromFile(file);
      
      // Gerar tags e resumo com base no conteúdo extraído
      let tags = generatedTags.length > 0 ? generatedTags : await aiService.generateTags(docData.title, extractedContent);
      let summary = generatedSummary || await aiService.generateSummary(docData.title, extractedContent);
      
      const newDoc: Document = {
        id: docId,
        title: docData.title,
        type: file.name.endsWith('xlsx') || file.name.endsWith('xls') ? 'XLSX' : 
              file.name.endsWith('docx') || file.name.endsWith('doc') ? 'DOCX' : 'PDF',
        sector: docData.sector,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        status: 'Draft',
        tags: tags,
        summary: summary,
        author: 'Você',
        size: file.size < 1024 * 1024 
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        fileUrl: fileUrl, // Salvar o caminho do arquivo
        content: extractedContent.substring(0, 3000) // Armazenar conteúdo extraído (limitado)
      };
      
      await storage.saveDocument(newDoc);
      setDocuments([newDoc, ...documents]);
      setIsUploadModalOpen(false);
      resetForm();
      showToast('Arquivo salvo com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving document:', error);
      showToast('Erro ao salvar documento', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Usar fileUrl se disponível, senão tentar construir o caminho
      const filePath = doc.fileUrl || `${doc.id}.${doc.type.toLowerCase()}`;
      const fileData = await storage.getFile(filePath);
      if (fileData) {
        const url = URL.createObjectURL(fileData.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.title + '.' + doc.type.toLowerCase();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Download iniciado: ${doc.title}`, 'success');
      } else {
        showToast(`"${doc.title}" é um documento de demonstração`, 'info');
      }
    } catch (error) {
      showToast('Erro ao baixar arquivo', 'error');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!window.confirm('Confirma exclusão?')) return;
    try {
      await storage.deleteDocument(doc.id);
      setDocuments(documents.filter(d => d.id !== doc.id));
      showToast('Documento excluído!', 'success');
    } catch (error) {
      showToast('Erro ao excluir', 'error');
    }
  };

  const filteredDocs = documents.filter(d => {
      const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSector = sectorFilter === 'all' || d.sector === sectorFilter;
      return matchSearch && matchSector;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Documentos</h1>
        <p className="text-white/50">Gerencie seus arquivos e documentos</p>
      </div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between"
      >
        <div className="flex gap-3 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          
          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="all" className="bg-[#1a1a1a]">Todos Setores</option>
              {Object.values(SectorType).map(s => (
                <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
              ))}
            </select>
          </div>
        </div>
        
        {canCreate ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-medium shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-5 h-5" />
            Novo Arquivo
          </motion.button>
        ) : (
          <div className="px-4 py-2 bg-white/5 rounded-xl text-white/40 text-sm">
            Sem permissão para criar
          </div>
        )}
      </motion.div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-3xl p-12 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <File className="w-10 h-10 text-white/30" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum documento encontrado</h3>
          <p className="text-white/50 mb-6">Faça upload do seu primeiro documento para começar</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 font-medium hover:bg-blue-500/30 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Fazer Upload
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filteredDocs.map((doc, idx) => (
              <FloatingDocCard
                key={doc.id}
                doc={doc}
                index={idx}
                onView={() => setSelectedDoc(doc)}
                onDownload={() => handleDownload(doc)}
                onDelete={() => handleDelete(doc)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Upload Modal */}
      <GlassModal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); resetForm(); }}
        title="Upload de Arquivo"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Drop Zone */}
              <div className="relative border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-500/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.docx,.doc"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-white font-medium mb-1">Arraste ou clique para selecionar</p>
                <p className="text-sm text-white/50">PDF, DOCX, XLSX (máx. 50MB)</p>
              </div>
              
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl"
                >
                  <FileText className="w-8 h-8 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-white/50">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </motion.div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!file}
                onClick={() => setStep(2)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Nome do Documento</label>
                <input
                  type="text"
                  value={docData.title}
                  onChange={e => setDocData({...docData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                  placeholder="Digite o nome..."
                />
              </div>
              
              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Setor</label>
                <select
                  value={docData.sector}
                  onChange={e => setDocData({...docData, sector: e.target.value as SectorType})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  {Object.values(SectorType).map(s => (
                    <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
                  ))}
                </select>
              </div>
              
              {/* AI Generation */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-white">Geração com IA</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateAI}
                    disabled={isProcessing || !docData.title}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar
                  </motion.button>
                </div>
                
                {generatedTags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-purple-300 mb-1.5">Tags:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedTags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white/80">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {generatedSummary && (
                  <div>
                    <p className="text-xs text-purple-300 mb-1.5">Resumo:</p>
                    <p className="text-sm text-white/70 bg-white/5 rounded-lg p-3">{generatedSummary}</p>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-colors"
                >
                  Voltar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isProcessing || !docData.title}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassModal>

      {/* Detail Modal */}
      <GlassModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title="Detalhes do Documento"
      >
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedDoc.type === 'XLSX' ? 'bg-emerald-500/20' : 
                selectedDoc.type === 'DOCX' ? 'bg-blue-500/20' : 'bg-red-500/20'
              }`}>
                {selectedDoc.type === 'XLSX' ? (
                  <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                ) : selectedDoc.type === 'DOCX' ? (
                  <FileText className="w-7 h-7 text-blue-400" />
                ) : (
                  <FileText className="w-7 h-7 text-red-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedDoc.title}</h3>
                <p className="text-sm text-white/50">{selectedDoc.size} • {selectedDoc.createdAt}</p>
              </div>
            </div>
            
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-white/50 mb-1">Setor</p>
                <p className="text-sm font-medium text-white">{selectedDoc.sector}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-white/50 mb-1">Status</p>
                <p className="text-sm font-medium text-white">{selectedDoc.status}</p>
              </div>
            </div>
            
            {/* Tags */}
            {selectedDoc.tags && selectedDoc.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/50 mb-2">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDoc.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-300">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Summary */}
            {selectedDoc.summary && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/50 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Resumo (IA)
                </div>
                <p className="text-sm text-white/70 bg-white/5 rounded-xl p-3 border border-white/10">{selectedDoc.summary}</p>
              </div>
            )}
            
            {/* Download Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { handleDownload(selectedDoc); setSelectedDoc(null); }}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Baixar Documento
            </motion.button>
          </motion.div>
        )}
      </GlassModal>
    </motion.div>
  );
};