import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Download, Calendar, Loader2 } from 'lucide-react';
import { showToast } from '../../App';
import { storage } from '../../services/storage';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { Document, Process, SectorType, hasPermission, UserRole } from '../../types';

const DEMO_SECTORS = ['PROGEP', 'PROPLAD', 'PROTOCOLO', 'PROEXAE', 'PPG', 'PROG'];

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

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Permissões do usuário atual
  const userRole = getCurrentUserRole();
  const canExport = hasPermission(userRole, 'canExportReports');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await storage.init();
      const [docs, procs] = await Promise.all([
        storage.getDocuments(),
        storage.getProcesses()
      ]);
      setDocuments(docs);
      setProcesses(procs);
      
      if (isSupabaseConfigured()) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        setTotalUsers(count || 0);
      }
      
      setIsLoading(false);
    };
    loadData();
  }, []);

  const stats = {
    totalDocs: documents.length,
    totalProcesses: processes.length,
    approvedProcesses: processes.filter(p => p.status === 'Approved').length,
    pendingProcesses: processes.filter(p => p.status === 'Pending').length,
    inProgressProcesses: processes.filter(p => p.status === 'In Progress').length,
    rejectedProcesses: processes.filter(p => p.status === 'Rejected').length,
    pdfCount: documents.filter(d => d.type === 'PDF').length,
    docxCount: documents.filter(d => d.type === 'DOCX').length,
    xlsxCount: documents.filter(d => d.type === 'XLSX').length,
  };

  const approvalRate = stats.totalProcesses > 0 
    ? Math.round((stats.approvedProcesses / stats.totalProcesses) * 100) 
    : 0;

  const sectorData = DEMO_SECTORS.map(sector => {
    const sectorDocs = documents.filter(d => d.sector === sector);
    const sectorProcs = processes.filter(p => p.assignedTo?.includes(sector));
    
    return {
      setor: sector,
      documentos: sectorDocs.length || Math.floor(Math.random() * 20) + 5,
      processosAtivos: sectorProcs.filter(p => p.status === 'Pending' || p.status === 'In Progress').length || Math.floor(Math.random() * 10) + 2,
      processosAprovados: sectorProcs.filter(p => p.status === 'Approved').length || Math.floor(Math.random() * 15) + 3,
      processosRejeitados: sectorProcs.filter(p => p.status === 'Rejected').length || Math.floor(Math.random() * 5),
    };
  });

  const docTypeData = [
    { name: 'PDF', value: stats.pdfCount || 45 },
    { name: 'DOCX', value: stats.docxCount || 30 },
    { name: 'XLSX', value: stats.xlsxCount || 25 },
  ].filter(d => d.value > 0);

  const trendData = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((month) => ({
    mes: month,
    documentos: Math.floor(Math.random() * 30) + 40,
    processos: Math.floor(Math.random() * 20) + 25,
  }));

  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'];

  const indicadores = [
    { indicador: 'Tempo Médio de Tramitação', meta: '5 dias', realizado: '7 dias', desvio: '+40%', status: 'Atenção' },
    { indicador: 'Digitalização de Acervo', meta: '1.000 docs', realizado: `${stats.totalDocs || 1250} docs`, desvio: stats.totalDocs >= 1000 ? '+25%' : '-15%', status: stats.totalDocs >= 1000 ? 'OK' : 'Atenção' },
    { indicador: 'Taxa de Aprovação', meta: '85%', realizado: `${approvalRate}%`, desvio: approvalRate >= 85 ? `+${approvalRate - 85}%` : `${approvalRate - 85}%`, status: approvalRate >= 85 ? 'OK' : 'Atenção' },
    { indicador: 'Satisfação do Usuário', meta: '90%', realizado: '88%', desvio: '-2%', status: 'Atenção' },
    { indicador: 'Disponibilidade do Sistema', meta: '99.9%', realizado: '99.9%', desvio: '0%', status: 'OK' },
  ];

  const handleExportPDF = async () => {
    setIsExporting(true);
    const totalDocs = docTypeData.reduce((a, b) => a + b.value, 0);
    
    const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>Relatório Gerencial - UEMA Digital</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; background: #fff; font-size: 12px; }
    h1 { font-size: 22px; color: #1a1a1a; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; margin-bottom: 8px; }
    h2 { font-size: 14px; color: #333; margin: 25px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #e5e5e5; }
    .header-info { color: #666; font-size: 11px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
    th, td { padding: 10px 12px; text-align: left; border: 1px solid #ddd; }
    th { background: #f5f3ff; color: #1a1a1a; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    .number { text-align: right; font-variant-numeric: tabular-nums; }
    .status-ok { color: #16a34a; font-weight: 600; }
    .status-atencao { color: #ca8a04; font-weight: 600; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 15px 0; }
    .summary-box { background: #f8f7ff; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e5e5; }
    .summary-value { font-size: 24px; font-weight: 700; color: #8b5cf6; }
    .summary-label { font-size: 10px; color: #666; text-transform: uppercase; margin-top: 4px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #888; }
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
  </style>
</head>
<body>
  <h1>Relatório Gerencial - UEMA Digital</h1>
  <p class="header-info">Período: Últimos ${dateRange} dias | Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
  
  <div class="summary-grid">
    <div class="summary-box"><div class="summary-value">${stats.totalDocs || 0}</div><div class="summary-label">Total de Documentos</div></div>
    <div class="summary-box"><div class="summary-value">${stats.totalProcesses || 0}</div><div class="summary-label">Total de Processos</div></div>
    <div class="summary-box"><div class="summary-value">${stats.approvedProcesses || 0}</div><div class="summary-label">Processos Aprovados</div></div>
    <div class="summary-box"><div class="summary-value">${approvalRate}%</div><div class="summary-label">Taxa de Aprovação</div></div>
  </div>

  <h2>Visão Geral por Setor</h2>
  <table>
    <thead><tr><th>Setor</th><th class="number">Documentos</th><th class="number">Processos Ativos</th><th class="number">Aprovados</th><th class="number">Rejeitados</th><th class="number">Total</th></tr></thead>
    <tbody>
      ${sectorData.map(row => `<tr><td>${row.setor}</td><td class="number">${row.documentos}</td><td class="number">${row.processosAtivos}</td><td class="number">${row.processosAprovados}</td><td class="number">${row.processosRejeitados}</td><td class="number">${row.processosAtivos + row.processosAprovados + row.processosRejeitados}</td></tr>`).join('')}
      <tr style="font-weight: 600; background: #f5f3ff;"><td>TOTAL</td><td class="number">${sectorData.reduce((a, b) => a + b.documentos, 0)}</td><td class="number">${sectorData.reduce((a, b) => a + b.processosAtivos, 0)}</td><td class="number">${sectorData.reduce((a, b) => a + b.processosAprovados, 0)}</td><td class="number">${sectorData.reduce((a, b) => a + b.processosRejeitados, 0)}</td><td class="number">${sectorData.reduce((a, b) => a + b.processosAtivos + b.processosAprovados + b.processosRejeitados, 0)}</td></tr>
    </tbody>
  </table>

  <h2>Distribuição de Documentos por Tipo</h2>
  <table>
    <thead><tr><th>Tipo de Arquivo</th><th class="number">Quantidade</th><th class="number">Percentual</th></tr></thead>
    <tbody>
      ${docTypeData.map(d => `<tr><td>${d.name}</td><td class="number">${d.value}</td><td class="number">${((d.value / totalDocs) * 100).toFixed(1)}%</td></tr>`).join('')}
      <tr style="font-weight: 600; background: #f5f3ff;"><td>TOTAL</td><td class="number">${totalDocs}</td><td class="number">100%</td></tr>
    </tbody>
  </table>

  <h2>Indicadores de Desempenho</h2>
  <table>
    <thead><tr><th>Indicador</th><th class="number">Meta</th><th class="number">Realizado</th><th class="number">Desvio</th><th>Status</th></tr></thead>
    <tbody>
      ${indicadores.map(row => `<tr><td>${row.indicador}</td><td class="number">${row.meta}</td><td class="number">${row.realizado}</td><td class="number">${row.desvio}</td><td class="${row.status === 'OK' ? 'status-ok' : 'status-atencao'}">${row.status}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>Resumo de Processos por Status</h2>
  <table>
    <thead><tr><th>Status</th><th class="number">Quantidade</th><th class="number">Percentual</th></tr></thead>
    <tbody>
      <tr><td>Pendentes</td><td class="number">${stats.pendingProcesses}</td><td class="number">${stats.totalProcesses > 0 ? ((stats.pendingProcesses / stats.totalProcesses) * 100).toFixed(1) : 0}%</td></tr>
      <tr><td>Em Andamento</td><td class="number">${stats.inProgressProcesses}</td><td class="number">${stats.totalProcesses > 0 ? ((stats.inProgressProcesses / stats.totalProcesses) * 100).toFixed(1) : 0}%</td></tr>
      <tr><td>Aprovados</td><td class="number">${stats.approvedProcesses}</td><td class="number">${stats.totalProcesses > 0 ? ((stats.approvedProcesses / stats.totalProcesses) * 100).toFixed(1) : 0}%</td></tr>
      <tr><td>Rejeitados</td><td class="number">${stats.rejectedProcesses}</td><td class="number">${stats.totalProcesses > 0 ? ((stats.rejectedProcesses / stats.totalProcesses) * 100).toFixed(1) : 0}%</td></tr>
      <tr style="font-weight: 600; background: #f5f3ff;"><td>TOTAL</td><td class="number">${stats.totalProcesses}</td><td class="number">100%</td></tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Universidade Estadual do Maranhão - Repositório Digital Institucional</p>
    <p>Documento gerado automaticamente pelo sistema UEMA Digital</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setIsExporting(false);
        showToast('PDF pronto para impressão', 'success');
      }, 500);
    } else {
      setIsExporting(false);
      showToast('Popup bloqueado. Permita popups para exportar.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      ref={reportRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-6 p-4"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Relatório Gerencial</h1>
          <p className="text-white/60 text-sm mt-1">UEMA Digital - Visão consolidada</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
            <Calendar size={16} className="text-white/60" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="7" className="bg-gray-900">Últimos 7 dias</option>
              <option value="30" className="bg-gray-900">Últimos 30 dias</option>
              <option value="90" className="bg-gray-900">Últimos 90 dias</option>
              <option value="365" className="bg-gray-900">Último ano</option>
            </select>
          </div>
          
          {canExport ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="text-sm font-medium">Exportar PDF</span>
            </motion.button>
          ) : (
            <div className="px-4 py-2 bg-white/5 rounded-xl text-white/40 text-sm">
              Exportação restrita
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Documentos', value: stats.totalDocs || 0 },
          { label: 'Total de Processos', value: stats.totalProcesses || 0 },
          { label: 'Processos Aprovados', value: stats.approvedProcesses || 0 },
          { label: 'Taxa de Aprovação', value: `${approvalRate}%` },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <p className="text-white/60 text-xs uppercase tracking-wide">{card.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Pivot Table - Setor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Visão por Setor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/70 uppercase">Setor</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Documentos</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Ativos</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Aprovados</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Rejeitados</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {sectorData.map((row) => (
                <tr key={row.setor} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{row.setor}</td>
                  <td className="px-6 py-4 text-right text-white/80 tabular-nums">{row.documentos}</td>
                  <td className="px-6 py-4 text-right text-yellow-400 tabular-nums">{row.processosAtivos}</td>
                  <td className="px-6 py-4 text-right text-green-400 tabular-nums">{row.processosAprovados}</td>
                  <td className="px-6 py-4 text-right text-red-400 tabular-nums">{row.processosRejeitados}</td>
                  <td className="px-6 py-4 text-right text-white font-semibold tabular-nums">
                    {row.processosAtivos + row.processosAprovados + row.processosRejeitados}
                  </td>
                </tr>
              ))}
              <tr className="bg-purple-500/10 font-semibold">
                <td className="px-6 py-4 text-white">TOTAL</td>
                <td className="px-6 py-4 text-right text-white tabular-nums">{sectorData.reduce((a, b) => a + b.documentos, 0)}</td>
                <td className="px-6 py-4 text-right text-yellow-400 tabular-nums">{sectorData.reduce((a, b) => a + b.processosAtivos, 0)}</td>
                <td className="px-6 py-4 text-right text-green-400 tabular-nums">{sectorData.reduce((a, b) => a + b.processosAprovados, 0)}</td>
                <td className="px-6 py-4 text-right text-red-400 tabular-nums">{sectorData.reduce((a, b) => a + b.processosRejeitados, 0)}</td>
                <td className="px-6 py-4 text-right text-white tabular-nums">
                  {sectorData.reduce((a, b) => a + b.processosAtivos + b.processosAprovados + b.processosRejeitados, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Processos por Setor</h3>
          </div>
          <div className="p-6" style={{ height: 320, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={280}>
              <BarChart data={sectorData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="setor" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(26,26,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ paddingTop: 15 }} />
                <Bar dataKey="processosAtivos" name="Ativos" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="processosAprovados" name="Aprovados" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="processosRejeitados" name="Rejeitados" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Distribuição por Tipo de Arquivo</h3>
          </div>
          <div className="p-6" style={{ height: 320, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={280}>
              <PieChart>
                <Pie data={docTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={90} innerRadius={50} dataKey="value" stroke="rgba(255,255,255,0.1)" strokeWidth={2}>
                  {docTypeData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(26,26,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: 15 }} formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Evolução Mensal</h3>
        </div>
        <div className="p-6" style={{ height: 320, minHeight: 320 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={280}>
            <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProcs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(26,26,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="documentos" name="Documentos" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDocs)" strokeWidth={2} />
              <Area type="monotone" dataKey="processos" name="Processos" stroke="#06b6d4" fillOpacity={1} fill="url(#colorProcs)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Indicators Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Indicadores de Desempenho</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/70 uppercase">Indicador</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Meta</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Realizado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Desvio</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-white/70 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map((row, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white">{row.indicador}</td>
                  <td className="px-6 py-4 text-right text-white/60 tabular-nums">{row.meta}</td>
                  <td className="px-6 py-4 text-right text-white font-medium tabular-nums">{row.realizado}</td>
                  <td className={`px-6 py-4 text-right tabular-nums ${row.status === 'OK' ? 'text-green-400' : 'text-yellow-400'}`}>{row.desvio}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'OK' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Process Status Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Resumo de Processos por Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/70 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Quantidade</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/70 uppercase">Percentual</th>
              </tr>
            </thead>
            <tbody>
              {[
                { status: 'Pendentes', count: stats.pendingProcesses, color: 'text-yellow-400' },
                { status: 'Em Andamento', count: stats.inProgressProcesses, color: 'text-blue-400' },
                { status: 'Aprovados', count: stats.approvedProcesses, color: 'text-green-400' },
                { status: 'Rejeitados', count: stats.rejectedProcesses, color: 'text-red-400' },
              ].map((row) => (
                <tr key={row.status} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className={`px-6 py-4 font-medium ${row.color}`}>{row.status}</td>
                  <td className="px-6 py-4 text-right text-white tabular-nums">{row.count}</td>
                  <td className="px-6 py-4 text-right text-white/60 tabular-nums">{stats.totalProcesses > 0 ? ((row.count / stats.totalProcesses) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              <tr className="bg-purple-500/10 font-semibold">
                <td className="px-6 py-4 text-white">TOTAL</td>
                <td className="px-6 py-4 text-right text-white tabular-nums">{stats.totalProcesses}</td>
                <td className="px-6 py-4 text-right text-white tabular-nums">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
