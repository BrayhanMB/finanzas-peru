
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
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data
const balance = 1250.00;
const income = 4500.00;
const expenses = 3250.00;
const savingsGoal = 5000.00;
const currentSavings = 1250.00;

const expensesByCategory = [
  { name: 'Comida', value: 1200, color: '#10b981', icon: Coffee }, // Emerald 500
  { name: 'Transporte', value: 450, color: '#f43f5e', icon: Car }, // Rose 500
  { name: 'Servicios', value: 600, color: '#8b5cf6', icon: Zap }, // Violet 500
  { name: 'Supermercado', value: 1000, color: '#0ea5e9', icon: ShoppingBag }, // Sky 500
];

const transactions = [
  { id: 1, name: 'Uber a la oficina', category: 'Transporte', date: 'Hoy, 08:30 AM', amount: -25.50, color: '#f43f5e', icon: Car },
  { id: 2, name: 'Wong - Compras de la semana', category: 'Supermercado', date: 'Ayer, 18:45 PM', amount: -345.20, color: '#0ea5e9', icon: ShoppingBag },
  { id: 3, name: 'Sueldo Quincena', category: 'Ingreso', date: '15 Jun, 10:00 AM', amount: 2250.00, color: '#10b981', icon: Wallet },
  { id: 4, name: 'Luz del Sur', category: 'Servicios', date: '14 Jun, 09:15 AM', amount: -180.00, color: '#8b5cf6', icon: Zap },
  { id: 5, name: 'Starbucks', category: 'Comida', date: '13 Jun, 16:20 PM', amount: -18.50, color: '#10b981', icon: Coffee },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
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
            <span className="text-slate-500 text-sm hidden sm:inline-block font-medium">Hola, Alejandro</span>
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
            
            <div className="space-y-5">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-11 h-11 rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 transition-all group-hover:scale-105"
                      style={{ backgroundColor: `${tx.color}15`, color: tx.color }}
                    >
                      <tx.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{tx.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold text-sm tracking-tight",
                    tx.amount > 0 ? "text-emerald-600" : "text-slate-900"
                  )}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
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
    </div>
  );
}
