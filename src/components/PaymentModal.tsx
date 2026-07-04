import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2 } from 'lucide-react';

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  details: string | null;
  created_at: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: RecurringPayment | null;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function PaymentModal({ isOpen, onClose, onSuccess, initialData }: PaymentModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount.toString());
      setDueDay(initialData.due_day);
      setDetails(initialData.details || '');
    } else {
      setName('');
      setAmount('');
      setDueDay(1);
      setDetails('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No usuario autenticado');

      const payload = {
        name,
        amount: Number(amount),
        due_day: Number(dueDay),
        details: details || null,
      };

      let error;
      if (initialData) {
        const { error: updateError } = await supabase
          .from('recurring_payments')
          .update(payload)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('recurring_payments')
          .insert({ ...payload, user_id: user.id });
        error = insertError;
      }

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar el pago recurrente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md p-6 sm:p-8 relative z-10 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 mb-8">
          {initialData ? 'Editar Pago Recurrente' : 'Nuevo Pago Recurrente'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Gasto</label>
            <input 
              type="text" 
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-medium"
              placeholder="Ej. Alquiler, Netflix, Internet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Monto Fijo (S/)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-bold text-xl"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Día de Pago (Vencimiento)</label>
            <select
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-medium cursor-pointer"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>Día {day} de cada mes</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Detalles / Notas (Opcional)</label>
            <input 
              type="text" 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900"
              placeholder="Ej. Transferencia al dueño, plan premium"
            />
          </div>

          <button 
            type="submit" 
            disabled={!name || !amount || loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              initialData ? 'Actualizar Pago' : 'Guardar Pago Recurrente'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
