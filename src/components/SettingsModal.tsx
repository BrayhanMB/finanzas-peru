import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, MessageCircle, User, Webhook } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userMetadata: any;
  onSuccess: () => void;
}

export default function SettingsModal({ isOpen, onClose, userMetadata, onSuccess }: SettingsModalProps) {
  const [whatsapp, setWhatsapp] = useState('');
  const [income, setIncome] = useState('');
  const [balance, setBalance] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfil' | 'whatsapp' | 'automatizacion'>('perfil');

  useEffect(() => {
    if (userMetadata) {
      setWhatsapp(userMetadata.whatsapp_number || '');
      setIncome(userMetadata.monthly_income || '');
      setBalance(userMetadata.initial_balance || '');
      setGoal(userMetadata.savings_goal || '');
    }
  }, [userMetadata]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase.auth.updateUser({
        data: {
          whatsapp_number: whatsapp,
          monthly_income: income ? Number(income) : null,
          initial_balance: balance ? Number(balance) : null,
          savings_goal: goal ? Number(goal) : null
        }
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar los ajustes');
    } finally {
      setLoading(false);
    }
  };

  const webhookUrl = `https://[TU-PROYECTO].supabase.co/functions/v1/parse-bank-email?user_id=AQUI_TU_ID_DE_USUARIO`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Ajustes de Cuenta</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-2 pt-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex-1 pb-3 pt-2 px-2 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${
              activeTab === 'perfil' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User size={16} />
            Perfil
            {activeTab === 'perfil' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 pb-3 pt-2 px-2 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${
              activeTab === 'whatsapp' ? 'text-[#25D366]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageCircle size={16} />
            WhatsApp
            {activeTab === 'whatsapp' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#25D366] rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('automatizacion')}
            className={`flex-1 pb-3 pt-2 px-2 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${
              activeTab === 'automatizacion' ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Webhook size={16} />
            Auto
            {activeTab === 'automatizacion' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-t-full" />
            )}
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'perfil' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Dinero Inicial (S/)</label>
                <input 
                  type="number" 
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Ingreso Mensual Fijo (S/) <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
                </label>
                <input 
                  type="number" 
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Meta de Ahorro (S/)</label>
                <input 
                  type="number" 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold"
                />
              </div>
            </>
          )}

          {activeTab === 'whatsapp' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Número de WhatsApp</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+51</span>
                <input 
                  type="tel" 
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold"
                  placeholder="999 888 777"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">El bot solo leerá mensajes desde este número.</p>
            </div>
          )}

          {activeTab === 'automatizacion' && (
            <div className="space-y-4">
              <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 text-sm text-violet-800">
                <p className="font-bold mb-1">Vinculación con Correos Bancarios</p>
                <p>Puedes usar herramientas como Zapier o Make.com para registrar consumos de Yape, BCP y BBVA automáticamente.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Instrucciones:</label>
                <ol className="list-decimal pl-4 text-sm text-slate-600 space-y-2">
                  <li>Crea una cuenta en Zapier (Email Parser).</li>
                  <li>Configura una regla de reenvío automático en tu Gmail hacia el correo que te da Zapier.</li>
                  <li>En Zapier, haz que envíe un "POST" (Webhook) a esta dirección:</li>
                </ol>
                <div className="mt-3 p-3 bg-slate-900 rounded-xl relative group">
                  <code className="text-xs text-emerald-400 break-all">
                    {webhookUrl}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 size={20} />
                Guardar Ajustes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
