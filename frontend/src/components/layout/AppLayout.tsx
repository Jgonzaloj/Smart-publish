import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, PenTool, Settings, Bell, User, Zap, Sparkles } from 'lucide-react';

export const AppLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/calendar', icon: <Calendar size={20} />, label: 'Calendario' },
    { path: '/compose', icon: <PenTool size={20} />, label: 'Crear Post' },
    { path: '/campaigns', icon: <Zap size={20} />, label: 'Piloto IA' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen bg-transparent transition-colors duration-500 overflow-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/20 dark:bg-brand-600/10 blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      {/* Sidebar */}
      <aside className="w-72 glass-panel flex flex-col m-4 mr-2 rounded-2xl shadow-xl shadow-brand-500/5 z-10 border border-white/40 dark:border-slate-700/50">
        <div className="p-6 flex items-center gap-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30 flex items-center justify-center text-white font-bold text-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <Sparkles size={20} className="relative z-10" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-300 tracking-tight">
            Smart Publish
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? 'text-brand-700 dark:text-brand-300 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {/* Background Highlight for Active State */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-100 to-brand-50/50 dark:from-brand-900/40 dark:to-brand-800/20 border border-brand-200 dark:border-brand-800/50 rounded-xl -z-10" />
                )}
                
                {/* Hover Background */}
                {!isActive && (
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10" />
                )}

                <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-brand-500 dark:text-brand-400' : 'group-hover:scale-110 group-hover:text-brand-500 dark:group-hover:text-brand-400'}`}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden m-4 ml-2 glass-panel rounded-2xl shadow-xl shadow-slate-200/10 dark:shadow-none z-10 border border-white/40 dark:border-slate-700/50">
        {/* Topbar */}
        <header className="h-[72px] border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="flex-1">
            {/* Opcional: breadcrumbs o buscador */}
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '')}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative p-2 text-slate-400 hover:text-brand-500 transition-colors rounded-full hover:bg-brand-50 dark:hover:bg-brand-900/30">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-brand-500 hover:ring-offset-2 dark:hover:ring-offset-slate-900 transition-all shadow-sm">
              <User size={18} className="text-slate-600 dark:text-slate-300" />
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
