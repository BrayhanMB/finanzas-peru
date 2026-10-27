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
  'Servicios',
  'Celular',
  'Suscripciones',
  'Mercado',
  'Gustos',
  'Transporte',
  'Cuidado personal',
  'Salud',
  'Entretenimiento / Salidas',
  'Deudas',
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

      const now = new Date();
      let submitDate: Date;
      if (initialData) {
        const prevDate = new Date(initialData.created_at);
        const [y, m, d] = date.split('-');
        submitDate = new Date(
          Number(y),
          Number(m) - 1,
          Number(d),
          prevDate.getHours(),
          prevDate.getMinutes(),
          prevDate.getSeconds()
        );
      } else {
        const [y, m, d] = date.split('-');
        const isToday = 
          Number(y) === now.getFullYear() &&
          Number(m) - 1 === now.getMonth() &&
          Number(d) === now.getDate();
        
        if (isToday) {
          submitDate = now;
        } else {
          submitDate = new Date(
            Number(y),
            Number(m) - 1,
            Number(d),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
          );
        }
      }

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 relative z-10 animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-300 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        
        {/* Grab Handle en Móvil estilo iOS */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {initialData ? 'Editar Movimiento' : 'Nuevo Movimiento'}
          </h2>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Segmented Type Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200",
                type === 'expense' 
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              <ArrowDownRight size={16} strokeWidth={2.5} />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200",
                type === 'income' 
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              <ArrowUpRight size={16} strokeWidth={2.5} />
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('balance_adjustment')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200",
                type === 'balance_adjustment' 
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              <Scale size={16} strokeWidth={2.5} />
              Ajuste
            </button>
          </div>

          {type === 'balance_adjustment' && (
            <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                  adjustmentType === 'add'
                    ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                    : "text-slate-400"
                )}
              >
                <Plus size={14} /> Sumar dinero
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('sub')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                  adjustmentType === 'sub'
                    ? "bg-white dark:bg-slate-900 text-rose-600 shadow-sm"
                    : "text-slate-400"
                )}
              >
                <Minus size={14} /> Restar dinero
              </button>
            </div>
          )}

          {/* Amount Display Gigante Apple Style */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto a registrar</label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-400">S/</span>
              <input 
                type="number" 
                step="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-slate-900 dark:text-white font-black text-4xl sm:text-5xl text-center tracking-tight placeholder:text-slate-300 dark:placeholder:text-slate-700"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          {type !== 'balance_adjustment' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white font-semibold text-sm cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white font-semibold text-sm cursor-pointer"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white font-semibold text-sm placeholder:text-slate-400"
              placeholder="Ej. Almuerzo familiar, Yape..."
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={!amount || loading}
            className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 text-white dark:text-slate-900 font-extrabold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-4 text-base"
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
