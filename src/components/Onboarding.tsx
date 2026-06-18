import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, Wallet, Target, ChevronRight, CheckCircle2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  userName: string;
}

export default function Onboarding({ onComplete, userName }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [whatsapp, setWhatsapp] = useState('');
  const [balance, setBalance] = useState('');
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Limpiar y formatear el número para que coincida con el formato de Meta API (ej. 51999888777)
      let cleanPhone = whatsapp.replace(/\D/g, ''); // Quitar todo lo que no sea número (espacios, guiones, +)
      if (cleanPhone.length === 9) {
        cleanPhone = '51' + cleanPhone; // Agregar código de Perú si solo pusieron los 9 dígitos
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          whatsapp_number: cleanPhone,
          initial_balance: Number(balance),
          monthly_income: Number(income),
          savings_goal: Number(goal),
        }
      });
      if (error) throw error;
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar tus datos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center p-4">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-200">
        <div 
          className="h-full bg-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={() => supabase.auth.signOut()}
        className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors"
      >
        Cerrar sesión
      </button>

      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-10 transition-all">
          <div className="w-16 h-16 rounded-3xl bg-sky-300 flex items-center justify-center shadow-lg shadow-sky-300/40 mx-auto mb-6">
            <span className="text-3xl leading-none">🐧</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {step === 1 && `¡Hola ${userName}! Conectemos tu WhatsApp`}
            {step === 2 && 'Tu foto financiera actual'}
            {step === 3 && 'Definamos tu gran meta'}
          </h2>
          <p className="text-slate-500 mt-3 text-lg">
            {step === 1 && 'Ingresa tu número para que la IA pueda hablar contigo.'}
            {step === 2 && 'Sin tablas. Solo dinos cuánto tienes y cuánto ganas.'}
            {step === 3 && '¿Para qué quieres ahorrar? Ponle un número a ese sueño.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-xl border border-slate-100 min-h-[300px] flex flex-col justify-center">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-[#25D366]/10 p-4 rounded-2xl">
                <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-[#25D366]/30">
                  <MessageCircle size={24} className="text-white" fill="currentColor" />
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Nuestra IA se comunicará a este número para que registres tus ingresos y gastos enviando un simple mensaje de voz o texto.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Número de WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+51</span>
                  <input 
                    type="tel" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-semibold text-lg"
                    placeholder="999 888 777"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <Wallet size={24} strokeWidth={2.5} />
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Esta información le dará contexto a la IA para aconsejarte mejor sobre tus gastos diarios y proyectar tu mes.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Dinero Inicial (S/)</label>
                  <p className="text-xs text-slate-500 mb-2">Ingresa el dinero que dispones actualmente.</p>
                  <input 
                    type="number" 
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-semibold text-lg"
                    placeholder="Ej. 1250"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Ingreso Mensual (S/) <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Si tu ingreso es variable, déjalo en blanco.</p>
                  <input 
                    type="number" 
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-semibold text-lg"
                    placeholder="Ej. 3500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-2xl">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <Target size={24} strokeWidth={2.5} />
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Tener una meta clara te ayudará a no salirte de tu presupuesto. La IA te recordará cuánto te falta para lograrlo.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Meta de Ahorro Total (S/)</label>
                <input 
                  type="number" 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 font-semibold text-lg"
                  placeholder="Ej. 10000"
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mt-10 flex justify-end">
            {step < 3 ? (
              <button 
                onClick={handleNext}
                disabled={
                  (step === 1 && !whatsapp) || 
                  (step === 2 && !balance)
                }
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                Siguiente
                <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={!goal || loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Finalizar y ver Dashboard
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
