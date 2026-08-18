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

  const colors = {
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    emerald600: '#059669',
    rose600: '#e11d48',
    indigo600: '#4f46e5',
  };

  return (
    <div id="pdf-report-content" className="w-[800px] p-10 font-sans" style={{ backgroundColor: colors.white, color: colors.slate900 }}>
      <div className="border-b-2 pb-6 mb-8 flex justify-between items-end" style={{ borderColor: colors.slate900 }}>
        <div>
          <h1 className="text-3xl font-black" style={{ color: colors.slate900 }}>Estado de Cuenta Mensual</h1>
          <p className="text-lg mt-2 font-medium" style={{ color: colors.slate600 }}>Finanzas Personales - {monthName} {year}</p>
        </div>
        <div className="text-right">
          <p className="text-sm" style={{ color: colors.slate500 }}>Generado automáticamente</p>
          <p className="text-sm font-bold" style={{ color: colors.indigo600 }}>Para Análisis de Inteligencia Artificial</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="p-4 rounded-xl border" style={{ backgroundColor: colors.slate50, borderColor: colors.slate200 }}>
          <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: colors.slate500 }}>Ingresos Totales</p>
          <p className="text-xl font-black" style={{ color: colors.emerald600 }}>{formatCurrency(totalIncome)}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ backgroundColor: colors.slate50, borderColor: colors.slate200 }}>
          <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: colors.slate500 }}>Gastos Totales</p>
          <p className="text-xl font-black" style={{ color: colors.rose600 }}>{formatCurrency(totalExpense)}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ backgroundColor: colors.slate50, borderColor: colors.slate200 }}>
          <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: colors.slate500 }}>Balance Neto</p>
          <p className="text-xl font-black" style={{ color: colors.indigo600 }}>{formatCurrency(netBalance)}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ backgroundColor: colors.slate50, borderColor: colors.slate200 }}>
          <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: colors.slate500 }}>Meta de Ahorro</p>
          <p className="text-xl font-black" style={{ color: colors.slate900 }}>{formatCurrency(savingsGoal)}</p>
        </div>
      </div>

      {/* Detalle de Ingresos */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: colors.slate900, borderColor: colors.slate200 }}>1. Detalle de Ingresos</h2>
        {incomes.length === 0 ? (
          <p className="text-sm italic" style={{ color: colors.slate500 }}>No hay ingresos registrados en este mes.</p>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.slate100, color: colors.slate700 }}>
                <th className="py-2 px-3 border font-bold w-1/4" style={{ borderColor: colors.slate200 }}>Fecha</th>
                <th className="py-2 px-3 border font-bold w-1/4" style={{ borderColor: colors.slate200 }}>Categoría</th>
                <th className="py-2 px-3 border font-bold w-1/3" style={{ borderColor: colors.slate200 }}>Descripción</th>
                <th className="py-2 px-3 border font-bold w-1/6 text-right" style={{ borderColor: colors.slate200 }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(tx => (
                <tr key={tx.id} className="border-b" style={{ borderColor: colors.slate100 }}>
                  <td className="py-2 px-3 border" style={{ borderColor: colors.slate200, color: colors.slate600 }}>{formatDate(tx.created_at)}</td>
                  <td className="py-2 px-3 border font-medium" style={{ borderColor: colors.slate200, color: colors.slate800 }}>{tx.category}</td>
                  <td className="py-2 px-3 border" style={{ borderColor: colors.slate200, color: colors.slate600 }}>{tx.description || '-'}</td>
                  <td className="py-2 px-3 border font-bold text-right" style={{ borderColor: colors.slate200, color: colors.emerald600 }}>{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detalle de Gastos */}
      <div>
        <h2 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: colors.slate900, borderColor: colors.slate200 }}>2. Detalle de Gastos</h2>
        {expenses.length === 0 ? (
          <p className="text-sm italic" style={{ color: colors.slate500 }}>No hay gastos registrados en este mes.</p>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.slate100, color: colors.slate700 }}>
                <th className="py-2 px-3 border font-bold w-1/4" style={{ borderColor: colors.slate200 }}>Fecha</th>
                <th className="py-2 px-3 border font-bold w-1/4" style={{ borderColor: colors.slate200 }}>Categoría</th>
                <th className="py-2 px-3 border font-bold w-1/3" style={{ borderColor: colors.slate200 }}>Descripción</th>
                <th className="py-2 px-3 border font-bold w-1/6 text-right" style={{ borderColor: colors.slate200 }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(tx => (
                <tr key={tx.id} className="border-b" style={{ borderColor: colors.slate100 }}>
                  <td className="py-2 px-3 border" style={{ borderColor: colors.slate200, color: colors.slate600 }}>{formatDate(tx.created_at)}</td>
                  <td className="py-2 px-3 border font-medium" style={{ borderColor: colors.slate200, color: colors.slate800 }}>{tx.category}</td>
                  <td className="py-2 px-3 border" style={{ borderColor: colors.slate200, color: colors.slate600 }}>{tx.description || '-'}</td>
                  <td className="py-2 px-3 border font-bold text-right" style={{ borderColor: colors.slate200, color: colors.rose600 }}>{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
