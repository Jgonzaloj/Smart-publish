import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';

export const AppLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-canvas text-white overflow-hidden font-sans">
      
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Overlay para móviles */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`fixed md:relative top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
         <Sidebar closeMobile={() => setIsMobileMenuOpen(false)} />
         <button 
            className="md:hidden absolute top-4 right-[-40px] text-text-secondary hover:text-white bg-surface rounded-r-md p-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <header className="h-[72px] border-b border-borderc flex items-center justify-between px-4 md:px-8 bg-canvas">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 text-text-secondary hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="text-sm font-medium text-text-secondary capitalize hidden sm:block">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '')}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative p-2 text-text-secondary hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full animate-pulse"></span>
            </button>
            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-borderc cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-text-primary leading-tight group-hover:text-accent transition-colors">{user?.email || 'Admin Usuario'}</p>
                <p className="text-xs text-text-secondary">Plan Pro</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${user?.email || 'Admin'}&background=6366F1&color=fff&bold=true`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                window.location.href = '/login';
              }}
              className="ml-2 p-2 text-text-secondary hover:text-danger transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative bg-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
