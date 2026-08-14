import { LayoutGrid, Calendar, PenSquare, Zap, CreditCard, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
};

const CONTENT_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, href: '/' },
  { label: 'Calendario', icon: Calendar, href: '/calendar' },
  { label: 'Crear post', icon: PenSquare, href: '/compose' },
  { label: 'Piloto IA', icon: Zap, href: '/campaigns' },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { label: 'Suscripción', icon: CreditCard, href: '/billing' },
  { label: 'Configuración', icon: Settings, href: '/settings' },
];

function NavSection({ title, items, activeHref, closeMobile }: { title: string; items: NavItem[]; activeHref: string; closeMobile?: () => void }) {
  return (
    <div className="mb-6">
      <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map(({ label, icon: Icon, href }) => {
          const isActive = href === '/' ? activeHref === '/' : activeHref.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-surface-raised text-white'
                  : 'text-text-secondary hover:bg-surface-raised hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-accent' : ''} />
              {label}
              {isActive && (
                <span className="ml-auto w-1 h-4 rounded-full bg-accent" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function Sidebar({ closeMobile }: { closeMobile?: () => void }) {
  const location = useLocation();
  const activeHref = location.pathname;

  return (
    <aside className="w-64 bg-surface min-h-screen px-3 py-6 border-r border-borderc flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-white font-semibold text-sm">
          SP
        </div>
        <span className="text-white font-medium">Smart Publish</span>
      </div>

      <NavSection title="Contenido" items={CONTENT_ITEMS} activeHref={activeHref} closeMobile={closeMobile} />
      <NavSection title="Cuenta" items={ACCOUNT_ITEMS} activeHref={activeHref} closeMobile={closeMobile} />
    </aside>
  );
}
