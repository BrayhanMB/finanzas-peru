import { useState, useEffect } from 'react';
import { LayoutDashboard, ArrowLeftRight, PieChart, User, LogOut, Moon, Sun, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TabType = 'dashboard' | 'movimientos' | 'reportes' | 'perfil';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenNewTransaction: () => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenNewTransaction, onLogout }: SidebarProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const desktopTabs = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'reportes', label: 'Reportes', icon: PieChart },
    { id: 'perfil', label: 'Perfil', icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 fixed top-0 left-0 z-30 transition-colors">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-300 dark:bg-sky-500/20 dark:text-sky-400 flex items-center justify-center shadow-sm">
            <span className="text-2xl leading-none">🐧</span>
          </div>
          <h1 className="font-bold text-2xl text-slate-900 dark:text-white tracking-tight">Finanzas</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {desktopTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar (Apple Tab Bar con Botón Central Destacado) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/80 z-40 px-3 py-2 flex items-center justify-around pb-[max(env(safe-area-inset-bottom),0.75rem)] transition-colors shadow-lg shadow-slate-900/5">
        
        {/* 1. Inicio */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all",
            activeTab === 'dashboard' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
          )}
        >
          <LayoutDashboard size={22} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Inicio</span>
        </button>

        {/* 2. Movimientos */}
        <button
          onClick={() => setActiveTab('movimientos')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all",
            activeTab === 'movimientos' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
          )}
        >
          <ArrowLeftRight size={22} strokeWidth={activeTab === 'movimientos' ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Movimientos</span>
        </button>

        {/* 3. Botón Central Destacado: Nuevo Movimiento */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            onClick={onOpenNewTransaction}
            className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 border-4 border-slate-50 dark:border-slate-950 transition-transform active:scale-90"
            title="Nuevo Movimiento"
          >
            <Plus size={26} strokeWidth={2.8} />
          </button>
        </div>

        {/* 4. Reportes */}
        <button
          onClick={() => setActiveTab('reportes')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all",
            activeTab === 'reportes' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
          )}
        >
          <PieChart size={22} strokeWidth={activeTab === 'reportes' ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Reportes</span>
        </button>

        {/* 5. Perfil */}
        <button
          onClick={() => setActiveTab('perfil')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all",
            activeTab === 'perfil' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
          )}
        >
          <User size={22} strokeWidth={activeTab === 'perfil' ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Perfil</span>
        </button>
      </div>
    </>
  );
}
