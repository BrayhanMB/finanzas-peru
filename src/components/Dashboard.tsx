import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TransactionModal from './TransactionModal';
import Sidebar, { type TabType } from './Sidebar';
import SettingsModal from './SettingsModal';
import AllTransactionsModal from './AllTransactionsModal';
import Reports from './Reports';
import Payments from './Payments';
import { 
  PieChart, 
  MessageCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Bell,
  Scale,
  PiggyBank,
  Eye,
  EyeOff,
  Clock,
  User
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

  const initialBalance = userMetadata?.initial_balance || 0;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const savingsDeposits = transactions.filter(t => t.type === 'savings_deposit').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const savingsWithdrawals = transactions.filter(t => t.type === 'savings_withdrawal').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balanceAdjustments = transactions.filter(t => t.type === 'balance_adjustment').reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const balance = initialBalance + totalIncome - totalExpenses - savingsDeposits + savingsWithdrawals + balanceAdjustments;
  const currentSavings = savingsDeposits - savingsWithdrawals;

  const savingsGoal = userMetadata?.savings_goal || 5000.00;
  const savingsPercent = Math.min(100, Math.round((currentSavings / savingsGoal) * 100));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenSettings={() => setIsSettingsOpen(true)} onLogout={onLogout} />

      <div className="flex-1 md:ml-64 pb-28 md:pb-10 min-w-0 md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
        
        {activeTab === 'dashboard' && (
          <main className="px-6 mt-6 md:mt-10 space-y-8 max-w-lg mx-auto md:max-w-none">
            
            {/* Apple Style Header */}
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                   <User className="text-slate-500 dark:text-slate-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Buenos días,</p>
                  <h2 className="text-lg font-bold">{userName}</h2>
                </div>
              </div>
              <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative shadow-sm">
                <Bell size={20} className="text-slate-700 dark:text-slate-300" />
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
              </button>
            </header>

            {/* Apple Style Balance */}
            <section className="pt-2 md:pt-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Balance Disponible</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter">
                  {showBalance ? formatCurrency(balance) : 'S/ •••••'}
                </h1>
                <button onClick={() => setShowBalance(!showBalance)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock size={12} className="text-slate-400" />
                <p className="text-xs text-slate-400 font-medium">Actualizado hace un momento</p>
              </div>
            </section>

            {/* Apple Style Quick Actions */}
            <section className="pt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg md:text-xl">Acciones Rápidas</h3>
                <button onClick={() => setIsModalOpen(true)} className="text-sm font-bold text-slate-900 dark:text-white">Ver más</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Nuevo Registro */}
                <button onClick={() => setIsModalOpen(true)} className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-start gap-3 transition-all hover:shadow-md hover:scale-[1.02] text-left">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Plus size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-sm md:text-base">Nuevo Registro</p>
                    <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Añadir manual</p>
                  </div>
                </button>
                {/* WhatsApp */}
                <a href="https://wa.me/51924245759" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-start gap-3 transition-all hover:shadow-md hover:scale-[1.02] text-left">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <MessageCircle size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-sm md:text-base">Pingu Bot</p>
                    <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chat inteligente</p>
                  </div>
                </a>
                {/* Metas */}
                <button className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-start gap-3 transition-all hover:shadow-md hover:scale-[1.02] text-left">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <PiggyBank size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-sm md:text-base">Mis Metas</p>
                    <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{savingsPercent}% completado</p>
                  </div>
                </button>
                {/* Reportes */}
                <button onClick={() => setActiveTab('reportes')} className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-start gap-3 transition-all hover:shadow-md hover:scale-[1.02] text-left">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <PieChart size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-sm md:text-base">Reportes</p>
                    <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ver gráficos</p>
                  </div>
                </button>
              </div>
            </section>

            {/* Apple Style Transaction History */}
            <section className="pt-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg md:text-xl">Historial</h3>
                <button onClick={() => setIsAllTransactionsModalOpen(true)} className="text-sm font-bold text-slate-900 dark:text-white">Ver todas</button>
              </div>
              <div className="space-y-6">
                {transactions.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">No hay transacciones aún.</p>
                ) : (
                  transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} onClick={() => handleEdit(tx)} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                          tx.type === 'expense' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500" : 
                          tx.type === 'income' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" :
                          tx.type === 'balance_adjustment' ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" :
                          "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"
                        )}>
                          {tx.type === 'expense' ? <ArrowUpRight size={20} strokeWidth={2.5} /> : 
                           tx.type === 'income' ? <ArrowDownLeft size={20} strokeWidth={2.5} /> :
                           tx.type === 'balance_adjustment' ? <Scale size={20} strokeWidth={2.5} /> :
                           <PiggyBank size={20} strokeWidth={2.5} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition-colors">{tx.category}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(tx.created_at).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' })} • {(tx.description || '').substring(0,25)}{(tx.description || '').length > 25 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "font-bold text-base",
                          tx.type === 'expense' || tx.type === 'savings_deposit' ? "text-rose-500" : 
                          tx.type === 'income' ? "text-emerald-500" :
                          "text-slate-900 dark:text-white"
                        )}>
                          {tx.type === 'expense' || tx.type === 'savings_deposit' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                        </span>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 capitalize">
                          {tx.type === 'expense' ? 'Gasto' : tx.type === 'income' ? 'Ingreso' : tx.type === 'savings_deposit' ? 'Ahorro' : 'Ajuste'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>
        )}

        {activeTab === 'reportes' && (
          <div className="px-4 md:px-8 mt-6">
             <Reports transactions={transactions} onEdit={handleEdit} onDelete={handleDelete} savingsGoal={savingsGoal} />
          </div>
        )}

        {activeTab === 'pagos' && (
          <div className="px-4 md:px-8 mt-6">
             <Payments />
          </div>
        )}

        {activeTab === 'alertas' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 text-center">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-3xl mx-auto flex items-center justify-center mb-6">
              <Bell size={40} strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Centro de Alertas</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Aquí recibirás notificaciones cuando estés cerca de sobrepasar tu presupuesto. ¡Próximamente!</p>
          </div>
        )}

        {/* Floating Action Button ONLY FOR DESKTOP */}
        <div className="hidden md:flex fixed bottom-6 right-6 z-20 flex-col gap-4 items-center">
          <button onClick={() => setIsModalOpen(true)} className="w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg shadow-slate-900/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} onSuccess={() => { setIsModalOpen(false); fetchTransactions(); }} initialData={editingTransaction} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} userMetadata={userMetadata} onSuccess={() => { setIsSettingsOpen(false); window.location.reload(); }} />
      <AllTransactionsModal isOpen={isAllTransactionsModalOpen} onClose={() => setIsAllTransactionsModalOpen(false)} transactions={transactions} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
