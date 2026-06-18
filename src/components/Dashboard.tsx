import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TransactionModal from './TransactionModal';
import Sidebar, { type TabType } from './Sidebar';
import SettingsModal from './SettingsModal';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  MessageCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  PieChart as PieChartIcon,
  Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Colors for categories
const CATEGORY_COLORS: Record<string, string> = {
  'Alquiler': '#8b5cf6', // Violet
  'Servicios del Hogar': '#0ea5e9', // Sky
  'Internet y Celular': '#3b82f6', // Blue
  'Suscripciones': '#ec4899', // Pink
  'Mercado': '#10b981', // Emerald
  'Gustos / Antojos': '#f59e0b', // Amber
  'Transporte': '#f43f5e', // Rose
  'Cuidado personal': '#14b8a6', // Teal
  'Salud': '#ef4444', // Red
  'Entretenimiento / Salidas': '#8b5cf6', // Violet
  'Pago de deuda': '#64748b', // Slate
  'Mascotas': '#f97316', // Orange
  'Imprevistos': '#ef4444', // Red
  'Otros': '#94a3b8', // Slate light
};

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
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

  const savingsDeposits = transactions
    .filter(t => t.type === 'savings_deposit')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const savingsWithdrawals = transactions
    .filter(t => t.type === 'savings_withdrawal')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const balance = initialBalance + realIncome - realExpenses - savingsDeposits + savingsWithdrawals;
  const currentSavings = savingsDeposits - savingsWithdrawals;
  
  const income = realIncome;
  const expenses = realExpenses;
  const savingsGoal = userMetadata?.savings_goal || 5000.00;

  // Generate dynamic chart data
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const dynamicExpensesByCategory = expenseTransactions.reduce((acc: any[], curr) => {
    const existingCategory = acc.find(c => c.name === curr.category);
    if (existingCategory) {
      existingCategory.value += Number(curr.amount);
    } else {
      acc.push({
        name: curr.category,
        value: Number(curr.amount),
        color: CATEGORY_COLORS[curr.category] || '#6366f1' // Default Indigo
      });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value); // Sort by highest expense

  const hasExpenses = dynamicExpensesByCategory.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 pb-28 md:pb-10 min-w-0">
        
        {/* Header solo en mobile ya que el sidebar desktop ya tiene logo */}
        <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-300 flex items-center justify-center shadow-sm">
              <span className="text-xl leading-none">🐧</span>
            </div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">Finanzas</h1>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-slate-900">Hola, {userName.split(' ')[0]} 👋</h2>
              <p className="text-slate-500">Aquí está el resumen de tus finanzas.</p>
            </div>
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
                    data={hasExpenses ? dynamicExpensesByCategory : [{ name: 'Sin gastos', value: 1, color: '#f1f5f9' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={hasExpenses ? 5 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {(hasExpenses ? dynamicExpensesByCategory : [{ color: '#f1f5f9' }]).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className={hasExpenses ? "transition-all duration-300 hover:opacity-80" : ""} />
                    ))}
                  </Pie>
                  {hasExpenses && (
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Gastos</span>
                <span className="text-xl font-bold text-slate-900">{formatCurrency(expenses)}</span>
              </div>
            </div>
            
            {hasExpenses ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-6">
                {dynamicExpensesByCategory.map((cat: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-sm text-slate-600 font-medium">{cat.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 text-center text-slate-500 text-sm font-medium">
                Aún no has registrado ningún gasto.
              </div>
            )}
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
        )}

        {activeTab === 'reportes' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 text-center">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-3xl mx-auto flex items-center justify-center mb-6">
              <PieChartIcon size={40} strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Reportes Avanzados</h2>
            <p className="text-slate-500 text-lg">Estamos preparando gráficas detalladas de tus hábitos financieros. ¡Próximamente!</p>
          </div>
        )}

        {activeTab === 'alertas' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 text-center">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-6">
              <Bell size={40} strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Centro de Alertas</h2>
            <p className="text-slate-500 text-lg">Aquí recibirás notificaciones cuando estés cerca de sobrepasar tu presupuesto. ¡Próximamente!</p>
          </div>
        )}

        {/* Floating CTA */}
        <div className="fixed bottom-24 md:bottom-6 left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 z-20 w-full max-w-[90%] sm:max-w-max pointer-events-none">
          <button className="pointer-events-auto w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-full shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-[15px]">
            <MessageCircle size={22} className="fill-white/20" strokeWidth={2.5} />
            Registrar nuevo gasto en WhatsApp
          </button>
        </div>

        {/* Floating Web Transaction Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 md:bottom-6 right-6 z-20 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTransactions();
        }}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        userMetadata={userMetadata}
        onSuccess={() => {
          setIsSettingsOpen(false);
          window.location.reload(); // Recargar para obtener datos frescos del session
        }}
      />
    </div>
  );
}
