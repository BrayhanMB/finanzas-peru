import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, ArrowDownRight, ArrowUpRight, Loader2, Scale, Plus, Minus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
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

export default function TransactionModal({ isOpen, onClose, onSuccess, initialData }: TransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income' | 'balance_adjustment'>('expense');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'sub'>('sub');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      if (initialData.type === 'balance_adjustment') {
        setAdjustmentType(initialData.amount >= 0 ? 'add' : 'sub');
        setAmount(Math.abs(initialData.amount).toString());
      } else {
        setAmount(initialData.amount.toString());
      }
      setCategory(initialData.category);
      setDescription(initialData.description || '');
      
      const localDate = new Date(initialData.created_at);
      const yyyy = localDate.getFullYear();
      const mm = String(localDate.getMonth() + 1).padStart(2, '0');
      const dd = String(localDate.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setType('expense');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDescription('');
      
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Handle type change and reset category
  const handleTypeChange = (newType: 'expense' | 'income' | 'balance_adjustment') => {
    setType(newType);
    if (newType === 'expense') setCategory(EXPENSE_CATEGORIES[0]);
    else if (newType === 'income') setCategory(INCOME_CATEGORIES[0]);
    else setCategory('Ajuste de Balance');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No usuario autenticado');

      const [y, m, d] = date.split('-');
      const submitDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);

      let finalAmount = Number(amount);
      if (type === 'balance_adjustment' && adjustmentType === 'sub') {
        finalAmount = -Math.abs(finalAmount);
      } else if (type === 'balance_adjustment' && adjustmentType === 'add') {
        finalAmount = Math.abs(finalAmount);
      }

      const payload = {
        type: type,
        amount: finalAmount,
        category: type === 'balance_adjustment' ? 'Ajuste de Balance' : category,
        description: description || null,
        created_at: submitDate.toISOString(),
      };

      let error;
      if (initialData) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({ ...payload, user_id: user.id });
        error = insertError;
      }

      if (error) throw error;
      
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

        <h2 className="text-2xl font-bold text-slate-900 mb-8">
          {initialData ? 'Editar Movimiento' : 'Nuevo Movimiento'}
        </h2>

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
            <button
              type="button"
              onClick={() => handleTypeChange('balance_adjustment')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                type === 'balance_adjustment' 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Scale size={18} />
              Ajuste
            </button>
          </div>

          {type === 'balance_adjustment' && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  adjustmentType === 'add'
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Plus size={16} /> Sumar dinero
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('sub')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  adjustmentType === 'sub'
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Minus size={16} /> Restar dinero
              </button>
            </div>
          )}

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
          {type !== 'balance_adjustment' && (
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
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900"
            />
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
              initialData ? 'Actualizar Movimiento' : 'Guardar Movimiento'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
