import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, Printer, RefreshCw, Calendar, Filter } from 'lucide-react';
import { showToast } from '../../App';

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  
  // Mock Data
  const processData = [
    { name: 'PROGEP', pendente: 4, aprovado: 24, rejeitado: 2 },
    { name: 'PROPLAD', pendente: 10, aprovado: 15, rejeitado: 5 },
    { name: 'PROEXAE', pendente: 2, aprovado: 12, rejeitado: 1 },
    { name: 'PPG', pendente: 5, aprovado: 8, rejeitado: 0 },
    { name: 'PROG', pendente: 1, aprovado: 20, rejeitado: 3 },
  ];

  const docTypeData = [
    { name: 'PDF', value: 400 },
    { name: 'DOCX', value: 300 },
    { name: 'XLSX', value: 300 },
    { name: 'IMG', value: 100 },
  ];

  const COLORS = ['#3c8dbc', '#00a65a', '#f39c12', '#dd4b39'];

  const handleExport = (format: string) => {
    showToast(`Relatório exportado em ${format} com sucesso.`);
  };

  return (
    <div className="space-y-6">
      {/* Filters Box */}
      <div className="bg-white border-t-2 border-gray-300 rounded-sm shadow-sm p-4">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
              <div className="flex gap-4 w-full md:w-auto">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Período</label>
                      <div className="flex items-center bg-gray-50 border border-gray-300 rounded-sm px-2 py-1.5">
                          <Calendar size={14} className="text-gray-500 mr-2" />
                          <select 
                            className="bg-transparent text-sm outline-none w-32"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                          >
                              <option value="7">Últimos 7 dias</option>
                              <option value="30">Últimos 30 dias</option>
                              <option value="90">Último Trimestre</option>
                              <option value="365">Este Ano</option>
                          </select>
                      </div>
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Unidade</label>
                      <div className="flex items-center bg-gray-50 border border-gray-300 rounded-sm px-2 py-1.5">
                          <Filter size={14} className="text-gray-500 mr-2" />
                          <select className="bg-transparent text-sm outline-none w-40">
                              <option>Todas Unidades</option>
                              <option>Campus São Luís</option>
                              <option>Campus Caxias</option>
                              <option>Campus Imperatriz</option>
                          </select>
                      </div>
                  </div>
              </div>

              <div className="flex gap-2">
                  <button className="flex items-center gap-1 bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-sm hover:bg-gray-200 text-xs font-bold" onClick={() => handleExport('PRINT')}>
                      <Printer size={14} /> IMPRIMIR
                  </button>
                  <button className="flex items-center gap-1 bg-[#3c8dbc] text-white px-3 py-1.5 rounded-sm hover:bg-[#367fa9] text-xs font-bold" onClick={() => handleExport('PDF')}>
                      <Download size={14} /> EXPORTAR PDF
                  </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Processos */}
          <div className="bg-white border-t-2 border-[#3c8dbc] rounded-sm shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Processos por Setor</h3>
                  <button className="text-gray-400 hover:text-gray-600"><RefreshCw size={14} /></button>
              </div>
              <div className="p-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 12}} />
                          <YAxis tick={{fontSize: 12}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: 0, border: '1px solid #ddd' }}
                            itemStyle={{ fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="pendente" name="Pendente" stackId="a" fill="#f39c12" />
                          <Bar dataKey="aprovado" name="Aprovado" stackId="a" fill="#00a65a" />
                          <Bar dataKey="rejeitado" name="Rejeitado" stackId="a" fill="#dd4b39" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Chart 2: Tipos de Arquivo */}
          <div className="bg-white border-t-2 border-[#dd4b39] rounded-sm shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Ocupação de Disco por Tipo</h3>
                  <button className="text-gray-400 hover:text-gray-600"><RefreshCw size={14} /></button>
              </div>
              <div className="p-4 h-80 flex items-center justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={docTypeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                          >
                              {docTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #ddd' }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-sm">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-700 uppercase">Detalhamento Operacional</h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-striped">
                  <thead className="bg-gray-100 text-gray-600 border-b border-gray-300">
                      <tr>
                          <th className="px-4 py-2 text-xs uppercase font-bold">Indicador</th>
                          <th className="px-4 py-2 text-xs uppercase font-bold text-right">Meta</th>
                          <th className="px-4 py-2 text-xs uppercase font-bold text-right">Realizado</th>
                          <th className="px-4 py-2 text-xs uppercase font-bold text-right">Desvio</th>
                          <th className="px-4 py-2 text-xs uppercase font-bold text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {[
                          { name: 'Tempo Médio de Tramitação', meta: '5 dias', real: '7 dias', desvio: '+40%', status: 'Ruim', color: 'bg-red-500' },
                          { name: 'Digitalização de Acervo', meta: '1000 docs', real: '1250 docs', desvio: '+25%', status: 'Bom', color: 'bg-green-500' },
                          { name: 'Satisfação do Usuário', meta: '90%', real: '88%', desvio: '-2%', status: 'Médio', color: 'bg-yellow-500' },
                          { name: 'Disponibilidade do Sistema', meta: '99.9%', real: '99.9%', desvio: '0%', status: 'Bom', color: 'bg-green-500' },
                      ].map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium text-gray-700">{row.name}</td>
                              <td className="px-4 py-2 text-right text-gray-600">{row.meta}</td>
                              <td className="px-4 py-2 text-right font-bold text-gray-800">{row.real}</td>
                              <td className={`px-4 py-2 text-right text-xs font-bold ${row.desvio.includes('+') && row.status === 'Ruim' ? 'text-red-600' : 'text-green-600'}`}>{row.desvio}</td>
                              <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-0.5 text-[10px] text-white rounded-sm font-bold uppercase ${row.color}`}>
                                      {row.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};