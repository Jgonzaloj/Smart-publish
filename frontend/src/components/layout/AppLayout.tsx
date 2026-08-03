// Removed React import
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, PenTool, Settings, Bell, User } from 'lucide-react';

export const AppLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/calendar', icon: <Calendar size={20} />, label: 'Calendario' },
    { path: '/compose', icon: <PenTool size={20} />, label: 'Crear Post' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-slate-200 dark:border-slate-800 flex flex-col m-4 mr-0 rounded-r-none shadow-none border-y border-l">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
            Smart Publish
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden m-4 ml-0 glass-panel rounded-l-none border-y border-r shadow-sm">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
          <div className="flex-1">
            {/* Opcional: breadcrumbs o buscador */}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-brand-500 transition-colors rounded-full hover:bg-brand-50 dark:hover:bg-brand-900/20">
              <Bell size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all">
              <User size={18} className="text-slate-600 dark:text-slate-300" />
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
