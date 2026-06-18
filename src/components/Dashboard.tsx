import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TransactionModal from './TransactionModal';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  LogOut, 
  MessageCircle,
  Coffee,
  Car,
  Zap,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data
const expensesByCategory = [
  { name: 'Comida', value: 1200, color: '#10b981', icon: Coffee }, // Emerald 500
  { name: 'Transporte', value: 450, color: '#f43f5e', icon: Car }, // Rose 500
  { name: 'Servicios', value: 600, color: '#8b5cf6', icon: Zap }, // Violet 500
  { name: 'Supermercado', value: 1000, color: '#0ea5e9', icon: ShoppingBag }, // Sky 500
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};

interface DashboardProps {
  userName: string;
  userMetadata?: any;
  onLogout: () => void;
}

export default function Dashboard({ userName, userMetadata, onLogout }: DashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Calculate real totals
  const initialBalance = userMetadata?.initial_balance || 0;
  
  const realIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const realExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const balance = initialBalance + realIncome - realExpenses;
  const currentSavings = balance; // Using available balance as current savings for now
  
  const income = realIncome;
  const expenses = realExpenses;
  const savingsGoal = userMetadata?.savings_goal || 5000.00;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-300 flex items-center justify-center shadow-sm">
              <span className="text-xl leading-none">🐧</span>
            </div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">Finanzas</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500 text-sm hidden sm:inline-block font-medium">Hola, {userName.split(' ')[0]}</span>
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
            >
              <LogOut size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Balance Hero Card */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500"></div>
          <p className="text-slate-500 font-medium mb-2 uppercase tracking-wider text-xs">Balance Disponible</p>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(balance)}
          </h2>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
            <TrendingUp size={16} />
            <span>+12.5% este mes</span>
          </div>
        </section>

        {/* Summary Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 font-medium text-sm">Ingresos del mes</p>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(income)}</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 font-medium text-sm">Gastos del mes</p>
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowDownRight size={18} strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-600">{formatCurrency(expenses)}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 font-medium text-sm">Meta de ahorro</p>
              <span className="text-indigo-600 font-bold text-sm">25%</span>
            </div>
            <div className="mt-1">
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                <span>{formatCurrency(currentSavings)}</span>
                <span>{formatCurrency(savingsGoal)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${(currentSavings / savingsGoal) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid: Chart & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Chart Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Gastos por Categoría</h3>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="transition-all duration-300 hover:opacity-80" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Gastos</span>
                <span className="text-xl font-bold text-slate-900">{formatCurrency(expenses)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-6">
              {expensesByCategory.map((cat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-sm text-slate-600 font-medium">{cat.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Transactions Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900">Últimos Movimientos</h3>
              <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 transition-colors">Ver todos</button>
            </div>
            
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Aún no hay movimientos registrados.</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        tx.type === 'expense' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {tx.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{tx.category}</p>
                        <p className="text-sm text-slate-500">{tx.description} • {new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-bold",
                      tx.type === 'expense' ? "text-slate-900" : "text-emerald-600"
                    )}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Floating CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-[90%] sm:max-w-max pointer-events-none">
        <button className="pointer-events-auto w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-full shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-[15px]">
          <MessageCircle size={22} className="fill-white/20" strokeWidth={2.5} />
          Registrar nuevo gasto en WhatsApp
        </button>
      </div>

      {/* Floating Web Transaction Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-20 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTransactions();
        }}
      />
    </div>
  );
}
