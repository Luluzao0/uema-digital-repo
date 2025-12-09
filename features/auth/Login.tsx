import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { storage } from '../../services/storage';
import { CURRENT_USER } from '../../constants';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for blur effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Verificar se já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      await storage.init();
      const isAuth = await storage.isAuthenticated();
      const remembered = localStorage.getItem('uema_remember');
      
      if (isAuth || remembered) {
        onLogin();
      } else {
        const savedEmail = localStorage.getItem('uema_email');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [onLogin]);

  const handleEmailSubmit = () => {
    if (!email) {
      setError('Digite seu email.');
      return;
    }
    if (!email.endsWith('@uema.br')) {
      setError('Use um email institucional (@uema.br).');
      return;
    }
    setError('');
    setStep('password');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') {
      handleEmailSubmit();
      return;
    }
    
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      await storage.setAuthenticated(true);
      await storage.saveUser({
        ...CURRENT_USER,
        email,
        name: email.split('@')[0].replace('.', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      });

      if (rememberMe) {
        localStorage.setItem('uema_remember', 'true');
        localStorage.setItem('uema_email', email);
      } else {
        localStorage.removeItem('uema_remember');
        localStorage.removeItem('uema_email');
      }

      setIsLoading(false);
      onLogin();
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={32} className="text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Animated background gradient following mouse */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: mousePosition.x - 300,
          y: mousePosition.y - 300,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />
      
      {/* Secondary gradient */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div 
            className="inline-flex items-center gap-2 mb-4"
            whileHover={{ scale: 1.05 }}
          >
          </motion.div>
          <h1 className="text-3xl font-bold text-white">
            UEMA <span className="text-blue-400">Digital</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm">Repositório Digital Universitário</p>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          className="glass rounded-3xl p-8"
          layout
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                >
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-300">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {step === 'email' ? (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Email institucional
                    </label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        placeholder="seu.email@uema.br"
                        autoFocus
                      />
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="password-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Show email as badge */}
                  <motion.div 
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Mail size={14} className="text-blue-400" />
                      </div>
                      <span className="text-sm text-white/80">{email}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Alterar
                    </button>
                  </motion.div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        placeholder="Digite sua senha"
                        autoFocus
                      />
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded-lg border border-white/20 bg-white/5 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center">
                          {rememberMe && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </div>
                      </div>
                      Lembrar-me
                    </label>
                    <button 
                      type="button"
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      onClick={() => alert('Funcionalidade em desenvolvimento')}
                    >
                      Esqueci a senha
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  {step === 'email' ? 'Continuar' : 'Entrar'}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Demo hint */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-4 border-t border-white/10 text-center"
          >
            <p className="text-xs text-white/40">
              Demo: use qualquer @uema.br com 6+ caracteres de senha
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center text-xs text-white/30"
        >
          Universidade Estadual do Maranhão © 2025
        </motion.p>
      </motion.div>
    </div>
  );
};