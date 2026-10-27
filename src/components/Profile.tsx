import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, MessageCircle, CheckCircle2, ShieldCheck, LogOut, Moon, Sun } from 'lucide-react';

interface ProfileProps {
  userName: string;
  userMetadata: any;
  onLogout: () => void;
  onSuccess: () => void;
}

export default function Profile({ userName, userMetadata, onLogout, onSuccess }: ProfileProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfil' | 'whatsapp'>('perfil');
  
  const [whatsapp, setWhatsapp] = useState('');
  const [balance, setBalance] = useState('');
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (userMetadata) {
      setWhatsapp(userMetadata.whatsapp_number?.replace('51', '') || '');
      setBalance(userMetadata.initial_balance?.toString() || '');
      setIncome(userMetadata.monthly_income?.toString() || '');
      setGoal(userMetadata.savings_goal?.toString() || '');
    }

    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
    }
  }, [userMetadata]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let cleanPhone = whatsapp.replace(/\D/g, '');
      if (cleanPhone.length === 9) {
        cleanPhone = '51' + cleanPhone;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          whatsapp_number: cleanPhone,
          initial_balance: Number(balance),
          monthly_income: Number(income),
          savings_goal: Number(goal),
        }
      });
      if (error) throw error;
      alert('¡Ajustes guardados correctamente!');
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar los ajustes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 mt-4 pb-28">
      {/* Header Perfil Apple Style */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl shadow-inner">
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{userName}</h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" /> Cuenta activa
            </p>
          </div>
        </div>

        {/* Toggle Dark Mode */}
        <button
          onClick={toggleTheme}
          className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
          title="Cambiar tema"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center mb-6">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeTab === 'perfil'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User size={16} />
          Datos Financieros
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeTab === 'whatsapp'
              ? 'bg-white dark:bg-slate-900 text-[#25D366] shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageCircle size={16} />
          WhatsApp Bot
        </button>
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
        {activeTab === 'perfil' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Dinero Inicial (S/)
              </label>
              <input 
                type="number" 
                value={balance} 
                onChange={(e) => setBalance(e.target.value)} 
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white font-semibold" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ingreso Mensual Fijo (S/) <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">Si tu ingreso es variable, déjalo en blanco.</p>
              <input 
                type="number" 
                value={income} 
                onChange={(e) => setIncome(e.target.value)} 
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white font-semibold" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Meta de Ahorro (S/)
              </label>
              <input 
                type="number" 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)} 
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white font-semibold" 
              />
            </div>
          </>
        )}

        {activeTab === 'whatsapp' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Número de WhatsApp Vinculado
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+51</span>
              <input 
                type="tel" 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)} 
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white font-semibold" 
                placeholder="999 888 777" 
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              El asistente financiero Pingu solo registrará los gastos, ingresos y capturas de Yape enviados desde este número.
            </p>
          </div>
        )}

        {/* Botón Guardar */}
        <button 
          onClick={handleSave} 
          disabled={loading} 
          className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      {/* Botón Cerrar Sesión */}
      <div className="mt-8">
        <button
          onClick={onLogout}
          className="w-full bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
