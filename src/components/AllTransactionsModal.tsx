import { X, ArrowDownRight, ArrowUpRight, PiggyBank } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AllTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
}

export default function AllTransactionsModal({ isOpen, onClose, transactions }: AllTransactionsModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount).replace('PEN', 'S/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Todos los Movimientos</h2>
            <p className="text-sm text-slate-500 mt-1">Historial completo de tus finanzas</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
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
                      "bg-indigo-50 text-indigo-600"
                    )}>
                      {tx.type === 'expense' ? <ArrowDownRight size={20} /> : 
                       tx.type === 'income' ? <ArrowUpRight size={20} /> :
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
                  <div className="text-right">
                    <span className={cn(
                      "font-bold text-lg",
                      tx.type === 'expense' ? "text-slate-900" : 
                      tx.type === 'income' ? "text-emerald-600" :
                      "text-indigo-600"
                    )}>
                      {tx.type === 'expense' || tx.type === 'savings_deposit' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
