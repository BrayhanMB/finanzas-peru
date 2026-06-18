import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = [
  'Alquiler',
  'Servicios del Hogar',
  'Internet y Celular',
  'Suscripciones',
  'Mercado',
  'Gustos / Antojos',
  'Transporte',
  'Cuidado personal',
  'Salud',
  'Entretenimiento / Salidas',
  'Pago de deuda',
  'Mascotas',
  'Imprevistos',
  'Otros'
];
const INCOME_CATEGORIES = ['Sueldo', 'Negocio', 'Inversiones', 'Otros', 'Préstamo a mi favor'];

export default function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handle type change and reset category
  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    setCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No usuario autenticado');

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: type,
        amount: Number(amount),
        category: category,
        description: description || null,
      });

      if (error) throw error;
      
      // Reset form
      setAmount('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar el movimiento.');
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md p-6 sm:p-8 relative z-10 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 mb-8">Nuevo Movimiento</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Type Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                type === 'expense' 
                  ? "bg-white text-rose-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ArrowDownRight size={18} />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                type === 'income' 
                  ? "bg-white text-emerald-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ArrowUpRight size={18} />
              Ingreso
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Monto (S/)</label>
            <input 
              type="number" 
              step="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-bold text-2xl text-center"
              placeholder="0.00"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-medium appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción (Opcional)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900"
              placeholder="Ej. Almuerzo con amigos"
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={!amount || loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Guardar Movimiento'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
