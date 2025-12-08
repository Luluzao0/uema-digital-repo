import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search,
  ArrowRight
} from 'lucide-react';
import { ViewState } from '../../types';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Classic Info Box
  const InfoBox = ({ label, value, icon: Icon, colorClass, iconBgClass }: any) => (
    <div className="bg-white rounded-sm shadow-sm flex overflow-hidden">
        <div className={`w-20 flex items-center justify-center text-white ${iconBgClass}`}>
            <Icon size={32} />
        </div>
        <div className="p-4 flex-1">
            <span className="block text-xs uppercase text-gray-500 font-semibold tracking-wide">{label}</span>
            <span className="block text-xl font-bold text-gray-800 mt-1">{value}</span>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Cards de Métricas - Estilo InfoBox */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoBox 
            label="Pendentes" 
            value="3 Documentos" 
            icon={Clock} 
            iconBgClass="bg-yellow-500" 
        />
        <InfoBox 
            label="Processos" 
            value="12 Ativos" 
            icon={FileText} 
            iconBgClass="bg-blue-400" 
        />
        <InfoBox 
            label="Concluídos" 
            value="45 Finalizados" 
            icon={CheckCircle2} 
            iconBgClass="bg-green-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Ações Rápidas - Box Padrão */}
         <div className="bg-white border-t-2 border-blue-500 rounded-sm shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700 uppercase">Ações Rápidas</h3>
            </div>
            <div className="p-4 space-y-3">
                <button 
                    onClick={() => onNavigate('documents')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-left rounded-sm"
                >
                    <div className="flex items-center gap-3">
                        <Plus size={16} className="text-green-600" />
                        <span className="font-semibold text-gray-700 text-sm">Novo Documento</span>
                    </div>
                    <ArrowRight size={14} className="text-gray-400" />
                </button>
                
                <button 
                    onClick={() => onNavigate('processes')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-left rounded-sm"
                >
                    <div className="flex items-center gap-3">
                        <Search size={16} className="text-blue-600" />
                        <span className="font-semibold text-gray-700 text-sm">Consultar Processo</span>
                    </div>
                    <ArrowRight size={14} className="text-gray-400" />
                </button>
            </div>
         </div>

         {/* Lista de "Minhas Tarefas" - Tabela Simples */}
         <div className="lg:col-span-2 bg-white border-t-2 border-gray-300 rounded-sm shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 uppercase">Tarefas Recentes</h3>
                <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600">Hoje</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-2 font-semibold">Setor</th>
                            <th className="px-4 py-2 font-semibold">Tarefa</th>
                            <th className="px-4 py-2 font-semibold text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[
                            { title: 'Aprovar Edital 01/2025', setor: 'PROGEP', status: 'Pendente', badge: 'bg-yellow-100 text-yellow-800' },
                            { title: 'Revisar Planilha Orçamentária', setor: 'PROPLAD', status: 'Em Análise', badge: 'bg-blue-100 text-blue-800' },
                            { title: 'Assinar Ata CONSUN', setor: 'Reitoria', status: 'Concluído', badge: 'bg-green-100 text-green-800' },
                        ].map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600 font-medium">{item.setor}</td>
                                <td className="px-4 py-3 text-gray-800">{item.title}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold border border-transparent ${item.badge}`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="p-3 border-t border-gray-100 text-center bg-gray-50">
                 <button 
                    onClick={() => onNavigate('processes')}
                    className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wide"
                 >
                    Visualizar Todos
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
};