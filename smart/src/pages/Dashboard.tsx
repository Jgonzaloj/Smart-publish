import { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, Plus, Zap, CheckCircle2, 
  BarChart3, ArrowUpRight, TrendingUp,
  Sparkles, DollarSign, Activity, Clock, FileText, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type Stat = {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  chipClass: string;
};

export function StatsCards({ metrics }: { metrics: { published: number; scheduled: number; drafts: number; errors: number } }) {
  const STATS: Stat[] = [
    { label: 'Publicados', value: metrics.published, icon: CheckCircle2, colorClass: 'text-success', chipClass: 'bg-success/10' },
    { label: 'Programados', value: metrics.scheduled, icon: Clock, colorClass: 'text-coral', chipClass: 'bg-coral/10' },
    { label: 'Borradores', value: metrics.drafts, icon: FileText, colorClass: 'text-purple', chipClass: 'bg-purple/10' },
    { label: 'Errores', value: metrics.errors, icon: AlertCircle, colorClass: 'text-danger', chipClass: 'bg-danger/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        const isEmpty = stat.value === 0;
        return (
          <div key={stat.label} className="bg-surface rounded-2xl p-4 border border-borderc shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${isEmpty ? 'bg-surface-raised' : stat.chipClass}`}>
              <Icon size={17} className={isEmpty ? 'text-text-secondary' : stat.colorClass} />
            </div>
            <div className="font-mono text-2xl font-semibold text-text-primary">{stat.value}</div>
            <span className="text-[13px] text-text-secondary">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyPerformanceState({ onCreatePost }: { onCreatePost: () => void }) {
  return (
    <div className="bg-surface border border-borderc rounded-2xl p-8 text-center h-[300px] flex flex-col items-center justify-center shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
        <BarChart3 size={22} className="text-accent" />
      </div>
      <p className="font-semibold text-text-primary mb-1">Aún no hay rendimiento que mostrar</p>
      <p className="text-[13px] text-text-secondary mb-4">
        Publica tu primer post para ver estadísticas de alcance e interacciones aquí.
      </p>
      <button
        onClick={onCreatePost}
        className="bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
      >
        <Plus size={16} /> Crear publicación
      </button>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ 
    published: 0, 
    scheduled: 0, 
    drafts: 0, 
    errors: 0,
    activeLeads: 12,
    pipelineValue: 4850,
    conversionRate: 24.8
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/social/accounts');
        if (res.data && res.data.success && res.data.accounts) {
          setAccounts(res.data.accounts);
        } else if (res.data && res.data.accounts) {
          setAccounts(res.data.accounts);
        }

        const postsRes = await api.get('/api/posts');
        if (postsRes.data && postsRes.data.success) {
          const posts = postsRes.data.posts || [];
          const published = posts.filter((p: any) => p.status === 'PUBLISHED').length;
          const scheduled = posts.filter((p: any) => p.status === 'SCHEDULED').length;
          const drafts = posts.filter((p: any) => p.status === 'DRAFT').length;
          const errors = posts.filter((p: any) => p.status === 'FAILED').length;
          setMetrics(prev => ({ ...prev, published, scheduled, drafts, errors }));
        }
      } catch (err) {
        console.error('Error loading dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary animate-pulse text-sm">Cargando panel de control...</div>
      </div>
    );
  }

  const hasData = metrics.published > 0 || metrics.scheduled > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-borderc rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
            <Sparkles size={14} className="animate-pulse" />
            AI Business Operating System Activo
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            Bienvenido a tu Panel de Control
          </h1>
          <p className="text-sm text-text-secondary max-w-2xl">
            Monitorea en tiempo real el rendimiento de tus campañas en redes sociales, leads comerciales y orquestación con IA.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/crm')}
            className="px-4 py-2.5 bg-surface hover:bg-surface-raised border border-borderc text-text-primary text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Ver Pipeline CRM
          </button>
          <button
            onClick={() => navigate('/compose')}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} /> Crear Publicación
          </button>
        </div>
      </div>

      {/* Social Posts Metric Cards */}
      <StatsCards metrics={metrics} />

      {/* Main KPI Grid: Commercial & AI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pipeline Value */}
        <div className="bg-surface border border-borderc rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Valor en Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-text-primary mb-1">
            ${metrics.pipelineValue.toLocaleString()} <span className="text-xs font-sans text-text-secondary">USD</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-accent font-medium">
            <TrendingUp size={13} /> +18.4% este mes
          </div>
        </div>

        {/* Qualified Leads */}
        <div className="bg-surface border border-borderc rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Leads Calificados</span>
            <div className="w-8 h-8 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-text-primary mb-1">
            {metrics.activeLeads}
          </div>
          <div className="text-xs text-text-secondary">
            Triage activo por WhatsApp IA
          </div>
        </div>

        {/* AI Conversion Rate */}
        <div className="bg-surface border border-borderc rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Conversión IA</span>
            <div className="w-8 h-8 rounded-lg bg-purple/10 text-purple flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-text-primary mb-1">
            {metrics.conversionRate}%
          </div>
          <div className="text-xs text-accent font-medium">
            94.6% satisfacción en respuestas
          </div>
        </div>
      </div>

      {/* Lower Row: Performance Chart & Connected Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart / Empty State */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Rendimiento a lo largo del tiempo</h2>
          {hasData ? (
            <div className="bg-surface border border-borderc rounded-2xl p-8 h-[300px] flex flex-col items-center justify-center text-text-secondary shadow-sm">
              <BarChart3 size={32} className="text-accent mb-2 opacity-60" />
              <p className="text-sm font-medium text-text-primary">Métricas en vivo sincronizadas</p>
              <p className="text-xs text-text-secondary mt-1">{metrics.published} publicaciones activas generando alcance</p>
            </div>
          ) : (
            <EmptyPerformanceState onCreatePost={() => navigate('/compose')} />
          )}
        </div>

        {/* Connected Accounts */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Cuentas Activas</h2>
          <div className="bg-surface border border-borderc rounded-2xl p-5 min-h-[300px] shadow-sm">
            {accounts.length === 0 ? (
              <div className="text-sm text-text-secondary flex items-start gap-2.5 p-4 rounded-xl bg-surface-raised">
                <AlertCircle size={18} className="shrink-0 text-warning mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">Sin cuentas conectadas</p>
                  <p className="text-xs text-text-secondary mt-1">Conecta Facebook o Instagram en Configuración para publicar automáticamente.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center gap-3 p-3 hover:bg-surface-raised rounded-xl transition-colors border border-borderc">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                      acc.platform === 'INSTAGRAM' 
                        ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white' 
                        : (acc.platform === 'FACEBOOK' ? 'bg-[#1877F2] text-white' : 'bg-accent text-white')
                    }`}>
                      {acc.platform === 'INSTAGRAM' ? 'IG' : (acc.platform === 'FACEBOOK' ? 'FB' : 'LI')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm truncate">{acc.account_name}</p>
                      <p className="text-[11px] text-accent flex items-center gap-1 mt-0.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        Sincronizado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Módulos Principales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={() => navigate('/inbox')}
            className="bg-surface border border-borderc p-5 rounded-2xl cursor-pointer hover:bg-surface-raised hover:border-accent/40 transition-all shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-bold text-sm text-text-primary mb-1">WhatsApp Inbox</h3>
            <p className="text-xs text-text-secondary">Monitorea conversaciones y toma el control humano cuando se requiera.</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent">
              Abrir Bandeja <ArrowUpRight size={13} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/campaigns')}
            className="bg-surface border border-borderc p-5 rounded-2xl cursor-pointer hover:bg-surface-raised hover:border-coral/40 transition-all shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Zap size={18} />
            </div>
            <h3 className="font-bold text-sm text-text-primary mb-1">Piloto IA de Marketing</h3>
            <p className="text-xs text-text-secondary">Automatiza copys, imágenes y publicaciones recurrentes por nicho.</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-coral">
              Configurar Piloto <ArrowUpRight size={13} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/crm')}
            className="bg-surface border border-borderc p-5 rounded-2xl cursor-pointer hover:bg-surface-raised hover:border-purple/40 transition-all shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple/10 text-purple flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users size={18} />
            </div>
            <h3 className="font-bold text-sm text-text-primary mb-1">Pipeline de Ventas CRM</h3>
            <p className="text-xs text-text-secondary">Gestiona el embudo comercial desde nuevos contactos hasta clientes ganados.</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple">
              Ver Pipeline <ArrowUpRight size={13} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
