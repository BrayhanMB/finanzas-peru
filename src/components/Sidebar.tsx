import { useState, useEffect } from 'react';
import { LayoutDashboard, PieChart, Bell, Settings, LogOut, CreditCard, Moon, Sun } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TabType = 'dashboard' | 'reportes' | 'alertas' | 'pagos';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenSettings, onLogout }: SidebarProps) {
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reportes', label: 'Reportes', icon: PieChart },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'alertas', label: 'Alertas', icon: Bell },
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
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" 
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
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            <Settings size={20} />
            Ajustes
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

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-30 px-6 py-3 flex justify-between items-center pb-[max(env(safe-area-inset-bottom),1rem)] transition-colors">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
          <span className="text-[10px] font-medium">Tema</span>
        </button>
      </div>
    </>
  );
}
