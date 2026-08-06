import { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, PiggyBank, MoreVertical, Edit2, Trash2, Scale } from 'lucide-react';
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
}

export default function AllTransactionsModal({ isOpen, onClose, transactions, onEdit, onDelete, title, subtitle, showWeeklyChart }: AllTransactionsModalProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount).replace('PEN', 'S/');
  };

  const weeklyData = () => {
    const weeks = [
      { name: 'Semana 1', value: 0 },
      { name: 'Semana 2', value: 0 },
      { name: 'Semana 3', value: 0 },
      { name: 'Semana 4', value: 0 },
    ];
    
    transactions.forEach(tx => {
      const date = new Date(tx.created_at);
      const day = date.getDate();
      const amount = Number(tx.amount);
      
      if (day <= 7) weeks[0].value += amount;
      else if (day <= 14) weeks[1].value += amount;
      else if (day <= 21) weeks[2].value += amount;
      else weeks[3].value += amount;
    });
    
    return weeks;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={cn(
          "bg-white rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200",
          showWeeklyChart ? "max-w-5xl" : "max-w-2xl"
        )}
        onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); }}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title || 'Todos los Movimientos'}</h2>
            <p className="text-sm text-slate-500 mt-1">{subtitle || 'Historial completo de tus finanzas'}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className={cn(
          "p-6 overflow-y-auto custom-scrollbar relative",
          showWeeklyChart ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : ""
        )}>
          {/* Left: Transaction list */}
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-12">Aún no hay movimientos registrados.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      tx.type === 'expense' ? "bg-rose-50 text-rose-600" : 
                      tx.type === 'income' ? "bg-emerald-50 text-emerald-600" :
                      tx.type === 'balance_adjustment' ? "bg-slate-100 text-slate-700" :
                      "bg-indigo-50 text-indigo-600"
                    )}>
                      {tx.type === 'expense' ? <ArrowDownRight size={20} /> : 
                       tx.type === 'income' ? <ArrowUpRight size={20} /> :
                       tx.type === 'balance_adjustment' ? <Scale size={20} /> :
                       <PiggyBank size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{tx.category}</p>
                      <p className="text-sm text-slate-500 truncate max-w-[150px] sm:max-w-[300px]">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('es-PE', { 
                          year: 'numeric', month: 'short', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-bold text-lg",
                      tx.type === 'expense' ? "text-slate-900" : 
                      tx.type === 'income' ? "text-emerald-600" :
                      tx.type === 'balance_adjustment' ? "text-slate-500" :
                      "text-indigo-600"
                    )}>
                      {tx.type === 'expense' || tx.type === 'savings_deposit' ? '-' : 
                       tx.type === 'balance_adjustment' ? (tx.amount > 0 ? '+' : '') : '+'}{tx.type === 'balance_adjustment' ? formatCurrency(Math.abs(tx.amount)) : formatCurrency(tx.amount)}
                    </span>
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === tx.id ? null : tx.id); }} 
                        className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {activeDropdownId === tx.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { onEdit(tx); setActiveDropdownId(null); onClose(); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <Edit2 size={16} /> Editar
                          </button>
                          <button onClick={() => { onDelete(tx.id); setActiveDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 flex items-center gap-2">
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Chart */}
          {showWeeklyChart && (
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col mt-6 lg:mt-0 lg:sticky lg:top-0 h-[380px]">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Desglose Semanal</h3>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `S/${val}`} />
                    <RechartsTooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Total']}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
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
