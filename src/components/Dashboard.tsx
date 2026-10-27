import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TransactionModal from './TransactionModal';
import Sidebar, { type TabType } from './Sidebar';
import SettingsModal from './SettingsModal';
import AllTransactionsModal from './AllTransactionsModal';
import TransactionsView from './TransactionsView';
import Reports from './Reports';
import Payments from './Payments';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  PiggyBank,
  Wallet,
  Eye,
  EyeOff,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
// Colores refinados estilo Apple
const CATEGORY_COLORS: Record<string, string> = {
  'Alquiler': '#6366f1',
  'Servicios del Hogar': '#0ea5e9',
  'Internet y Celular': '#3b82f6',
  'Suscripciones': '#ec4899',
  'Mercado': '#10b981',
  'Gustos / Antojos': '#f59e0b',
  'Transporte': '#f43f5e',
  'Cuidado personal': '#14b8a6',
  'Salud': '#ef4444',
  'Entretenimiento / Salidas': '#8b5cf6',
  'Pago de deuda': '#64748b',
  'Mascotas': '#f97316',
  'Imprevistos': '#e11d48',
  'Otros': '#94a3b8',
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
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showBalance, setShowBalance] = useState(true);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este movimiento?')) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al eliminar el movimiento.');
    }
  };

  const handleEdit = (tx: any) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

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

  // Calcular balance global real
  const initialBalance = userMetadata?.initial_balance || 0;
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const savingsDeposits = transactions
    .filter(t => t.type === 'savings_deposit')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const savingsWithdrawals = transactions
    .filter(t => t.type === 'savings_withdrawal')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const balanceAdjustments = transactions
    .filter(t => t.type === 'balance_adjustment')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const balance = initialBalance + totalIncome - totalExpenses - savingsDeposits + savingsWithdrawals + balanceAdjustments;

  // Totales de ESTE MES
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income' && t.category !== 'Préstamo a mi favor')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const monthlySavings = currentMonthTransactions
    .filter(t => t.type === 'savings_deposit')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const savingsGoal = userMetadata?.savings_goal || 5000.00;

  // Datos dinámicos para el gráfico de dona y desglose porcentual
  const expenseTransactions = currentMonthTransactions.filter(t => t.type === 'expense');
  const dynamicExpensesByCategory = expenseTransactions.reduce((acc: any[], curr) => {
    const existingCategory = acc.find(c => c.name === curr.category);
    if (existingCategory) {
      existingCategory.value += Number(curr.amount);
    } else {
      acc.push({
        name: curr.category,
        value: Number(curr.amount),
        color: CATEGORY_COLORS[curr.category] || '#6366f1'
      });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const hasExpenses = dynamicExpensesByCategory.length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans flex text-slate-900 dark:text-white transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 pb-28 md:pb-10 min-w-0">
        
        {/* Header Mobile Apple Style */}
        <header className="px-6 pt-5 pb-2 flex items-center justify-between md:hidden">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Buenos días</p>
            <h1 className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              {userName.split(' ')[0]} <span className="text-xl">👋</span>
            </h1>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center shadow-sm"
          >
            <span className="text-lg">🐧</span>
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <main className="max-w-xl mx-auto px-4 sm:px-6 mt-3 md:mt-8 space-y-6">
            
            {/* Saludo en Desktop */}
            <div className="hidden md:block mb-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Buenos días, {userName.split(' ')[0]} 👋</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Resumen de tus cuentas y gastos del mes.</p>
            </div>

            {/* Apartado 1: Total Balance Card (Apple Wallet Style) */}
            <section className="bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 rounded-[2rem] p-6 sm:p-7 border border-indigo-100/60 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Dinero</span>
                    <button 
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {showBalance ? formatCurrency(balance) : 'S/ ••••••'}
                  </h2>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <TrendingUp size={14} /> Balance total disponible
                  </p>
                </div>

                {/* Icono de contraste estilo tarjeta Apple */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
                  <Wallet size={32} strokeWidth={2.2} />
                </div>
              </div>
            </section>

            {/* Apartado 2: Resumen (Ingresos del Mes, Egresos del Mes, Ahorro del Mes) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Resumen:</h3>
                <button 
                  onClick={() => setActiveTab('movimientos')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  Ver movimientos <ChevronRight size={14} />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-3 divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-100 dark:border-slate-800/80 shadow-sm">
                {/* Ingresos del Mes */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ArrowUpRight size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Ingresos del Mes</h4>
                      <p className="text-xs text-slate-400">Total recibido</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(monthlyIncome)}
                  </span>
                </div>

                {/* Egresos del Mes */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <ArrowDownRight size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Egresos del Mes</h4>
                      <p className="text-xs text-slate-400">Gastos realizados</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-base sm:text-lg text-rose-600 dark:text-rose-400">
                    -{formatCurrency(monthlyExpenses)}
                  </span>
                </div>

                {/* Ahorro del Mes */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <PiggyBank size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Ahorro del Mes</h4>
                      <p className="text-xs text-slate-400">Guardado en alcancía</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-base sm:text-lg text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(monthlySavings)}
                  </span>
                </div>
              </div>
            </section>

            {/* Apartado 3: Gastos por Categoría (Gráfico a la Izquierda y Categorías con % a la Derecha) */}
            <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Gastos por Categoría</h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Este Mes</span>
              </div>

              {!hasExpenses ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Aún no has registrado ningún gasto en este mes.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Gráfico a la izquierda */}
                  <div className="w-44 h-44 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dynamicExpensesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={74}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {dynamicExpensesByCategory.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(Number(value))}
                          contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(monthlyExpenses)}</span>
                    </div>
                  </div>

                  {/* Categorías con porcentaje a la derecha */}
                  <div className="flex-1 w-full space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {dynamicExpensesByCategory.map((cat: any, i: number) => {
                      const percentage = monthlyExpenses > 0 ? Math.round((cat.value / monthlyExpenses) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2 truncate max-w-[150px]">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">{formatCurrency(cat.value)}</span>
                            <span className="font-bold text-slate-900 dark:text-white w-9 text-right">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

          </main>
        )}

        {/* Pestaña Movimientos (Nuevo Menú) */}
        {activeTab === 'movimientos' && (
          <TransactionsView 
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenAllModal={() => setIsAllTransactionsModalOpen(true)}
          />
        )}

        {activeTab === 'reportes' && (
          <Reports 
            transactions={transactions} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            savingsGoal={savingsGoal}
          />
        )}

        {activeTab === 'pagos' && (
          <Payments />
        )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-24 md:bottom-6 right-6 z-20 flex flex-col md:flex-row gap-4 items-end md:items-center">
          
          <div className="relative group flex items-center">
            <div className="absolute right-full mr-4 px-4 py-2 bg-slate-800 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl hidden md:block">
              Escríbele a Pingu por WhatsApp e ingresa todo desde ahí
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-4 border-transparent border-l-slate-800"></div>
            </div>
            
            <a 
              href="https://wa.me/51924245759"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg shadow-[#25D366]/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              title="Registrar en WhatsApp"
            >
              <MessageCircle size={26} className="fill-white/20" strokeWidth={2.5} />
            </a>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="Nuevo movimiento manual"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
          fetchTransactions();
        }}
        initialData={editingTransaction}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        userMetadata={userMetadata}
        onSuccess={() => {
          setIsSettingsOpen(false);
          window.location.reload();
        }}
      />
      
      <AllTransactionsModal
        isOpen={isAllTransactionsModalOpen}
        onClose={() => setIsAllTransactionsModalOpen(false)}
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
