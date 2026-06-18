import { LayoutDashboard, PieChart, Bell, Settings, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TabType = 'dashboard' | 'reportes' | 'alertas';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenSettings, onLogout }: SidebarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reportes', label: 'Reportes', icon: PieChart },
    { id: 'alertas', label: 'Alertas', icon: Bell },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-slate-100 fixed top-0 left-0 z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-300 flex items-center justify-center shadow-sm">
            <span className="text-2xl leading-none">🐧</span>
          </div>
          <h1 className="font-bold text-2xl text-slate-900 tracking-tight">Finanzas</h1>
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
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Settings size={20} />
            Ajustes
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 z-30 px-6 py-3 flex justify-between items-center pb-[max(env(safe-area-inset-bottom),1rem)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                isActive ? "text-indigo-600" : "text-slate-400"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-slate-400 hover:text-slate-600"
        >
          <Settings size={24} />
          <span className="text-[10px] font-medium">Ajustes</span>
        </button>
      </div>
    </>
  );
}
