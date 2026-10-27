import { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  Scale, 
  PiggyBank, 
  ShoppingBag, 
  Utensils, 
  Car, 
  Receipt, 
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};

interface TransactionsViewProps {
  transactions: any[];
  onEdit: (tx: any) => void;
  onDelete: (id: string) => void;
  onOpenAllModal: () => void;
}

export default function TransactionsView({ transactions, onEdit, onOpenAllModal }: TransactionsViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Filtrado por tipo (Todos, Ingresos, Gastos)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType === 'all') return true;
      if (filterType === 'income') return tx.type === 'income' || tx.type === 'savings_withdrawal';
      if (filterType === 'expense') return tx.type === 'expense' || tx.type === 'savings_deposit';
      return true;
    });
  }, [transactions, filterType]);

  // Segmentación por Hoy, Ayer, Hace 2 días y Anteriores
  const { todayList, yesterdayList, twoDaysAgoList, olderList } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const todayItems: any[] = [];
    const yesterdayItems: any[] = [];
    const twoDaysAgoItems: any[] = [];
    const olderItems: any[] = [];

    filteredTransactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()).getTime();

      if (txDay === today.getTime()) {
        todayItems.push(tx);
      } else if (txDay === yesterday.getTime()) {
        yesterdayItems.push(tx);
      } else if (txDay === twoDaysAgo.getTime()) {
        twoDaysAgoItems.push(tx);
      } else {
        olderItems.push(tx);
      }
    });

    return {
      todayList: todayItems,
      yesterdayList: yesterdayItems,
      twoDaysAgoList: twoDaysAgoItems,
      olderList: olderItems
    };
  }, [filteredTransactions]);

  // Asignar icono dinámico según categoría estilo Apple
  const getCategoryIcon = (category: string, type: string) => {
    const lower = (category || '').toLowerCase();
    if (lower.includes('comida') || lower.includes('almuerzo') || lower.includes('mercado') || lower.includes('gustos')) {
      return <Utensils size={20} className="text-slate-600 dark:text-slate-300" />;
    }
    if (lower.includes('transporte') || lower.includes('taxi') || lower.includes('uber') || lower.includes('gasolina')) {
      return <Car size={20} className="text-slate-600 dark:text-slate-300" />;
    }
    if (lower.includes('servicio') || lower.includes('internet') || lower.includes('luz') || lower.includes('agua')) {
      return <Receipt size={20} className="text-slate-600 dark:text-slate-300" />;
    }
    if (type === 'income') {
      return <ArrowUpRight size={20} className="text-emerald-600 dark:text-emerald-400" />;
    }
    if (type === 'balance_adjustment') {
      return <Scale size={20} className="text-slate-600 dark:text-slate-300" />;
    }
    if (type === 'savings_deposit' || type === 'savings_withdrawal') {
      return <PiggyBank size={20} className="text-indigo-600 dark:text-indigo-400" />;
    }
    return <ShoppingBag size={20} className="text-slate-600 dark:text-slate-300" />;
  };

  const renderTransactionGroup = (title: string, list: any[]) => {
    if (list.length === 0) return null;

    return (
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 px-1">{title}</h3>
        <div className="space-y-2.5">
          {list.map(tx => {
            const isNegative = tx.type === 'expense' || tx.type === 'savings_deposit';
            const isPositive = tx.type === 'income' || tx.type === 'savings_withdrawal';

            return (
              <div 
                key={tx.id}
                onClick={() => onEdit(tx)}
                className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {getCategoryIcon(tx.category, tx.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{tx.category}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[170px] sm:max-w-xs">
                      {tx.description || 'Sin detalle'} • {new Date(tx.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={cn(
                    "font-extrabold text-base tracking-tight",
                    isNegative ? "text-slate-900 dark:text-white" : 
                    isPositive ? "text-emerald-600 dark:text-emerald-400" :
                    "text-slate-700 dark:text-slate-300"
                  )}>
                    {isNegative ? '-' : isPositive ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasAnyTransactions = todayList.length > 0 || yesterdayList.length > 0 || twoDaysAgoList.length > 0 || olderList.length > 0;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 mt-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Movimientos</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Historial y actividad reciente</p>
      </div>

      {/* Segmented Filter Control (Apple Style) */}
      <div className="bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={cn(
            "flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200",
            filterType === 'all' 
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={cn(
            "flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200",
            filterType === 'income' 
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          Ingresos
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={cn(
            "flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200",
            filterType === 'expense' 
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          Gastos
        </button>
      </div>

      {/* Segmented Timeline */}
      {!hasAnyTransactions ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No hay movimientos en este filtro.</p>
        </div>
      ) : (
        <>
          {renderTransactionGroup('Hoy', todayList)}
          {renderTransactionGroup('Ayer', yesterdayList)}
          {renderTransactionGroup('Hace 2 días', twoDaysAgoList)}

          {/* Si no hubo movimientos en los primeros 3 días pero hay anteriores */}
          {todayList.length === 0 && yesterdayList.length === 0 && twoDaysAgoList.length === 0 && olderList.length > 0 && (
            <p className="text-xs text-slate-400 text-center py-2 mb-4">No registraste movimientos en los últimos 2 días.</p>
          )}

          {/* Botón Ver Todos */}
          {olderList.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={onOpenAllModal}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Ver todos los movimientos anteriores ({olderList.length})</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
