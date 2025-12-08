import React from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg shadow-emerald-600/20">
            U
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Repositório Digital UEMA</h1>
          <p className="text-slate-500 mt-2">Acesso restrito a servidores e docentes.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">E-mail Institucional</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  defaultValue="luis.lopes@uema.br"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="exemplo@uema.br"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Senha de Acesso</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  defaultValue="password123"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end">
                <a href="#" className="text-xs text-emerald-600 font-semibold hover:underline">Esqueceu a senha?</a>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold text-base transition-all flex items-center justify-center gap-2"
            >
              Entrar no Sistema
            </button>
          </form>
      </div>
      
      <p className="mt-8 text-xs text-slate-400">© 2025 Universidade Estadual do Maranhão</p>
    </div>
  );
};