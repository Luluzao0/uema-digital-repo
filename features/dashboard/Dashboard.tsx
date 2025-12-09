import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Loader2,
  GitPullRequest,
  MessageSquare,
  TrendingUp,
  Calendar,
  Sparkles,
  RefreshCw,
  Users,
  Activity
} from 'lucide-react';
import { ViewState, Document, Process } from '../../types';
import { storage } from '../../services/storage';
import { supabase, realtimeService, isSupabaseConfigured } from '../../services/supabase';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

// Magnetic Widget Component
const MagneticWidget = ({ 
  children, 
  className = '',
  gradient = '',
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  gradient?: string;
  onClick?: () => void;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  
  const rotateX = useTransform(springY, [-50, 50], [5, -5]);
  const rotateY = useTransform(springX, [-50, 50], [-5, 5]);

  const handleMouse = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const resetMouse = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass rounded-3xl p-6 cursor-pointer transition-colors hover:bg-white/10 ${gradient} ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  gradient,
  trend,
  onClick 
}: { 
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  trend?: string;
  onClick?: () => void;
}) => (
  <MagneticWidget gradient={gradient} onClick={onClick}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-white/60 mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400">{trend}</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </MagneticWidget>
);

// Time Display Component
const TimeDisplay = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="text-center">
      <p className="text-6xl font-light text-white tracking-tight">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-white/50 mt-2">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [stats, setStats] = useState({
    pendingDocs: 0,
    activeProcesses: 0,
    completedProcesses: 0,
    totalUsers: 0,
    docsThisMonth: 0,
    procsThisMonth: 0
  });

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    await storage.init();
    
    const [docs, procs] = await Promise.all([
      storage.getDocuments(),
      storage.getProcesses()
    ]);
    
    setDocuments(docs);
    setProcesses(procs);
    
    // Calcular estatísticas
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const docsThisMonth = docs.filter(d => new Date(d.createdAt) >= firstDayOfMonth).length;
    const procsThisMonth = procs.filter(p => new Date(p.lastUpdate) >= firstDayOfMonth).length;
    
    // Buscar contagem de usuários se Supabase configurado
    let totalUsers = 0;
    if (isSupabaseConfigured()) {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      totalUsers = count || 0;
    }
    
    setStats({
      pendingDocs: docs.filter(d => d.status === 'Draft').length,
      activeProcesses: procs.filter(p => p.status === 'Pending' || p.status === 'In Progress').length,
      completedProcesses: procs.filter(p => p.status === 'Approved').length,
      totalUsers,
      docsThisMonth,
      procsThisMonth
    });
    
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
    
    // Inscrever para atualizações em tempo real
    let docsChannel: any;
    let procsChannel: any;
    
    if (isSupabaseConfigured()) {
      docsChannel = realtimeService.subscribeToDocuments((payload) => {
        console.log('Document change:', payload);
        loadData(true);
      });
      
      procsChannel = realtimeService.subscribeToProcesses((payload) => {
        console.log('Process change:', payload);
        loadData(true);
      });
    }
    
    return () => {
      if (docsChannel) realtimeService.unsubscribe(docsChannel);
      if (procsChannel) realtimeService.unsubscribe(procsChannel);
    };
  }, []);

  // Recent tasks
  const recentTasks = [
    ...processes
      .filter(p => p.status === 'Pending' || p.status === 'In Progress')
      .slice(0, 3)
      .map(p => ({
        title: p.title,
        setor: p.assignedTo,
        status: p.status === 'Pending' ? 'Pendente' : 'Em Análise',
        color: p.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400',
        type: 'process' as const
      })),
    ...documents
      .filter(d => d.status === 'Draft')
      .slice(0, 2)
      .map(d => ({
        title: d.title,
        setor: d.sector,
        status: 'Rascunho',
        color: 'bg-white/10 text-white/60',
        type: 'document' as const
      }))
  ].slice(0, 4);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Bem-vindo ao <span className="text-blue-400">UEMA Digital</span>
          </h1>
          <p className="text-white/50">Gerencie seus documentos e processos com facilidade</p>
        </div>
        <div className="flex items-center gap-3">
          {isSupabaseConfigured() && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Tempo Real</span>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={`text-white/70 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Time Widget - Large */}
        <motion.div variants={itemVariants} className="lg:col-span-2 lg:row-span-2">
          <MagneticWidget className="h-full flex flex-col justify-center gradient-blue">
            <TimeDisplay />
            <div className="flex items-center justify-center gap-2 mt-6">
              <Calendar className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/40">São Luís, MA</span>
            </div>
          </MagneticWidget>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <StatCard
            label="Total de Documentos"
            value={documents.length}
            icon={FileText}
            gradient="gradient-blue"
            trend={stats.docsThisMonth > 0 ? `+${stats.docsThisMonth} este mês` : undefined}
            onClick={() => onNavigate('documents')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <StatCard
            label="Documentos Pendentes"
            value={stats.pendingDocs}
            icon={Clock}
            gradient="gradient-orange"
            onClick={() => onNavigate('documents')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <StatCard
            label="Processos Ativos"
            value={stats.activeProcesses}
            icon={GitPullRequest}
            gradient="gradient-purple"
            trend={stats.procsThisMonth > 0 ? `+${stats.procsThisMonth} este mês` : undefined}
            onClick={() => onNavigate('processes')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <StatCard
            label="Concluídos"
            value={stats.completedProcesses}
            icon={CheckCircle2}
            gradient="gradient-green"
            onClick={() => onNavigate('processes')}
          />
        </motion.div>

        {stats.totalUsers > 0 && (
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <StatCard
              label="Usuários Ativos"
              value={stats.totalUsers}
              icon={Users}
              gradient="gradient-cyan"
            />
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="glass rounded-3xl p-6 h-full">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('documents')}
                className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Novo Documento</span>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('processes')}
                className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <GitPullRequest className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Novo Processo</span>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('chat')}
                className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Assistente IA</span>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <div className="glass rounded-3xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Tarefas Recentes</h3>
              <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/60">Hoje</span>
            </div>
            
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-white/60">Nenhuma tarefa pendente</p>
                <p className="text-white/40 text-sm">Você está em dia! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                    onClick={() => onNavigate(task.type === 'process' ? 'processes' : 'documents')}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        {task.type === 'process' ? (
                          <GitPullRequest className="w-5 h-5 text-blue-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-white/60" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <p className="text-xs text-white/50">{task.setor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${task.color}`}>
                        {task.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('processes')}
              className="w-full mt-4 py-3 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todas as tarefas →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};