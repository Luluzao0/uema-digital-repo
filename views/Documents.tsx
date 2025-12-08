import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  FileText,
  FileSpreadsheet,
  Download, 
  Trash2,
  Filter,
  Check,
  Upload,
  Info
} from 'lucide-react';
import { MOCK_DOCS } from '../constants';
import { Document, SectorType } from '../types';
import { Modal } from '../components/Modal';
import { showToast } from '../App';

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCS);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [docData, setDocData] = useState({ title: '', sector: SectorType.PROGEP, type: 'PDF' });

  // Funções
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Auto-preenchimento "Inteligente" simples
      setDocData({ ...docData, title: e.target.files[0].name.split('.')[0] });
    }
  };

  const handleSave = () => {
    if (!file) return;
    const newDoc: Document = {
      id: `d${Date.now()}`,
      title: docData.title,
      type: file.name.endsWith('xlsx') ? 'XLSX' : 'PDF',
      sector: docData.sector,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      status: 'Draft',
      tags: ['Novo'],
      author: 'Você',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
    };
    setDocuments([newDoc, ...documents]);
    
    // Reset
    setIsUploadModalOpen(false);
    setStep(1);
    setFile(null);
    setDocData({ title: '', sector: SectorType.PROGEP, type: 'PDF' });
    showToast('Arquivo salvo com sucesso!');
  };

  const handleDownload = (docTitle: string) => {
      showToast(`Iniciando download de: ${docTitle}`, 'info');
  };

  const filteredDocs = documents.filter(d => {
      const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSector = sectorFilter === 'all' || d.sector === sectorFilter;
      return matchSearch && matchSector;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Ação */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         
         <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
             <div className="relative flex-1 sm:max-w-md">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Pesquisar documento por nome..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>

             <div className="relative w-full sm:w-auto">
                 <select 
                    value={sectorFilter}
                    onChange={e => setSectorFilter(e.target.value)}
                    className="w-full sm:w-40 pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm appearance-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                 >
                     <option value="all">Todos Setores</option>
                     {Object.values(SectorType).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
         </div>

         <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm w-full sm:w-auto justify-center"
         >
            <Plus size={18} /> Novo Documento
         </button>
      </div>

      {/* Lista Simples e Legível */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredDocs.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
                <div className="mb-2">Nenhum documento encontrado.</div>
                <button onClick={() => {setSearchTerm(''); setSectorFilter('all');}} className="text-emerald-600 font-bold text-sm hover:underline">Limpar filtros</button>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nome do Arquivo</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Setor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredDocs.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${doc.type === 'XLSX' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {doc.type === 'XLSX' ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{doc.title}</p>
                                            <p className="text-xs text-slate-500">{doc.size}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600">
                                        {doc.sector}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {doc.createdAt}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        className="text-slate-400 hover:text-emerald-600 p-2" 
                                        title="Baixar"
                                        onClick={() => handleDownload(doc.title)}
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button 
                                        className="text-slate-400 hover:text-red-600 p-2" 
                                        title="Excluir"
                                        onClick={() => {
                                            if(window.confirm('Excluir este arquivo permanentemente?')) {
                                                setDocuments(documents.filter(d => d.id !== doc.id));
                                                showToast('Arquivo excluído', 'info');
                                            }
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Modal Wizard de Upload - Passo a Passo para não ter erro */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Adicionar Documento">
         {step === 1 && (
             <div className="space-y-6 text-center py-4">
                 <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 cursor-pointer hover:bg-slate-100 relative">
                     <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                     <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload size={32} />
                     </div>
                     <p className="font-bold text-slate-700">Clique para selecionar o arquivo</p>
                     <p className="text-sm text-slate-500 mt-1">PDF ou Excel (Máx 10MB)</p>
                 </div>
                 {file && (
                     <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-2 text-emerald-700 text-sm font-bold justify-center">
                         <Check size={16} /> Arquivo selecionado: {file.name}
                     </div>
                 )}
                 <div className="flex justify-end pt-4">
                    <button 
                        disabled={!file}
                        onClick={() => setStep(2)}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continuar
                    </button>
                 </div>
             </div>
         )}

         {step === 2 && (
             <div className="space-y-4 py-2">
                 <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-sm text-blue-700 border border-blue-100">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    <p>Preencha os dados abaixo para que o documento seja encontrado facilmente depois.</p>
                 </div>

                 <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Nome do Documento</label>
                     <input 
                        type="text" 
                        value={docData.title}
                        onChange={e => setDocData({...docData, title: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                     />
                 </div>

                 <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Departamento/Setor</label>
                     <select 
                        value={docData.sector}
                        onChange={e => setDocData({...docData, sector: e.target.value as SectorType})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                     >
                        {Object.values(SectorType).map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                 </div>

                 <div className="flex gap-3 pt-4">
                     <button onClick={() => setStep(1)} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-lg hover:bg-slate-200">Voltar</button>
                     <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md">Salvar Documento</button>
                 </div>
             </div>
         )}
      </Modal>
    </div>
  );
};