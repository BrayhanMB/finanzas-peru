import { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, PiggyBank, Edit2, Trash2, Scale, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AllTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
  onEdit: (tx: any) => void;
  onDelete: (id: string) => void;
  title?: string;
  subtitle?: string;
  showWeeklyChart?: boolean;
  month?: number;
  year?: number;
}

const normalizeCategoryName = (category: string) => {
  if (category === 'Servicios del Hogar') return 'Servicios';
  if (category === 'Gustos / Antojos') return 'Gustos';
  if (category === 'Pago de deuda') return 'Deudas';
  if (category === 'Internet y Celular') return 'Celular';
  return category;
};

export default function AllTransactionsModal({ 
  isOpen, 
  onClose, 
  transactions, 
  onEdit, 
  onDelete, 
  title, 
  subtitle, 
  showWeeklyChart, 
  month, 
  year 
}: AllTransactionsModalProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount).replace('PEN', 'S/');
  };

  const weeklyData = () => {
    let targetYear = year;
    let targetMonth = month;

    if (targetYear === undefined || targetMonth === undefined) {
      if (transactions.length > 0) {
        const firstDate = new Date(transactions[0].created_at);
        targetYear = firstDate.getFullYear();
        targetMonth = firstDate.getMonth();
      } else {
        const now = new Date();
        targetYear = now.getFullYear();
        targetMonth = now.getMonth();
      }
    }

    const totalDays = new Date(targetYear, targetMonth + 1, 0).getDate();

    interface WeekRange {
      weekIndex: number;
      startDay: number;
      endDay: number;
      name: string;
      value: number;
    }

    const weeks: WeekRange[] = [];
    let startDay = 1;
    let currentWeekNum = 1;

    while (startDay <= totalDays) {
      const currentDate = new Date(targetYear, targetMonth, startDay);
      const dayOfWeek = currentDate.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const endDay = Math.min(startDay + daysUntilSunday, totalDays);

      weeks.push({
        weekIndex: currentWeekNum,
        startDay,
        endDay,
        name: `Sem ${currentWeekNum} (${startDay}-${endDay})`,
        value: 0,
      });

      startDay = endDay + 1;
      currentWeekNum++;
    }

    transactions.forEach(tx => {
      const date = new Date(tx.created_at);
      if (date.getFullYear() === targetYear && date.getMonth() === targetMonth) {
        const day = date.getDate();
        const amount = Number(tx.amount);
        const targetWeek = weeks.find(w => day >= w.startDay && day <= w.endDay);
        if (targetWeek) {
          targetWeek.value += amount;
        }
      }
    });

    return weeks.map(w => ({
      name: w.name,
      value: w.value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={cn(
          "bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800",
          showWeeklyChart ? "max-w-4xl" : "max-w-2xl"
        )}
        onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); }}
      >
        {/* Grab Handle en Móvil */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title || 'Todos los Movimientos'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle || 'Historial de registros'}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          "p-6 overflow-y-auto custom-scrollbar relative",
          showWeeklyChart ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""
        )}>
          {/* Listado de movimientos */}
          <div className="space-y-2.5">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-12">No hay movimientos registrados.</p>
            ) : (
              transactions.map((tx) => {
                const isNegative = tx.type === 'expense' || tx.type === 'savings_deposit';
                const isPositive = tx.type === 'income' || tx.type === 'savings_withdrawal';

                return (
                  <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
                        tx.type === 'expense' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" : 
                        tx.type === 'income' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        tx.type === 'balance_adjustment' ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300" :
                        "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      )}>
                        {tx.type === 'expense' ? <ArrowDownRight size={18} strokeWidth={2.5} /> : 
                         tx.type === 'income' ? <ArrowUpRight size={18} strokeWidth={2.5} /> :
                         tx.type === 'balance_adjustment' ? <Scale size={18} strokeWidth={2.5} /> :
                         <PiggyBank size={18} strokeWidth={2.5} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{normalizeCategoryName(tx.category)}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
                          {tx.description || 'Sin detalle'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('es-PE', { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={cn(
                        "font-extrabold text-sm sm:text-base",
                        isNegative ? "text-slate-900 dark:text-white" : 
                        isPositive ? "text-emerald-600 dark:text-emerald-400" :
                        "text-slate-700 dark:text-slate-300"
                      )}>
                        {isNegative ? '-' : isPositive ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                      </span>

                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === tx.id ? null : tx.id); }} 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        {activeDropdownId === tx.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-20" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { onEdit(tx); setActiveDropdownId(null); onClose(); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                              <Edit2 size={14} /> Editar
                            </button>
                            <button onClick={() => { onDelete(tx.id); setActiveDropdownId(null); }} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2">
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Gráfico Semanal Ajustado al Calendario */}
          {showWeeklyChart && (
            <div className="bg-slate-50 dark:bg-slate-950/70 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col mt-4 lg:mt-0 lg:sticky lg:top-0 h-[340px]">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Desglose Semanal Calendario</h3>
              </div>
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `S/${val}`} />
                    <RechartsTooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Total']}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
