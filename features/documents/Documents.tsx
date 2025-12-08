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
import { MOCK_DOCS } from '../../constants';
import { Document, SectorType } from '../../types';
import { Modal } from '../../components/Modal';
import { showToast } from '../../App';

export const Documents: React.FC = () => {
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
    setIsUploadModalOpen(false);
    setStep(1);
    setFile(null);
    setDocData({ title: '', sector: SectorType.PROGEP, type: 'PDF' });
    showToast('Arquivo salvo com sucesso!');
  };

  const handleDownload = (docTitle: string) => {
      showToast(`Iniciando download: ${docTitle}`, 'info');
  };

  const filteredDocs = documents.filter(d => {
      const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSector = sectorFilter === 'all' || d.sector === sectorFilter;
      return matchSearch && matchSector;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas Estilo Box */}
      <div className="bg-white p-3 border-t-2 border-gray-300 rounded-sm shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
         <div className="flex gap-2 w-full md:w-auto">
             <div className="flex items-center border border-gray-300 bg-gray-50 px-2 py-1 rounded-sm w-full md:w-64">
                <input 
                    type="text" 
                    placeholder="Filtrar por nome..." 
                    className="bg-transparent text-sm w-full outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Search size={14} className="text-gray-500" />
             </div>

             <select 
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="border border-gray-300 bg-white text-sm px-2 py-1 rounded-sm outline-none"
             >
                 <option value="all">Todos Setores</option>
                 {Object.values(SectorType).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
         </div>

         <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1 bg-[#00a65a] hover:bg-[#008d4c] text-white px-3 py-1.5 rounded-sm font-bold text-xs shadow-sm"
         >
            <Plus size={14} /> NOVO ARQUIVO
         </button>
      </div>

      {/* Tabela de Dados (Data Grid) */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-sm">
        <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Listagem de Documentos</h3>
        </div>
        
        {filteredDocs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
                Nenhum registro encontrado.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm table-striped">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-300">
                        <tr>
                            <th className="px-4 py-2 font-bold uppercase text-xs">Tipo</th>
                            <th className="px-4 py-2 font-bold uppercase text-xs">Nome do Arquivo</th>
                            <th className="px-4 py-2 font-bold uppercase text-xs">Setor</th>
                            <th className="px-4 py-2 font-bold uppercase text-xs">Data</th>
                            <th className="px-4 py-2 font-bold uppercase text-xs text-right">Opções</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredDocs.map((doc, idx) => (
                            <tr key={doc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}>
                                <td className="px-4 py-2 w-12 text-center">
                                    {doc.type === 'XLSX' 
                                        ? <FileSpreadsheet size={16} className="text-green-600" /> 
                                        : <FileText size={16} className="text-red-600" />
                                    }
                                </td>
                                <td className="px-4 py-2">
                                    <div className="font-semibold text-gray-800">{doc.title}</div>
                                    <div className="text-[10px] text-gray-500">{doc.size}</div>
                                </td>
                                <td className="px-4 py-2">
                                    <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-bold border border-gray-300">
                                        {doc.sector}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                    {doc.createdAt}
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button 
                                            className="bg-blue-50 text-blue-600 border border-blue-200 p-1 rounded-sm hover:bg-blue-100" 
                                            title="Baixar"
                                            onClick={() => handleDownload(doc.title)}
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button 
                                            className="bg-red-50 text-red-600 border border-red-200 p-1 rounded-sm hover:bg-red-100" 
                                            title="Excluir"
                                            onClick={() => {
                                                if(window.confirm('Confirma exclusão?')) {
                                                    setDocuments(documents.filter(d => d.id !== doc.id));
                                                }
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Modal - Estilo Bootstrap 3 */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload de Arquivo">
         {step === 1 && (
             <div className="text-center py-4">
                 <div className="border-2 border-dashed border-gray-300 p-6 bg-gray-50 cursor-pointer hover:bg-white relative rounded-sm">
                     <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                     <div className="mb-2 text-gray-400">
                        <Upload size={32} className="mx-auto" />
                     </div>
                     <p className="font-bold text-gray-600 text-sm">Selecionar Arquivo</p>
                     <p className="text-xs text-gray-500">Extensões permitidas: .pdf, .xlsx</p>
                 </div>
                 {file && (
                     <div className="mt-3 bg-green-50 border border-green-200 text-green-700 p-2 text-xs font-bold rounded-sm">
                         {file.name}
                     </div>
                 )}
                 <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                    <button 
                        disabled={!file}
                        onClick={() => setStep(2)}
                        className="bg-[#3c8dbc] text-white px-4 py-2 rounded-sm font-bold text-sm hover:bg-[#367fa9] disabled:opacity-50"
                    >
                        Próximo &gt;
                    </button>
                 </div>
             </div>
         )}

         {step === 2 && (
             <div className="space-y-3 py-2">
                 <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800">
                    <p>Complete os metadados do arquivo.</p>
                 </div>

                 <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-700 uppercase">Nome do Documento</label>
                     <input 
                        type="text" 
                        value={docData.title}
                        onChange={e => setDocData({...docData, title: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-sm text-sm focus:border-blue-400 outline-none"
                     />
                 </div>

                 <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-700 uppercase">Setor</label>
                     <select 
                        value={docData.sector}
                        onChange={e => setDocData({...docData, sector: e.target.value as SectorType})}
                        className="w-full p-2 border border-gray-300 rounded-sm text-sm bg-white outline-none"
                     >
                        {Object.values(SectorType).map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                 </div>

                 <div className="flex gap-2 pt-4 border-t border-gray-100 mt-2">
                     <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-200 rounded-sm hover:bg-gray-200 text-sm font-semibold">Voltar</button>
                     <button onClick={handleSave} className="px-4 py-2 bg-[#00a65a] text-white font-bold rounded-sm hover:bg-[#008d4c] text-sm flex-1">Finalizar Upload</button>
                 </div>
             </div>
         )}
      </Modal>
    </div>
  );
};