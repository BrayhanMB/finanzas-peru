import { useState, useMemo } from 'react';
import AllTransactionsModal from './AllTransactionsModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

interface ReportsProps {
  transactions: Transaction[];
  onEdit: (tx: any) => void;
  onDelete: (id: string) => void;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', 
  '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'
];

export default function Reports({ transactions, onEdit, onDelete }: ReportsProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const { totalIncome, totalExpense, expenseByCategory, incomeByCategory } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const expByCategory: Record<string, number> = {};
    const incByCategory: Record<string, number> = {};

    filteredTransactions.forEach(tx => {
      const amount = Number(tx.amount);
      if (tx.type === 'income' || tx.type === 'savings_withdrawal' || tx.category === 'Préstamo a mi favor') {
        income += amount;
        incByCategory[tx.category] = (incByCategory[tx.category] || 0) + amount;
      } else if (tx.type === 'expense' || tx.type === 'savings_deposit') {
        expense += amount;
        expByCategory[tx.category] = (expByCategory[tx.category] || 0) + amount;
      }
    });

    return { totalIncome: income, totalExpense: expense, expenseByCategory: expByCategory, incomeByCategory: incByCategory };
  }, [filteredTransactions]);

  const netBalance = totalIncome - totalExpense;

  const pieChartData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const barChartData = [
    {
      name: 'Resumen',
      Ingresos: totalIncome,
      Gastos: totalExpense,
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 mb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/50">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Análisis Financiero</h2>
          <p className="text-slate-500 text-sm">Desglose detallado de tu dinero</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl shadow-emerald-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-slate-600 font-medium">Ingresos Totales</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">S/ {totalIncome.toFixed(2)}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl shadow-rose-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-slate-600 font-medium">Gastos Totales</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">S/ {totalExpense.toFixed(2)}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <DollarSign size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-slate-600 font-medium">Balance Neto</h3>
          </div>
          <p className={cn("text-3xl font-bold mt-2", netBalance >= 0 ? "text-slate-900" : "text-rose-600")}>
            {netBalance >= 0 ? '+' : '-'}S/ {Math.abs(netBalance).toFixed(2)}
          </p>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PieChartIcon size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Sin movimientos</h3>
          <p className="text-slate-500">No hay registros financieros para {MONTHS[selectedMonth]} {selectedYear}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Charts Area */}
          <div className="space-y-6">
            
            {/* Pie Chart: Expenses by Category */}
            {pieChartData.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Distribución de Gastos</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Gasto']}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Bar Chart: Income vs Expense */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Flujo de Efectivo</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `S/${val}`} />
                    <RechartsTooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    <Bar dataKey="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>

          {/* Detailed Lists Area */}
          <div className="space-y-6">
            
            {/* Top Expenses List */}
            {pieChartData.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 h-full">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Detalle de Gastos</h3>
                <div className="space-y-4">
                  {pieChartData.map((category, index) => (
                    <button 
                      key={category.name} 
                      onClick={() => setSelectedCategory(category.name)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-slate-700">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-600 block">S/ {category.value.toFixed(2)}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {((category.value / totalExpense) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Top Incomes List */}
            {Object.keys(incomeByCategory).length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Fuentes de Ingreso</h3>
                <div className="space-y-4">
                  {Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]).map(([name, value]) => (
                    <button 
                      key={name} 
                      onClick={() => setSelectedCategory(name)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <TrendingUp size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-medium text-slate-700">{name}</span>
                      </div>
                      <span className="font-bold text-emerald-600 block">S/ {value.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      <AllTransactionsModal 
        isOpen={selectedCategory !== null}
        onClose={() => setSelectedCategory(null)}
        transactions={filteredTransactions.filter(tx => tx.category === selectedCategory)}
        onEdit={onEdit}
        onDelete={onDelete}
        title={`Detalle: ${selectedCategory}`}
        subtitle={`Movimientos de ${MONTHS[selectedMonth]} ${selectedYear}`}
      />

    </div>
  );
}
