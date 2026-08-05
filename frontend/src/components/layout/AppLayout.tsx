import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, PenTool, Settings, Bell, Zap, Sparkles, Menu, X, LogOut } from 'lucide-react';

export const AppLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      {/* Overlay para móviles */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative top-0 left-0 h-full w-72 glass-panel flex flex-col md:m-4 md:mr-2 md:rounded-2xl shadow-xl shadow-brand-500/5 z-50 border border-white/40 dark:border-slate-700/50 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30 flex items-center justify-center text-white font-bold text-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <Sparkles size={20} className="relative z-10" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-300 tracking-tight">
              Smart Publish
            </h1>
          </div>
          <button 
            className="md:hidden text-slate-500 hover:text-brand-500"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? 'text-brand-700 dark:text-brand-300 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-100 to-brand-50/50 dark:from-brand-900/40 dark:to-brand-800/20 border border-brand-200 dark:border-brand-800/50 rounded-xl -z-10" />
                )}
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
      <div className="flex-1 flex flex-col h-full overflow-hidden md:m-4 md:ml-2 glass-panel md:rounded-2xl shadow-xl shadow-slate-200/10 dark:shadow-none z-10 border-0 md:border border-white/40 dark:border-slate-700/50">
        {/* Topbar */}
        <header className="h-[72px] border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-4 md:px-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 text-slate-500 hover:text-brand-500"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize hidden sm:block">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '')}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative p-2.5 text-slate-400 hover:text-brand-500 transition-all rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1e293b] dark:border-slate-900 animate-pulse"></span>
            </button>
            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-200 dark:border-slate-700/50 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-brand-500 transition-colors">Admin Usuario</p>
                <p className="text-xs text-slate-500 font-medium">Plan Pro</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=Admin&background=0ea5e9&color=fff&bold=true" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                window.location.href = '/login';
              }}
              className="ml-2 p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
