import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setLoading(false);
  };

  useEffect(() => {
    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      // Si recibimos un token de refresco de un proveedor (Google), guardarlo
      if (session?.provider_refresh_token && session?.provider_token) {
        try {
          await supabase.from('user_integrations').upsert({
            user_id: session.user.id,
            provider: 'google',
            refresh_token: session.provider_refresh_token,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, provider' });
        } catch (e) {
          console.error("Error guardando token de integracion", e);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
  const hasCompletedOnboarding = session.user.user_metadata?.onboarding_completed;

  if (!hasCompletedOnboarding) {
    return (
      <Onboarding 
        userName={userName.split(' ')[0]} 
        onComplete={() => fetchSession()} 
      />
    );
  }

  return <Dashboard userName={userName} userMetadata={session.user.user_metadata} onLogout={() => supabase.auth.signOut()} />;
}
