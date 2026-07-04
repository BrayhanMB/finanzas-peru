import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, MoreVertical, Edit2, Trash2, Calendar, CreditCard, Loader2 } from 'lucide-react';
import PaymentModal, { type RecurringPayment } from './PaymentModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Payments() {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('recurring_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('due_day', { ascending: true });
        
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching recurring payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este pago recurrente?')) return;
    try {
      const { error } = await supabase.from('recurring_payments').delete().eq('id', id);
      if (error) throw error;
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al eliminar el pago.');
    }
  };

  const totalMonthly = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  // Calcular días restantes para los pagos de este mes
  const getStatus = (dueDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    
    if (dueDay === currentDay) return { label: 'Vence Hoy', color: 'text-rose-600 bg-rose-50' };
    if (dueDay > currentDay && dueDay <= currentDay + 5) return { label: `Faltan ${dueDay - currentDay} días`, color: 'text-amber-600 bg-amber-50' };
    if (dueDay < currentDay) return { label: 'Ya pasó este mes', color: 'text-emerald-600 bg-emerald-50' };
    return { label: `Día ${dueDay}`, color: 'text-slate-600 bg-slate-100' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 mb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Pagos Fijos</h2>
          <p className="text-slate-500 mt-1">Controla tus suscripciones y gastos recurrentes</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingPayment(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Nuevo Pago
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/50">
        
        <div className="flex items-center gap-4 mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-indigo-600/80 font-medium text-sm">Compromiso Mensual Total</p>
            <p className="text-2xl font-bold text-indigo-900">S/ {totalMonthly.toFixed(2)}</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-16 border border-slate-100 border-dashed rounded-[2rem] bg-slate-50/50">
            <div className="w-16 h-16 bg-white text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No hay pagos registrados</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">Añade tus pagos fijos como alquiler, agua, luz o Netflix para tener un control exacto de tus obligaciones del mes.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
            >
              Añadir mi primer pago
            </button>
          </div>
        ) : (
          <div className="space-y-4 relative" onClick={() => setActiveDropdownId(null)}>
            {payments.map(payment => {
              const status = getStatus(payment.due_day);
              
              return (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                  
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0 text-slate-700">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Día</span>
                      <span className="text-xl font-bold">{payment.due_day}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{payment.name}</h4>
                      {payment.details && (
                        <p className="text-slate-500 text-sm">{payment.details}</p>
                      )}
                      <div className="mt-2 sm:hidden inline-block">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", status.color)}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-0 border-slate-100 pt-4 sm:pt-0">
                    
                    <div className="hidden sm:block">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", status.color)}>
                        {status.label}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-xl">
                      S/ {Number(payment.amount).toFixed(2)}
                    </div>

                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === payment.id ? null : payment.id); }} 
                        className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {activeDropdownId === payment.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditingPayment(payment); setActiveDropdownId(null); setIsModalOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium">
                            <Edit2 size={16} /> Editar
                          </button>
                          <button onClick={() => { handleDelete(payment.id); setActiveDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium">
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPayments}
        initialData={editingPayment}
      />
    </div>
  );
}
