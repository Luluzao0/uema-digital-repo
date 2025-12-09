import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Download, Printer, RefreshCw, Calendar, Filter, Loader2, TrendingUp, TrendingDown, FileText, Users, CheckCircle, Clock } from 'lucide-react';
import { showToast } from '../../App';
import { storage } from '../../services/storage';
import { Document, Process, SectorType } from '../../types';

// Card de estatística animado
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
}> = ({ title, value, change, trend, icon, gradient, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br ${gradient} border border-white/10`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl">
            {icon}
          </div>
          {change && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change}
            </div>
          )}
        </div>
        
        <h3 className="text-white/60 text-sm mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
};

// Card de gráfico glassmorphism
const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ title, children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-semibold">{title}</h3>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
        >
          <RefreshCw size={16} />
        </motion.button>
      </div>
      <div className="p-6 h-80">
        {children}
      </div>
    </motion.div>
  );
};

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

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
      setIsLoading(false);
    };
    loadData();
  }, []);

  const processData = Object.values(SectorType).slice(0, 4).map(sector => ({
    name: sector.slice(0, 8),
    pendente: processes.filter(p => p.status === 'Pending').length || Math.floor(Math.random() * 10) + 5,
    aprovado: processes.filter(p => p.status === 'Approved').length || Math.floor(Math.random() * 20) + 10,
    rejeitado: processes.filter(p => p.status === 'Rejected').length || Math.floor(Math.random() * 5) + 2,
  }));

  const docTypeData = [
    { name: 'PDF', value: documents.filter(d => d.type === 'PDF').length || 45 },
    { name: 'DOCX', value: documents.filter(d => d.type === 'DOCX').length || 30 },
    { name: 'XLSX', value: documents.filter(d => d.type === 'XLSX').length || 25 },
  ].filter(d => d.value > 0);

  if (docTypeData.length === 0) {
    docTypeData.push({ name: 'PDF', value: 45 }, { name: 'DOCX', value: 30 }, { name: 'XLSX', value: 25 });
  }

  const trendData = [
    { month: 'Jan', docs: 45, procs: 30 },
    { month: 'Fev', docs: 52, procs: 35 },
    { month: 'Mar', docs: 48, procs: 40 },
    { month: 'Abr', docs: 61, procs: 45 },
    { month: 'Mai', docs: 55, procs: 42 },
    { month: 'Jun', docs: 67, procs: 50 },
  ];

  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'];

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório UEMA Digital - ${new Date().toLocaleDateString('pt-BR')}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #fff; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); }
          h1 { color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 15px; font-size: 28px; }
          h2 { color: #a78bfa; margin-top: 35px; font-size: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; }
          th, td { padding: 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
          th { background: rgba(139,92,246,0.3); color: #fff; font-weight: 600; }
          tr:hover { background: rgba(255,255,255,0.05); }
          .stats { display: flex; gap: 20px; margin: 30px 0; flex-wrap: wrap; }
          .stat-box { background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2)); padding: 25px; border-radius: 16px; flex: 1; min-width: 150px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
          .stat-value { font-size: 32px; font-weight: bold; color: #8b5cf6; }
          .stat-label { font-size: 13px; color: rgba(255,255,255,0.6); text-transform: uppercase; margin-top: 5px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.4); padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
          @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
        </style>
      </head>
      <body>
        <h1>📊 Relatório Gerencial - UEMA Digital</h1>
        <p style="color: rgba(255,255,255,0.6);"><strong>Período:</strong> Últimos ${dateRange} dias | <strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        
        <div class="stats">
          <div class="stat-box">
            <div class="stat-value">${documents.length || 0}</div>
            <div class="stat-label">Documentos</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${processes.length || 0}</div>
            <div class="stat-label">Processos</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${processes.filter(p => p.status === 'Approved').length || 0}</div>
            <div class="stat-label">Aprovados</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${processes.filter(p => p.status === 'Pending').length || 0}</div>
            <div class="stat-label">Pendentes</div>
          </div>
        </div>

        <h2>📁 Documentos por Tipo</h2>
        <table>
          <thead><tr><th>Tipo</th><th>Quantidade</th><th>Percentual</th></tr></thead>
          <tbody>
            ${docTypeData.map(d => `
              <tr>
                <td>${d.name}</td>
                <td>${d.value}</td>
                <td>${((d.value / docTypeData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>📋 Indicadores de Desempenho</h2>
        <table>
          <thead><tr><th>Indicador</th><th>Meta</th><th>Realizado</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Tempo Médio de Tramitação</td><td>5 dias</td><td>7 dias</td><td>⚠️</td></tr>
            <tr><td>Digitalização de Acervo</td><td>1000 docs</td><td>${documents.length || 1250} docs</td><td>✅</td></tr>
            <tr><td>Satisfação do Usuário</td><td>90%</td><td>88%</td><td>⚠️</td></tr>
            <tr><td>Disponibilidade do Sistema</td><td>99.9%</td><td>99.9%</td><td>✅</td></tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Universidade Estadual do Maranhão - Repositório Digital</p>
          <p>Documento gerado automaticamente pelo sistema</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setIsExporting(false);
        showToast('PDF pronto! Use "Salvar como PDF" na impressora.', 'success');
      }, 500);
    } else {
      setIsExporting(false);
      showToast('Popup bloqueado. Permita popups para exportar.', 'error');
    }
  };

  const indicators = [
    { name: 'Tempo Médio de Tramitação', meta: '5 dias', real: '7 dias', desvio: '+40%', status: 'warning' as const },
    { name: 'Digitalização de Acervo', meta: '1000 docs', real: `${documents.length || 1250} docs`, desvio: '+25%', status: 'success' as const },
    { name: 'Satisfação do Usuário', meta: '90%', real: '88%', desvio: '-2%', status: 'warning' as const },
    { name: 'Disponibilidade do Sistema', meta: '99.9%', real: '99.9%', desvio: '0%', status: 'success' as const },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header com filtros */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl"
      >
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs text-white/60 font-medium">Período</label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
              <Calendar size={16} className="text-white/60" />
              <select 
                className="bg-transparent text-white text-sm outline-none cursor-pointer"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7" className="bg-[#1a1a2e]">Últimos 7 dias</option>
                <option value="30" className="bg-[#1a1a2e]">Últimos 30 dias</option>
                <option value="90" className="bg-[#1a1a2e]">Último Trimestre</option>
                <option value="365" className="bg-[#1a1a2e]">Este Ano</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-white/60 font-medium">Unidade</label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
              <Filter size={16} className="text-white/60" />
              <select className="bg-transparent text-white text-sm outline-none cursor-pointer">
                <option className="bg-[#1a1a2e]">Todas Unidades</option>
                <option className="bg-[#1a1a2e]">Campus São Luís</option>
                <option className="bg-[#1a1a2e]">Campus Caxias</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            <span className="text-sm font-medium">Imprimir</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="text-sm font-medium">Exportar PDF</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Documentos"
          value={documents.length || 156}
          change="+12%"
          trend="up"
          icon={<FileText size={20} className="text-white" />}
          gradient="from-purple-500/20 to-purple-600/20"
          delay={0}
        />
        <StatCard
          title="Processos Ativos"
          value={processes.length || 48}
          change="+8%"
          trend="up"
          icon={<Clock size={20} className="text-white" />}
          gradient="from-blue-500/20 to-cyan-500/20"
          delay={0.1}
        />
        <StatCard
          title="Taxa de Aprovação"
          value="87%"
          change="+5%"
          trend="up"
          icon={<CheckCircle size={20} className="text-white" />}
          gradient="from-green-500/20 to-emerald-500/20"
          delay={0.2}
        />
        <StatCard
          title="Usuários Ativos"
          value={24}
          change="-2%"
          trend="down"
          icon={<Users size={20} className="text-white" />}
          gradient="from-orange-500/20 to-amber-500/20"
          delay={0.3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Processos por Setor" delay={0.2}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(26,26,46,0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}
                itemStyle={{ color: '#fff', fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Bar dataKey="pendente" name="Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aprovado" name="Aprovado" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejeitado" name="Rejeitado" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição por Tipo de Arquivo" delay={0.3}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={docTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={2}
              >
                {docTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(26,26,46,0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px' 
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Trend Chart */}
      <ChartCard title="Evolução Mensal" delay={0.4}>
        <ResponsiveContainer width="100%" height="100%">
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
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(26,26,46,0.95)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="docs" name="Documentos" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDocs)" strokeWidth={2} />
            <Area type="monotone" dataKey="procs" name="Processos" stroke="#06b6d4" fillOpacity={1} fill="url(#colorProcs)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Indicators Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Indicadores de Desempenho</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs text-white/60 font-semibold uppercase tracking-wider">Indicador</th>
                <th className="px-6 py-4 text-right text-xs text-white/60 font-semibold uppercase tracking-wider">Meta</th>
                <th className="px-6 py-4 text-right text-xs text-white/60 font-semibold uppercase tracking-wider">Realizado</th>
                <th className="px-6 py-4 text-right text-xs text-white/60 font-semibold uppercase tracking-wider">Desvio</th>
                <th className="px-6 py-4 text-center text-xs text-white/60 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-medium">{row.name}</td>
                  <td className="px-6 py-4 text-right text-white/60">{row.meta}</td>
                  <td className="px-6 py-4 text-right text-white font-semibold">{row.real}</td>
                  <td className={`px-6 py-4 text-right text-sm font-medium ${
                    row.status === 'success' ? 'text-green-400' : 'text-yellow-400'
                  }`}>{row.desvio}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      row.status === 'success' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {row.status === 'success' ? 'OK' : 'Atenção'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};