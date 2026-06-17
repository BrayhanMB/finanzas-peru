import React, { useState } from 'react';

interface AuthProps {
  onLogin: () => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login/register process
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-2xl w-full max-w-md border border-white/20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-300 flex items-center justify-center shadow-lg shadow-sky-300/50 mb-4">
            <span className="text-2xl leading-none">🐧</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isLogin ? 'Bienvenido 👋' : 'Crea tu cuenta'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 text-center">
            {isLogin 
              ? 'Ingresa tus credenciales para acceder a tus finanzas' 
              : 'Únete para tomar el control de tu dinero sin Excel'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900"
                placeholder="Ej. Alejandro Pérez"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLogin ? 'Iniciar sesión' : 'Registrarme'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1.5 font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
