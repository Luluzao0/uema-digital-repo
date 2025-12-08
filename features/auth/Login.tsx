import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';

export const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#d2d6de] flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-wide">
             <span className="font-extrabold">UEMA</span> Digital
          </h1>
      </div>

      <div className="bg-white p-0 shadow-md border-t-4 border-[#3c8dbc] w-full max-w-sm rounded-sm">
          <div className="p-6 text-center border-b border-gray-100 bg-gray-50">
             <p className="text-gray-600 font-semibold">Login do Sistema</p>
          </div>
          
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
                <input 
                  type="email" 
                  defaultValue="luis.lopes@uema.br"
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-sm focus:border-blue-400 outline-none transition-colors text-sm"
                  placeholder="E-mail"
                  required
                />
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative">
                <input 
                  type="password" 
                  defaultValue="password123"
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-sm focus:border-blue-400 outline-none transition-colors text-sm"
                  placeholder="Senha"
                  required
                />
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex justify-between items-center text-xs">
                 <label className="flex items-center text-gray-600">
                     <input type="checkbox" className="mr-2" /> Lembrar-me
                 </label>
                 <a href="#" className="text-blue-600 hover:underline">Esqueci a senha</a>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3c8dbc] hover:bg-[#367fa9] text-white py-2 rounded-sm font-bold text-sm transition-colors shadow-sm border border-transparent"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
      </div>
      
      <p className="mt-4 text-xs text-gray-500 font-medium">Universidade Estadual do Maranhão &copy; 2025</p>
    </div>
  );
};