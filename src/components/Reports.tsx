import { useState, useMemo } from 'react';
import AllTransactionsModal from './AllTransactionsModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Download, Loader2, ChevronRight, BarChart2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  savingsGoal: number;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const COLORS = [
  '#6366f1', '#0ea5e9', '#3b82f6', '#ec4899', '#10b981', 
  '#f59e0b', '#f43f5e', '#14b8a6', '#ef4444', '#8b5cf6', '#64748b', '#f97316'
];

const normalizeCategoryName = (category: string) => {
  if (category === 'Servicios del Hogar') return 'Servicios';
  if (category === 'Gustos / Antojos') return 'Gustos';
  if (category === 'Pago de deuda') return 'Deudas';
  if (category === 'Internet y Celular') return 'Celular';
  return category;
};

export default function Reports({ transactions, onEdit, onDelete, savingsGoal }: ReportsProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState<'income' | 'expense' | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [chartView, setChartView] = useState<'dona' | 'flujo'>('dona');

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
      const categoryName = normalizeCategoryName(tx.category);

      if (tx.type === 'income' || tx.type === 'savings_withdrawal' || tx.category === 'Préstamo a mi favor') {
        income += amount;
        incByCategory[categoryName] = (incByCategory[categoryName] || 0) + amount;
      } else if (tx.type === 'expense' || tx.type === 'savings_deposit') {
        expense += amount;
        expByCategory[categoryName] = (expByCategory[categoryName] || 0) + amount;
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

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const monthName = MONTHS[selectedMonth];
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
          style: 'currency',
          currency: 'PEN'
        }).format(amount).replace('PEN', 'S/');
      };
      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-PE', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      };

      doc.setFontSize(22);
      doc.text('Estado de Cuenta Mensual', 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Finanzas Personales - ${monthName} ${selectedYear}`, 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text('RESUMEN', 14, 40);
      doc.setTextColor(0);
      doc.text(`Ingresos Totales: ${formatCurrency(totalIncome)}`, 14, 46);
      doc.text(`Gastos Totales: ${formatCurrency(totalExpense)}`, 14, 52);
      doc.text(`Balance Neto: ${formatCurrency(netBalance)}`, 14, 58);
      doc.text(`Meta de Ahorro: ${formatCurrency(savingsGoal)}`, 14, 64);

      const incomes = filteredTransactions.filter(tx => tx.type === 'income' || tx.type === 'savings_withdrawal' || tx.category === 'Préstamo a mi favor');
      const expenses = filteredTransactions.filter(tx => (tx.type === 'expense' || tx.type === 'savings_deposit') && tx.category !== 'Préstamo a mi favor');

      let currentY = 75;

      doc.setFontSize(12);
      doc.text('1. Detalle de Ingresos', 14, currentY);
      currentY += 5;

      if (incomes.length === 0) {
        doc.setFontSize(10);
        doc.text('No hay ingresos registrados en este mes.', 14, currentY + 5);
        currentY += 15;
      } else {
        autoTable(doc, {
          startY: currentY,
          head: [['Fecha', 'Categoría', 'Descripción', 'Monto']],
          body: incomes.map(tx => [
            formatDate(tx.created_at),
            normalizeCategoryName(tx.category),
            tx.description || '-',
            formatCurrency(tx.amount)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [5, 150, 105] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      doc.setFontSize(12);
      doc.text('2. Detalle de Gastos', 14, currentY);
      currentY += 5;

      if (expenses.length === 0) {
        doc.setFontSize(10);
        doc.text('No hay gastos registrados en este mes.', 14, currentY + 5);
      } else {
        autoTable(doc, {
          startY: currentY,
          head: [['Fecha', 'Categoría', 'Descripción', 'Monto']],
          body: expenses.map(tx => [
            formatDate(tx.created_at),
            normalizeCategoryName(tx.category),
            tx.description || '-',
            formatCurrency(tx.amount)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [225, 29, 72] }
        });
      }

      doc.save(`Reporte_Finanzas_${monthName}_${selectedYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 mt-4 pb-28 space-y-6">
      
      {/* Header and iOS Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reportes</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Análisis mensual de tus finanzas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {isGeneratingPDF ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Container con diseño unificado estilo Apple (Igual a la página de inicio) */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-1">Resumen del Mes:</h3>
        
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-3 divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-100 dark:border-slate-800/80 shadow-sm">
          {/* Ingresos Totales */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Ingresos Totales</h4>
                <p className="text-xs text-slate-400">Total percibido</p>
              </div>
            </div>
            <span className="font-extrabold text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
              +{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(totalIncome)}
            </span>
          </div>

          {/* Gastos Totales */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <TrendingDown size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Gastos Totales</h4>
                <p className="text-xs text-slate-400">Total consumido</p>
              </div>
            </div>
            <span className="font-extrabold text-base sm:text-lg text-rose-600 dark:text-rose-400">
              -{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(totalExpense)}
            </span>
          </div>

          {/* Balance Neto */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <DollarSign size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Balance Neto</h4>
                <p className="text-xs text-slate-400">Diferencia final</p>
              </div>
            </div>
            <span className={cn("font-extrabold text-base sm:text-lg", netBalance >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600")}>
              {netBalance >= 0 ? '+' : '-'}S/ {Math.abs(netBalance).toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <PieChartIcon size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Sin movimientos</h3>
          <p className="text-slate-400 text-xs">No hay transacciones para {MONTHS[selectedMonth]} {selectedYear}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Fusión Visual de Gráficos: Distribución y Flujo en una sola tarjeta compacta */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            
            {/* Toggle Segmentado Apple entre Distribución y Flujo */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {chartView === 'dona' ? 'Distribución de Gastos' : 'Flujo de Efectivo'}
              </h3>
              
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setChartView('dona')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    chartView === 'dona'
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  <PieChartIcon size={14} />
                  <span>Dona</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('flujo')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    chartView === 'flujo'
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  <BarChart2 size={14} />
                  <span>Flujo</span>
                </button>
              </div>
            </div>

            {/* Vista 1: Gráfico de Dona Centrado */}
            {chartView === 'dona' && (
              <div className="h-[230px] w-full flex items-center justify-center relative animate-in fade-in zoom-in-95 duration-200">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData.length > 0 ? pieChartData : [{ name: 'Sin gastos', value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
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
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gastos</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">S/ {totalExpense.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Vista 2: Gráfico de Flujo de Efectivo Centrado */}
            {chartView === 'flujo' && (
              <div className="h-[230px] w-full animate-in fade-in zoom-in-95 duration-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `S/${val}`} />
                    <RechartsTooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="Ingresos" fill="#10b981" radius={[10, 10, 0, 0]} maxBarSize={55} />
                    <Bar dataKey="Gastos" fill="#f43f5e" radius={[10, 10, 0, 0]} maxBarSize={55} />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Leyenda minimalista integrada */}
                <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Ingresos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Gastos</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Listas Detalladas Apple Style con Tap para abrir desglose */}
          <div className="space-y-6">
            {pieChartData.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Detalle de Gastos</h3>
                  <span className="text-[11px] text-slate-400">Toca para ver semanas</span>
                </div>
                <div className="space-y-2.5">
                  {pieChartData.map((category, index) => (
                    <button 
                      key={category.name} 
                      onClick={() => { setSelectedCategory(category.name); setSelectedCategoryType('expense'); }}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-extrabold text-rose-600 dark:text-rose-400 block text-sm">S/ {category.value.toFixed(2)}</span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {((category.value / totalExpense) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {Object.keys(incomeByCategory).length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">Fuentes de Ingreso</h3>
                <div className="space-y-2.5">
                  {Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]).map(([name, value]) => (
                    <button 
                      key={name} 
                      onClick={() => { setSelectedCategory(name); setSelectedCategoryType('income'); }}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <TrendingUp size={16} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block text-sm">S/ {value.toFixed(2)}</span>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal con desglose semanal ajustado al calendario */}
      <AllTransactionsModal 
        isOpen={selectedCategory !== null}
        onClose={() => { setSelectedCategory(null); setSelectedCategoryType(null); }}
        transactions={filteredTransactions.filter(tx => {
          const normCat = normalizeCategoryName(tx.category);
          if (normCat !== selectedCategory && tx.category !== selectedCategory) return false;
          if (selectedCategoryType === 'income') {
            return tx.type === 'income' || tx.type === 'savings_withdrawal' || tx.category === 'Préstamo a mi favor';
          }
          return (tx.type === 'expense' || tx.type === 'savings_deposit') && tx.category !== 'Préstamo a mi favor';
        })}
        onEdit={onEdit}
        onDelete={onDelete}
        title={`Detalle: ${selectedCategory}`}
        subtitle={`Movimientos de ${MONTHS[selectedMonth]} ${selectedYear}`}
        showWeeklyChart={true}
        month={selectedMonth}
        year={selectedYear}
      />
    </div>
  );
}
