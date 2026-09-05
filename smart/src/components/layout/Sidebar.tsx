import { 
  LayoutGrid, Calendar, PenSquare, Zap, CreditCard, Settings, 
  Users, MessageSquare, Tag, FileText, BrainCircuit, Activity, ShieldAlert 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  badge?: string;
  badgeColor?: string;
};

const MARKETING_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, href: '/' },
  { label: 'Calendario', icon: Calendar, href: '/calendar' },
  { label: 'Crear post', icon: PenSquare, href: '/compose' },
  { label: 'Piloto IA', icon: Zap, href: '/campaigns', badge: 'Auto', badgeColor: 'bg-purple/20 text-purple' },
];

const SALES_ITEMS: NavItem[] = [
  { label: 'Pipeline Leads', icon: Users, href: '/crm', badge: 'Kanban', badgeColor: 'bg-accent/20 text-accent' },
  { label: 'WhatsApp Inbox', icon: MessageSquare, href: '/inbox', badge: 'Live', badgeColor: 'bg-success/20 text-success' },
  { label: 'Catálogo & Precios', icon: Tag, href: '/catalog' },
  { label: 'Cotizaciones', icon: FileText, href: '/quotes' },
];

const BRAIN_ITEMS: NavItem[] = [
  { label: 'Base Conocimiento', icon: BrainCircuit, href: '/knowledge' },
  { label: 'Observabilidad IA', icon: Activity, href: '/observability' },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { label: 'Suscripción', icon: CreditCard, href: '/billing' },
  { label: 'Configuración', icon: Settings, href: '/settings' },
  { label: 'SuperAdmin', icon: ShieldAlert, href: '/superadmin' },
];

function NavSection({ title, items, activeHref, closeMobile }: { title: string; items: NavItem[]; activeHref: string; closeMobile?: () => void }) {
  return (
    <div className="mb-5">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map(({ label, icon: Icon, href, badge, badgeColor }) => {
          const isActive = href === '/' ? activeHref === '/' : activeHref.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
              onClick={closeMobile}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-surface-raised text-white'
                  : 'text-text-secondary hover:bg-surface-raised hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={18} className={isActive ? 'text-accent shrink-0' : 'shrink-0'} />
                <span className="truncate">{label}</span>
              </div>
              {badge ? (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase shrink-0 ${badgeColor || 'bg-surface-raised text-text-secondary'}`}>
                  {badge}
                </span>
              ) : isActive ? (
                <span className="w-1.5 h-3.5 rounded-full bg-accent" aria-hidden="true" />
              ) : null}
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
    <aside className="w-64 bg-surface min-h-screen px-3 py-6 border-r border-borderc flex flex-col h-full overflow-y-auto select-none">
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm shadow-sm">
          SP
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold text-sm tracking-tight">Smart Publish</span>
            <span className="px-1.5 py-0.5 bg-purple/20 text-purple text-[10px] font-bold rounded">AI OS</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <NavSection title="Marketing & Redes" items={MARKETING_ITEMS} activeHref={activeHref} closeMobile={closeMobile} />
        <NavSection title="Ventas & CRM (IA)" items={SALES_ITEMS} activeHref={activeHref} closeMobile={closeMobile} />
        <NavSection title="Cerebro IA & RAG" items={BRAIN_ITEMS} activeHref={activeHref} closeMobile={closeMobile} />
        <NavSection title="Administración" items={ACCOUNT_ITEMS} activeHref={activeHref} closeMobile={closeMobile} />
      </div>
    </aside>
  );
}
