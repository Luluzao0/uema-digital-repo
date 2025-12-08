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
    User
} from 'lucide-react';
import { MOCK_PROCESSES } from '../../constants';
import { Process, SectorType } from '../../types';
import { Modal } from '../../components/Modal';
import { showToast } from '../../App';

export const Processes: React.FC = () => {
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
        'Approved': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Aprovado' },
        'Rejected': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejeitado' },
        'In Progress': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Em Andamento' },
        'Pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pendente' }
    };
    const c = config[status as keyof typeof config] || config['Pending'];
    return (
        <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold border ${c.color}`}>
            {c.label}
        </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters Box */}
      <div className="bg-white p-3 border-t-2 border-gray-300 rounded-sm shadow-sm flex flex-col md:flex-row justify-between items-center gap-2">
         <div className="flex gap-2 w-full md:w-auto">
             <div className="flex items-center border border-gray-300 bg-gray-50 px-2 py-1 rounded-sm">
                <input 
                    type="text" 
                    placeholder="Buscar processos..." 
                    className="bg-transparent text-sm w-48 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Search size={14} className="text-gray-500" />
             </div>
             
             <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-300 bg-white text-sm px-2 py-1 rounded-sm outline-none"
             >
                 <option value="all">Status</option>
                 <option value="Pending">Pendentes</option>
                 <option value="In Progress">Andamento</option>
                 <option value="Approved">Aprovados</option>
                 <option value="Rejected">Rejeitados</option>
             </select>
         </div>

         <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1 bg-[#3c8dbc] hover:bg-[#367fa9] text-white px-3 py-1.5 rounded-sm font-bold text-xs shadow-sm"
         >
            <Plus size={14} /> NOVO PROCESSO
         </button>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-sm">
         <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Meus Processos</h3>
        </div>
         {filteredProcesses.length === 0 ? (
             <div className="p-8 text-center text-gray-500 text-sm">
                 Nenhum processo encontrado.
             </div>
         ) : (
             <div className="divide-y divide-gray-100">
                 {filteredProcesses.map((proc, idx) => (
                     <div 
                        key={proc.id} 
                        onClick={() => setSelectedProcess(proc)}
                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}
                     >
                         <div className="flex items-center gap-3">
                             <div className="text-gray-400">
                                 <FileText size={20} />
                             </div>
                             <div>
                                 <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-200 px-1 rounded-sm border border-gray-300">{proc.number}</span>
                                     {getStatusBadge(proc.status)}
                                 </div>
                                 <h3 className="font-bold text-gray-800 text-sm mt-0.5">{proc.title}</h3>
                                 <p className="text-xs text-gray-500">
                                     Etapa: <span className="font-semibold text-gray-700">{proc.currentStep}</span> • {proc.assignedTo}
                                 </p>
                             </div>
                         </div>
                         <div className="flex items-center gap-4">
                             <div className="text-right hidden sm:block">
                                 <p className="text-[10px] text-gray-400 uppercase">Atualização</p>
                                 <p className="text-xs font-semibold text-gray-700">{proc.lastUpdate}</p>
                             </div>
                             <ChevronRight size={16} className="text-gray-300" />
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>

      {/* Modal Criar */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Processo">
         <div className="space-y-3 py-2">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Assunto</label>
                <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-sm focus:border-blue-400 outline-none text-sm"
                    placeholder="Ex: Solicitação de Diárias"
                    value={newProc.title}
                    onChange={e => setNewProc({...newProc, title: e.target.value})}
                />
            </div>
            
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Setor Destino</label>
                <select 
                    className="w-full p-2 border border-gray-300 rounded-sm focus:border-blue-400 outline-none text-sm bg-white"
                    value={newProc.sector}
                    onChange={e => setNewProc({...newProc, sector: e.target.value as SectorType})}
                >
                    {Object.values(SectorType).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Descrição</label>
                <textarea 
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-sm focus:border-blue-400 outline-none text-sm"
                    value={newProc.desc}
                    onChange={e => setNewProc({...newProc, desc: e.target.value})}
                ></textarea>
            </div>

            <div className="pt-3 border-t border-gray-100">
                <button 
                    onClick={handleCreate}
                    disabled={!newProc.title}
                    className="bg-[#3c8dbc] text-white px-4 py-2 rounded-sm font-bold text-sm hover:bg-[#367fa9] float-right"
                >
                    Protocolar
                </button>
                <div className="clear-both"></div>
            </div>
         </div>
      </Modal>

      {/* Modal Detalhes */}
      {selectedProcess && (
          <Modal isOpen={!!selectedProcess} onClose={() => setSelectedProcess(null)} title={`Detalhes: ${selectedProcess.number}`} maxWidth="max-w-2xl">
              <div className="space-y-4">
                  {/* Header */}
                  <div className="bg-gray-50 p-3 border border-gray-200 rounded-sm">
                      <div className="flex justify-between items-start">
                          <h2 className="text-lg font-bold text-gray-800">{selectedProcess.title}</h2>
                          {getStatusBadge(selectedProcess.status)}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-600">
                           <span className="font-semibold">Prioridade: {selectedProcess.priority === 'High' ? 'Alta' : 'Normal'}</span>
                      </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="border border-gray-200 p-2 rounded-sm">
                          <div className="flex items-center gap-1 text-gray-500 mb-1 border-b border-gray-100 pb-1">
                              <User size={12} /> <span className="text-[10px] font-bold uppercase">Responsável</span>
                          </div>
                          <p className="text-sm font-bold text-gray-800">{selectedProcess.assignedTo}</p>
                      </div>
                      <div className="border border-gray-200 p-2 rounded-sm">
                          <div className="flex items-center gap-1 text-gray-500 mb-1 border-b border-gray-100 pb-1">
                              <Calendar size={12} /> <span className="text-[10px] font-bold uppercase">Última Movimentação</span>
                          </div>
                          <p className="text-sm font-bold text-gray-800">{selectedProcess.lastUpdate}</p>
                      </div>
                  </div>

                  {/* Timeline Mock */}
                  <div className="border-t border-gray-200 pt-3">
                      <h4 className="font-bold text-gray-700 text-sm mb-3 uppercase">Histórico</h4>
                      <div className="space-y-4 pl-2">
                          <div className="flex gap-3">
                              <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <div className="w-0.5 h-full bg-gray-200"></div>
                              </div>
                              <div className="pb-4">
                                  <p className="text-sm font-bold text-gray-800">{selectedProcess.currentStep}</p>
                                  <p className="text-xs text-gray-500">{selectedProcess.assignedTo} - 2 horas atrás</p>
                              </div>
                          </div>
                          <div className="flex gap-3">
                              <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-gray-600">Abertura</p>
                                  <p className="text-xs text-gray-500">Você - 3 dias atrás</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Actions */}
                  {(selectedProcess.status === 'Pending' || selectedProcess.status === 'In Progress') && (
                      <div className="flex gap-2 pt-3 border-t border-gray-200 justify-end">
                          <button 
                            onClick={() => handleStatusChange('Rejected')}
                            className="px-3 py-2 border border-red-300 text-red-700 font-bold text-xs rounded-sm hover:bg-red-50"
                          >
                              REJEITAR
                          </button>
                          <button 
                            onClick={() => handleStatusChange('Approved')}
                            className="px-3 py-2 bg-[#00a65a] text-white font-bold text-xs rounded-sm hover:bg-[#008d4c]"
                          >
                              APROVAR
                          </button>
                      </div>
                  )}
              </div>
          </Modal>
      )}
    </div>
  );
};