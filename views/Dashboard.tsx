import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search,
  ArrowRight
} from 'lucide-react';
import { ViewState } from '../types';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ onNavigate }) => {
  const StatCard = ({ label, value, desc, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
       <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          <p className="text-xs text-slate-400 mt-2">{desc}</p>
       </div>
       <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} />
       </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Mensagem de Boas-vindas */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Olá, Luis Guilherme.</h2>
        <p className="text-slate-500">Aqui está o resumo das atividades hoje.</p>
      </div>

      {/* Cards de Métricas - Fáceis de ler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            label="Documentos Pendentes" 
            value="3" 
            desc="Necessitam sua revisão" 
            icon={Clock} 
            color="bg-amber-100 text-amber-600" 
        />
        <StatCard 
            label="Processos Ativos" 
            value="12" 
            desc="Em trâmite na PROGEP" 
            icon={FileText} 
            color="bg-blue-100 text-blue-600" 
        />
        <StatCard 
            label="Concluídos (Mês)" 
            value="45" 
            desc="+10% que mês passado" 
            icon={CheckCircle2} 
            color="bg-emerald-100 text-emerald-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Ações Rápidas - O que o usuário quer fazer 90% das vezes */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Acesso Rápido</h3>
            <div className="space-y-3">
                <button 
                    onClick={() => onNavigate('documents')}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-lg transition-all group text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-md shadow-sm border border-slate-100 group-hover:border-emerald-200">
                             <Plus size={20} className="text-emerald-600" />
                        </div>
                        <span className="font-semibold text-slate-700 group-hover:text-emerald-700">Novo Documento</span>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-500" />
                </button>
                
                <button 
                    onClick={() => onNavigate('processes')}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg transition-all group text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-md shadow-sm border border-slate-100 group-hover:border-blue-200">
                             <Search size={20} className="text-blue-600" />
                        </div>
                        <span className="font-semibold text-slate-700 group-hover:text-blue-700">Consultar Processo</span>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500" />
                </button>
            </div>
         </div>

         {/* Lista de "Minhas Tarefas" Simplificada */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Tarefas Recentes</h3>
                <span className="text-xs font-medium text-slate-500">Atualizado agora</span>
            </div>
            <div className="divide-y divide-slate-100">
                {[
                    { title: 'Aprovar Edital 01/2025', setor: 'PROGEP', status: 'Pendente', color: 'text-amber-600 bg-amber-50' },
                    { title: 'Revisar Planilha Orçamentária', setor: 'PROPLAD', status: 'Em Análise', color: 'text-blue-600 bg-blue-50' },
                    { title: 'Assinar Ata CONSUN', setor: 'Reitoria', status: 'Concluído', color: 'text-emerald-600 bg-emerald-50' },
                ].map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                {item.setor.substring(0, 1)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                                <p className="text-xs text-slate-500">{item.setor} • Hoje</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.color}`}>
                            {item.status}
                        </span>
                    </div>
                ))}
            </div>
             <div className="p-4 border-t border-slate-100 text-center">
                 <button 
                    onClick={() => onNavigate('processes')}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                 >
                    Ver todas as tarefas
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
};