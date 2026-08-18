import React from 'react';

interface PDFReportTemplateProps {
  monthName: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsGoal: number;
  incomes: any[];
  expenses: any[];
}

export const PDFReportTemplate: React.FC<PDFReportTemplateProps> = ({
  monthName,
  year,
  totalIncome,
  totalExpense,
  netBalance,
  savingsGoal,
  incomes,
  expenses
}) => {
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

  return (
    <div id="pdf-report-content" className="bg-white text-slate-900 w-[800px] p-10 font-sans">
      <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Estado de Cuenta Mensual</h1>
          <p className="text-lg text-slate-600 mt-2 font-medium">Finanzas Personales - {monthName} {year}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Generado automáticamente</p>
          <p className="text-sm font-bold text-indigo-600">Para Análisis de Inteligencia Artificial</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Ingresos Totales</p>
          <p className="text-xl font-black text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Gastos Totales</p>
          <p className="text-xl font-black text-rose-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Balance Neto</p>
          <p className="text-xl font-black text-indigo-600">{formatCurrency(netBalance)}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Meta de Ahorro</p>
          <p className="text-xl font-black text-slate-900">{formatCurrency(savingsGoal)}</p>
        </div>
      </div>

      {/* Detalle de Ingresos */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">1. Detalle de Ingresos</h2>
        {incomes.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No hay ingresos registrados en este mes.</p>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="py-2 px-3 border border-slate-200 font-bold w-1/4">Fecha</th>
                <th className="py-2 px-3 border border-slate-200 font-bold w-1/4">Categoría</th>
                <th className="py-2 px-3 border border-slate-200 font-bold w-1/3">Descripción</th>
                <th className="py-2 px-3 border border-slate-200 font-bold w-1/6 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(tx => (
                <tr key={tx.id} className="border-b border-slate-100">
                  <td className="py-2 px-3 border border-slate-200 text-slate-600">{formatDate(tx.created_at)}</td>
                  <td className="py-2 px-3 border border-slate-200 font-medium text-slate-800">{tx.category}</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-600">{tx.description || '-'}</td>
                  <td className="py-2 px-3 border border-slate-200 font-bold text-emerald-600 text-right">{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detalle de Gastos */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">2. Detalle de Gastos</h2>
        {expenses.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No hay gastos registrados en este mes.</p>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="py-2 px-3 border border-slate-200 font-bold w-1/4">Fecha</th>
                <th className="py-2 px-3 border border-slate-200 font-bold w-1/4">Categoría</th>
                <th className="py-2 px-3 border border-slate-200 font-bold w-1/3">Descripción</th>
                <th className="py-2 px-3 border border-slate-200 font-bold w-1/6 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(tx => (
                <tr key={tx.id} className="border-b border-slate-100">
                  <td className="py-2 px-3 border border-slate-200 text-slate-600">{formatDate(tx.created_at)}</td>
                  <td className="py-2 px-3 border border-slate-200 font-medium text-slate-800">{tx.category}</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-600">{tx.description || '-'}</td>
                  <td className="py-2 px-3 border border-slate-200 font-bold text-rose-600 text-right">{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
