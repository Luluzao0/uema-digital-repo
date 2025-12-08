import React, { useState } from 'react';
import { 
    Plus, 
    ChevronRight, 
    AlertCircle, 
    CheckCircle, 
    Clock, 
    XCircle,
    FileText,
    Search,
    Filter,
    Calendar,
    User,
    ArrowUpRight
} from 'lucide-react';
import { MOCK_PROCESSES } from '../constants';
import { Process, SectorType } from '../types';
import { Modal } from '../components/Modal';
import { showToast } from '../App';

export const ProcessesView: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>(MOCK_PROCESSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  
  // New Process Form
  const [newProc, setNewProc] = useState({ title: '', sector: SectorType.PROPLAD, desc: '' });

  const handleCreate = () => {
    const p: Process = {
        id: `p${Date.now()}`,
        number: `PROC-2025-${Math.floor(Math.random() * 9999)}`,
        title: newProc.title,
        currentStep: 'Triagem Inicial',
        status: 'Pending',
        assignedTo: newProc.sector,
        lastUpdate: new Date().toLocaleDateString('pt-BR'),
        priority: 'Medium'
    };
    setProcesses([p, ...processes]);
    setIsCreateModalOpen(false);
    setNewProc({ title: '', sector: SectorType.PROPLAD, desc: '' });
    showToast('Processo iniciado com sucesso!');
  };

  const handleStatusChange = (status: 'Approved' | 'Rejected') => {
      if (!selectedProcess) return;
      const updated = processes.map(p => 
          p.id === selectedProcess.id ? { ...p, status: status, currentStep: status === 'Approved' ? 'Finalizado' : 'Arquivado', lastUpdate: new Date().toLocaleDateString('pt-BR') } : p
      );
      setProcesses(updated);
      setSelectedProcess(null);
      showToast(status === 'Approved' ? 'Processo aprovado!' : 'Processo rejeitado.', status === 'Approved' ? 'success' : 'error');
  };

  const filteredProcesses = processes.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
        'Approved': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Aprovado' },
        'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejeitado' },
        'In Progress': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Em Andamento' },
        'Pending': { color: 'bg-amber-100 text-amber-800', icon: AlertCircle, label: 'Pendente' }
    };
    const c = config[status as keyof typeof config] || config['Pending'];
    const Icon = c.icon;
    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${c.color}`}>
            <Icon size={14} /> {c.label}
        </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com Busca e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <h2 className="text-lg font-bold text-slate-800 whitespace-nowrap hidden md:block">Meus Processos</h2>
         
         <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 md:justify-end">
             <div className="relative flex-1 sm:max-w-xs">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou número..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             
             <div className="relative w-full sm:w-auto">
                 <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full sm:w-40 pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm appearance-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                 >
                     <option value="all">Todos Status</option>
                     <option value="Pending">Pendentes</option>
                     <option value="In Progress">Em Andamento</option>
                     <option value="Approved">Aprovados</option>
                     <option value="Rejected">Rejeitados</option>
                 </select>
                 <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>

             <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm whitespace-nowrap"
             >
                <Plus size={18} /> Novo
             </button>
         </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         {filteredProcesses.length === 0 ? (
             <div className="p-12 text-center">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                     <Search size={32} />
                 </div>
                 <h3 className="text-slate-900 font-bold">Nenhum processo encontrado</h3>
                 <p className="text-slate-500 text-sm mt-1">Tente alterar os filtros ou criar um novo processo.</p>
             </div>
         ) : (
             <div className="divide-y divide-slate-100">
                 {filteredProcesses.map(proc => (
                     <div 
                        key={proc.id} 
                        onClick={() => setSelectedProcess(proc)}
                        className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer group"
                     >
                         <div className="flex items-start gap-4">
                             <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-white group-hover:border-emerald-200 group-hover:text-emerald-600 border border-transparent transition-all">
                                 <FileText size={24} />
                             </div>
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 rounded">{proc.number}</span>
                                     {getStatusBadge(proc.status)}
                                 </div>
                                 <h3 className="font-bold text-slate-800 text-base">{proc.title}</h3>
                                 <p className="text-sm text-slate-500 mt-0.5">
                                     Está em: <span className="font-medium text-slate-700">{proc.currentStep}</span> • Resp: {proc.assignedTo}
                                 </p>
                             </div>
                         </div>
                         <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                             <div className="text-right hidden md:block">
                                 <p className="text-xs text-slate-400">Última atualização</p>
                                 <p className="text-sm font-medium text-slate-700">{proc.lastUpdate}</p>
                             </div>
                             <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600" />
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>

      {/* Modal Criar */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Processo Administrativo">
         <div className="space-y-4 py-2">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Assunto Principal</label>
                <input 
                    type="text" 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="Ex: Solicitação de Diárias"
                    value={newProc.title}
                    onChange={e => setNewProc({...newProc, title: e.target.value})}
                />
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Setor de Destino</label>
                <select 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                    value={newProc.sector}
                    onChange={e => setNewProc({...newProc, sector: e.target.value as SectorType})}
                >
                    {Object.values(SectorType).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                <textarea 
                    rows={4}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="Descreva a solicitação detalhadamente..."
                    value={newProc.desc}
                    onChange={e => setNewProc({...newProc, desc: e.target.value})}
                ></textarea>
            </div>

            <button 
                onClick={handleCreate}
                disabled={!newProc.title}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
            >
                Protocolar Processo
            </button>
         </div>
      </Modal>

      {/* Modal Detalhes */}
      {selectedProcess && (
          <Modal isOpen={!!selectedProcess} onClose={() => setSelectedProcess(null)} title="Detalhes do Processo" maxWidth="max-w-2xl">
              <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{selectedProcess.number}</span>
                              {getStatusBadge(selectedProcess.status)}
                          </div>
                          <h2 className="text-xl font-bold text-slate-900">{selectedProcess.title}</h2>
                      </div>
                      <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              selectedProcess.priority === 'High' ? 'bg-red-50 text-red-700' : 
                              selectedProcess.priority === 'Medium' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                              Prioridade {selectedProcess.priority === 'High' ? 'Alta' : selectedProcess.priority === 'Medium' ? 'Média' : 'Baixa'}
                          </span>
                      </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500 mb-1">
                              <User size={14} /> <span className="text-xs font-bold uppercase">Responsável Atual</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{selectedProcess.assignedTo}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500 mb-1">
                              <Calendar size={14} /> <span className="text-xs font-bold uppercase">Última Atualização</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{selectedProcess.lastUpdate}</p>
                      </div>
                  </div>

                  {/* Timeline Mock */}
                  <div>
                      <h4 className="font-bold text-slate-800 mb-4">Histórico de Tramitação</h4>
                      <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
                          <div className="relative">
                              <div className="absolute -left-[21px] top-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-slate-200"></div>
                              <p className="text-sm font-bold text-slate-800">{selectedProcess.currentStep}</p>
                              <p className="text-xs text-slate-500">Há 2 horas • {selectedProcess.assignedTo}</p>
                          </div>
                          <div className="relative opacity-60">
                              <div className="absolute -left-[21px] top-0 w-3 h-3 bg-slate-300 rounded-full border-2 border-white ring-1 ring-slate-200"></div>
                              <p className="text-sm font-bold text-slate-800">Análise Técnica</p>
                              <p className="text-xs text-slate-500">Ontem • Dept. Técnico</p>
                          </div>
                          <div className="relative opacity-60">
                              <div className="absolute -left-[21px] top-0 w-3 h-3 bg-slate-300 rounded-full border-2 border-white ring-1 ring-slate-200"></div>
                              <p className="text-sm font-bold text-slate-800">Abertura de Processo</p>
                              <p className="text-xs text-slate-500">3 dias atrás • Você</p>
                          </div>
                      </div>
                  </div>

                  {/* Actions */}
                  {(selectedProcess.status === 'Pending' || selectedProcess.status === 'In Progress') && (
                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <button 
                            onClick={() => handleStatusChange('Rejected')}
                            className="flex-1 py-2.5 border border-red-200 text-red-700 font-bold rounded-lg hover:bg-red-50 transition-colors flex justify-center items-center gap-2"
                          >
                              <XCircle size={18} /> Rejeitar
                          </button>
                          <button 
                            onClick={() => handleStatusChange('Approved')}
                            className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex justify-center items-center gap-2"
                          >
                              <CheckCircle size={18} /> Aprovar e Finalizar
                          </button>
                      </div>
                  )}
              </div>
          </Modal>
      )}
    </div>
  );
};