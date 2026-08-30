import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, CheckCircle2, User, MessageCircle, Mail } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userMetadata: any;
  onSuccess: () => void;
}

export default function SettingsModal({ isOpen, onClose, userMetadata, onSuccess }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfil' | 'whatsapp' | 'automatizacion'>('perfil');
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [whatsapp, setWhatsapp] = useState('');
  const [balance, setBalance] = useState('');
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');

  useEffect(() => {
    if (userMetadata) {
      setWhatsapp(userMetadata.whatsapp_number?.replace('51', '') || '');
      setBalance(userMetadata.initial_balance?.toString() || '');
      setIncome(userMetadata.monthly_income?.toString() || '');
      setGoal(userMetadata.savings_goal?.toString() || '');
    }
  }, [userMetadata]);

  // Check if Gmail is connected
  useEffect(() => {
    async function checkIntegration() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('user_integrations')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('provider', 'google')
        .single();
        
      if (data) setIsGmailConnected(true);
    }
    if (isOpen) {
      checkIntegration();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      let cleanPhone = whatsapp.replace(/\D/g, '');
      if (cleanPhone.length === 9) {
        cleanPhone = '51' + cleanPhone;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          whatsapp_number: cleanPhone,
          initial_balance: Number(balance),
          monthly_income: Number(income),
          savings_goal: Number(goal),
        }
      });
      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar los ajustes.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error(error);
      alert("Error conectando con Google");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Ajustes de Cuenta</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-2 pt-2 bg-slate-50/50">
          <button onClick={() => setActiveTab('perfil')} className={`flex-1 pb-3 pt-2 px-2 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${activeTab === 'perfil' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <User size={16} />
            Perfil
            {activeTab === 'perfil' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
          <button onClick={() => setActiveTab('whatsapp')} className={`flex-1 pb-3 pt-2 px-2 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${activeTab === 'whatsapp' ? 'text-[#25D366]' : 'text-slate-400 hover:text-slate-600'}`}>
            <MessageCircle size={16} />
            WhatsApp
            {activeTab === 'whatsapp' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#25D366] rounded-t-full" />}
          </button>
          <button onClick={() => setActiveTab('automatizacion')} className={`flex-1 pb-3 pt-2 px-2 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${activeTab === 'automatizacion' ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}`}>
            <Mail size={16} />
            Gmail
            {activeTab === 'automatizacion' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-t-full" />}
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'perfil' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Dinero Inicial (S/)</label>
                <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ingreso Mensual Fijo (S/) <span className="text-slate-400 font-normal ml-1">(Opcional)</span></label>
                <p className="text-xs text-slate-500 mb-2">Si tu ingreso es variable, déjalo en blanco.</p>
                <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Meta de Ahorro (S/)</label>
                <input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold" />
              </div>
            </>
          )}

          {activeTab === 'whatsapp' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Número de WhatsApp</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+51</span>
                <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 font-semibold" placeholder="999 888 777" />
              </div>
              <p className="text-xs text-slate-500 mt-1">El bot solo leerá mensajes desde este número.</p>
            </div>
          )}

          {activeTab === 'automatizacion' && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-800">
                <p className="font-bold mb-1">Automatización de Gastos</p>
                <p>Conecta tu correo para que la app lea automáticamente tus consumos de Yape, BCP y BBVA.</p>
              </div>
              
              {isGmailConnected ? (
                <div className="flex items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl font-medium border border-emerald-200">
                  <CheckCircle2 size={20} />
                  Gmail Conectado
                </div>
              ) : (
                <button
                  onClick={handleConnectGmail}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-4 rounded-xl transition-all"
                >
                  {isConnecting ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <img src="https://www.gstatic.com/images/branding/product/1x/gmail_32dp.png" alt="Gmail" className="w-5 h-5" />
                      Conectar mi Gmail
                    </>
                  )}
                </button>
              )}
              <p className="text-xs text-slate-500 text-center mt-2">Solo pediremos permiso de lectura (`readonly`).</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button onClick={handleSave} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
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
