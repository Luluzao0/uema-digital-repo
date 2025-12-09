import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    ChevronRight, 
    CheckCircle, 
    Clock, 
    XCircle,
    FileText,
    Search,
    Calendar,
    User,
    Loader2,
    ArrowRight,
    X,
    AlertTriangle,
    GitBranch,
    Filter
} from 'lucide-react';
import { Process, SectorType } from '../../types';
import { showToast } from '../../App';
import { storage } from '../../services/storage';

// Workflow steps
const WORKFLOW_STEPS = [
  'Triagem Inicial',
  'Análise Documental',
  'Parecer Técnico',
  'Deliberação',
  'Finalizado'
];

// Glass Modal Component
const GlassModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  size?: 'md' | 'lg';
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'} glass-strong rounded-3xl p-6 max-h-[90vh] overflow-y-auto`}
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

export const Processes: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  
  const [newProc, setNewProc] = useState({ title: '', sector: SectorType.PROPLAD, desc: '', priority: 'Medium' as 'Low' | 'Medium' | 'High' });

  useEffect(() => {
    const loadProcesses = async () => {
      setIsLoading(true);
      await storage.init();
      const procs = await storage.getProcesses();
      setProcesses(procs);
      setIsLoading(false);
    };
    loadProcesses();
  }, []);

  const handleCreate = async () => {
    const p: Process = {
        id: `p${Date.now()}`,
        number: `PROC-2025-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        title: newProc.title,
        currentStep: WORKFLOW_STEPS[0],
        status: 'Pending',
        assignedTo: newProc.sector,
        lastUpdate: new Date().toLocaleDateString('pt-BR'),
        priority: newProc.priority
    };
    
    await storage.saveProcess(p);
    setProcesses([p, ...processes]);
    setIsCreateModalOpen(false);
    setNewProc({ title: '', sector: SectorType.PROPLAD, desc: '', priority: 'Medium' });
    showToast('Processo protocolado com sucesso!', 'success');
  };

  const handleAdvanceStep = async () => {
    if (!selectedProcess) return;
    
    setIsAdvancing(true);
    
    const currentStepIndex = WORKFLOW_STEPS.indexOf(selectedProcess.currentStep);
    const nextStepIndex = Math.min(currentStepIndex + 1, WORKFLOW_STEPS.length - 1);
    const isLastStep = nextStepIndex === WORKFLOW_STEPS.length - 1;
    
    const updated: Process = {
      ...selectedProcess,
      currentStep: WORKFLOW_STEPS[nextStepIndex],
      status: isLastStep ? 'Approved' : 'In Progress',
      lastUpdate: new Date().toLocaleDateString('pt-BR')
    };
    
    await storage.saveProcess(updated);
    setProcesses(processes.map(p => p.id === updated.id ? updated : p));
    setSelectedProcess(updated);
    setIsAdvancing(false);
    
    showToast(isLastStep ? 'Processo finalizado!' : `Avançado para: ${WORKFLOW_STEPS[nextStepIndex]}`, 'success');
  };

  const handleStatusChange = async (status: 'Approved' | 'Rejected') => {
      if (!selectedProcess) return;
      
      const updated: Process = {
          ...selectedProcess,
          status,
          currentStep: status === 'Approved' ? 'Finalizado' : 'Arquivado',
          lastUpdate: new Date().toLocaleDateString('pt-BR')
      };
      
      await storage.saveProcess(updated);
      setProcesses(processes.map(p => p.id === updated.id ? updated : p));
      setSelectedProcess(null);
      showToast(status === 'Approved' ? 'Processo aprovado!' : 'Processo rejeitado.', status === 'Approved' ? 'success' : 'error');
  };

  const filteredProcesses = processes.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    const config = {
        'Approved': { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Aprovado', icon: CheckCircle },
        'Rejected': { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rejeitado', icon: XCircle },
        'In Progress': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Em Andamento', icon: Clock },
        'Pending': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pendente', icon: Clock }
    };
    return config[status as keyof typeof config] || config['Pending'];
  };

  const getPriorityConfig = (priority: string) => {
    const config = {
        'High': { color: 'bg-red-500/20 text-red-400', label: 'Urgente' },
        'Medium': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Normal' },
        'Low': { color: 'bg-emerald-500/20 text-emerald-400', label: 'Baixa' }
    };
    return config[priority as keyof typeof config] || config['Medium'];
  };

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
        <h1 className="text-3xl font-bold text-white mb-2">Processos</h1>
        <p className="text-white/50">Acompanhe seus processos e tramitações</p>
      </div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between"
      >
        <div className="flex gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar processos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="all" className="bg-[#1a1a1a]">Todos Status</option>
              <option value="Pending" className="bg-[#1a1a1a]">Pendentes</option>
              <option value="In Progress" className="bg-[#1a1a1a]">Em Andamento</option>
              <option value="Approved" className="bg-[#1a1a1a]">Aprovados</option>
              <option value="Rejected" className="bg-[#1a1a1a]">Rejeitados</option>
            </select>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-medium shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-5 h-5" />
          Novo Processo
        </motion.button>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: processes.length, color: 'from-blue-500/20 to-purple-500/20' },
          { label: 'Pendentes', value: processes.filter(p => p.status === 'Pending').length, color: 'from-yellow-500/20 to-orange-500/20' },
          { label: 'Em Andamento', value: processes.filter(p => p.status === 'In Progress').length, color: 'from-cyan-500/20 to-blue-500/20' },
          { label: 'Concluídos', value: processes.filter(p => p.status === 'Approved').length, color: 'from-emerald-500/20 to-green-500/20' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass rounded-2xl p-4 bg-gradient-to-br ${stat.color}`}
          >
            <p className="text-sm text-white/60">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Processes List */}
      {filteredProcesses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-3xl p-12 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-10 h-10 text-white/30" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum processo encontrado</h3>
          <p className="text-white/50 mb-6">Crie um novo processo para começar</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 font-medium hover:bg-blue-500/30 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Processo
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-semibold text-white">Meus Processos</h3>
            <span className="text-sm text-white/50">{filteredProcesses.length} registro(s)</span>
          </div>
          
          <div className="divide-y divide-white/5">
            {filteredProcesses.map((proc, idx) => {
              const statusConfig = getStatusConfig(proc.status);
              const priorityConfig = getPriorityConfig(proc.priority);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={proc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  onClick={() => setSelectedProcess(proc)}
                  className="p-4 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white/60" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-white/50 bg-white/10 px-2 py-0.5 rounded-lg">
                          {proc.number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </span>
                      </div>
                      <h3 className="font-medium text-white">{proc.title}</h3>
                      <p className="text-sm text-white/50">
                        Etapa: <span className="text-white/70">{proc.currentStep}</span> • {proc.assignedTo}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-white/40">Atualização</p>
                      <p className="text-sm text-white/70">{proc.lastUpdate}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Create Modal */}
      <GlassModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Processo">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Assunto *</label>
            <input
              type="text"
              value={newProc.title}
              onChange={e => setNewProc({...newProc, title: e.target.value})}
              placeholder="Ex: Solicitação de Diárias"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Setor Destino</label>
              <select
                value={newProc.sector}
                onChange={e => setNewProc({...newProc, sector: e.target.value as SectorType})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                {Object.values(SectorType).map(s => (
                  <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Prioridade</label>
              <select
                value={newProc.priority}
                onChange={e => setNewProc({...newProc, priority: e.target.value as 'Low' | 'Medium' | 'High'})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="Low" className="bg-[#1a1a1a]">Baixa</option>
                <option value="Medium" className="bg-[#1a1a1a]">Normal</option>
                <option value="High" className="bg-[#1a1a1a]">Urgente</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Descrição</label>
            <textarea
              rows={4}
              value={newProc.desc}
              onChange={e => setNewProc({...newProc, desc: e.target.value})}
              placeholder="Descreva os detalhes do processo..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={!newProc.title}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Protocolar Processo
          </motion.button>
        </div>
      </GlassModal>

      {/* Detail Modal */}
      <GlassModal 
        isOpen={!!selectedProcess} 
        onClose={() => setSelectedProcess(null)} 
        title={selectedProcess ? `Processo ${selectedProcess.number}` : ''} 
        size="lg"
      >
        {selectedProcess && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold text-white">{selectedProcess.title}</h2>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg ${getPriorityConfig(selectedProcess.priority).color}`}>
                    {getPriorityConfig(selectedProcess.priority).label}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-lg border ${getStatusConfig(selectedProcess.status).color}`}>
                    {getStatusConfig(selectedProcess.status).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Workflow */}
            {(selectedProcess.status === 'Pending' || selectedProcess.status === 'In Progress') && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-4">Fluxo do Processo</h4>
                <div className="flex items-center justify-between overflow-x-auto pb-2">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const currentIdx = WORKFLOW_STEPS.indexOf(selectedProcess.currentStep);
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isPending = idx > currentIdx;
                    
                    return (
                      <React.Fragment key={step}>
                        <div className={`flex flex-col items-center min-w-[80px] ${isPending ? 'opacity-40' : ''}`}>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                              isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                              isCurrent ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50' :
                              'bg-white/10 text-white/40'
                            }`}
                          >
                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                          </motion.div>
                          <span className={`text-xs mt-2 text-center ${isCurrent ? 'text-blue-400 font-medium' : 'text-white/50'}`}>
                            {step}
                          </span>
                        </div>
                        {idx < WORKFLOW_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 rounded ${idx < currentIdx ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-xs">Responsável</span>
                </div>
                <p className="font-medium text-white">{selectedProcess.assignedTo}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Última Movimentação</span>
                </div>
                <p className="font-medium text-white">{selectedProcess.lastUpdate}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-4">Histórico</h4>
              <div className="space-y-4 pl-2">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="w-0.5 h-full bg-white/10"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-white">{selectedProcess.currentStep}</p>
                    <p className="text-sm text-white/50">{selectedProcess.assignedTo} - {selectedProcess.lastUpdate}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-3 h-3 bg-white/30 rounded-full ml-0"></div>
                  <div>
                    <p className="font-medium text-white/60">Processo Criado</p>
                    <p className="text-sm text-white/40">Sistema</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {(selectedProcess.status === 'Pending' || selectedProcess.status === 'In Progress') && (
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStatusChange('Rejected')}
                  className="px-4 py-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium hover:bg-red-500/30 transition-colors"
                >
                  Arquivar
                </motion.button>
                <div className="flex-1 flex gap-3 justify-end">
                  {selectedProcess.currentStep !== 'Finalizado' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAdvanceStep}
                      disabled={isAdvancing}
                      className="px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 font-medium flex items-center gap-2 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                    >
                      {isAdvancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      Avançar Etapa
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStatusChange('Approved')}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-medium"
                  >
                    Finalizar
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassModal>
    </motion.div>
  );
};