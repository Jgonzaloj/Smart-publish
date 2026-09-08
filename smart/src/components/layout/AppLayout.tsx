import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Menu, X, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';

export const AppLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Dashboard General';
      case '/calendar': return 'Calendario Editorial';
      case '/compose': return 'Crear Publicación';
      case '/campaigns': return 'Piloto IA de Marketing';
      case '/crm': return 'Pipeline de Leads & CRM';
      case '/inbox': return 'WhatsApp Inbox & Ventas IA';
      case '/catalog': return 'Catálogo & Precios Oficiales';
      case '/quotes': return 'Cotizaciones Formales';
      case '/knowledge': return 'Base de Conocimiento RAG';
      case '/observability': return 'Observabilidad & Logs IA';
      case '/billing': return 'Suscripción & Facturación';
      case '/settings': return 'Configuración de Cuenta';
      case '/superadmin': return 'Panel SuperAdmin';
      default: return path.replace('/', '').replace(/-/g, ' ');
    }
  };

  return (
    <div className="flex h-screen bg-canvas text-text-primary overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <div
        className={`fixed md:relative top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar closeMobile={() => setIsMobileMenuOpen(false)} />
        <button
          className="md:hidden absolute top-4 right-[-40px] text-text-secondary hover:text-text-primary bg-surface rounded-r-xl p-2 shadow-md border border-l-0 border-borderc"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-[72px] border-b border-borderc flex items-center justify-between px-4 md:px-8 bg-surface shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-raised transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-text-primary capitalize tracking-tight">
                {getPageTitle(location.pathname)}
              </h1>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
                <Sparkles size={12} className="animate-pulse" />
                AI OS Activo
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button 
              className="relative p-2.5 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-raised transition-colors"
              title="Notificaciones"
            >
              <Bell size={19} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-coral rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-borderc">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-text-primary leading-tight">
                  {user?.email ? user.email.split('@')[0] : 'Admin'}
                </p>
                <p className="text-xs text-text-secondary font-medium">
                  {user?.role || 'Plan Pro'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.email ? user.email.slice(0, 2).toUpperCase() : 'SP'}
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                window.location.href = '/login';
              }}
              className="p-2 text-text-secondary hover:text-danger rounded-xl hover:bg-danger/10 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative bg-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
