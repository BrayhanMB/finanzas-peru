import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userMetadata: any;
  onSuccess: () => void;
}

export default function SettingsModal({ isOpen, onClose, userMetadata, onSuccess }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  
  // State initialization with current metadata
  const [whatsapp, setWhatsapp] = useState(userMetadata?.whatsapp_number?.replace('51', '') || '');
  const [balance, setBalance] = useState(userMetadata?.initial_balance?.toString() || '');
  const [income, setIncome] = useState(userMetadata?.monthly_income?.toString() || '');
  const [goal, setGoal] = useState(userMetadata?.savings_goal?.toString() || '');

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      // Limpiar y formatear el número para la API de Meta
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
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar los ajustes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Ajustes de Cuenta</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Número de WhatsApp</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+51</span>
              <input 
                type="tel" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold"
                placeholder="999 888 777"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">El bot solo leerá mensajes desde este número.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Dinero Inicial (S/)</label>
            <input 
              type="number" 
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Ingreso Mensual Fijo (S/) <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">Si ganas por destajo o tu ingreso es variable, déjalo en blanco.</p>
            <input 
              type="number" 
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Meta de Ahorro (S/)</label>
            <input 
              type="number" 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 size={20} />
                Guardar Ajustes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
