import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  GitBranch, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'documents', icon: FileText, label: 'Documentos' },
  { id: 'processes', icon: GitBranch, label: 'Processos' },
  { id: 'chat', icon: MessageSquare, label: 'Chat IA' },
  { id: 'reports', icon: BarChart3, label: 'Relatórios' },
  { id: 'settings', icon: Settings, label: 'Configurações' },
];

interface DockNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

function DockIcon({ 
  item, 
  isActive, 
  onClick,
  mouseX 
}: { 
  key?: React.Key;
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void;
  mouseX: ReturnType<typeof useMotionValue<number>>;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [50, 70, 50]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const Icon = item.icon;

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      style={{ width, height: width }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.9 }}
      className={`
        relative rounded-2xl flex items-center justify-center transition-colors
        ${isActive 
          ? 'bg-white/20 border border-white/30' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
        }
      `}
    >
      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/70'}`} />
      
      {/* Tooltip */}
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg text-xs text-white/90 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {item.label}
      </span>
      
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
        />
      )}
    </motion.button>
  );
}

export function DockNavigation({ currentPage, onNavigate, onLogout }: DockNavigationProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-end gap-2 px-4 py-3 glass-strong rounded-[28px]">
        {navItems.map((item) => (
          <DockIcon
            key={item.id}
            item={item}
            isActive={currentPage === item.id}
            onClick={() => onNavigate(item.id)}
            mouseX={mouseX}
          />
        ))}
        
        {/* Divider */}
        <div className="w-px h-12 bg-white/20 mx-1" />
        
        {/* Logout */}
        <motion.button
          whileHover={{ y: -8, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLogout}
          className="w-[50px] aspect-square rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-400" />
        </motion.button>
      </div>
    </motion.div>
  );
}
