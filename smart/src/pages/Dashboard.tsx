import { useState, useEffect } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

import { CheckCircle2, Clock, FileText, BarChart3 } from 'lucide-react';

type Stat = {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string; 
};

function getIconColor(stat: Stat) {
  return stat.value > 0 ? stat.colorClass : 'text-text-secondary';
}

export function StatsCards({ metrics }: { metrics: { published: number, scheduled: number, drafts: number, errors: number } }) {
  const STATS: Stat[] = [
    { label: 'Publicados', value: metrics.published, icon: CheckCircle2, colorClass: 'text-success' },
    { label: 'Programados', value: metrics.scheduled, icon: Clock, colorClass: 'text-warning' },
    { label: 'Borradores', value: metrics.drafts, icon: FileText, colorClass: 'text-text-secondary' },
    { label: 'Errores', value: metrics.errors, icon: AlertCircle, colorClass: 'text-danger' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-surface rounded-lg p-4 border border-borderc">
            <div className="flex items-center gap-2 mb-2.5">
              <Icon size={18} className={getIconColor(stat)} />
              <span className="text-[13px] text-text-secondary">{stat.label}</span>
            </div>
            <div className="font-mono text-2xl font-medium text-white">{stat.value}</div>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyPerformanceState({ onCreatePost }: { onCreatePost: () => void }) {
  return (
    <div className="bg-surface border border-borderc rounded-xl p-8 text-center h-[300px] flex flex-col items-center justify-center">
      <BarChart3 size={28} className="mx-auto text-text-secondary mb-3" />
      <p className="font-medium text-white mb-1">Aún no hay rendimiento que mostrar</p>
      <p className="text-[13px] text-text-secondary mb-4">
        Publica tu primer post para ver estadísticas aquí.
      </p>
      <button
        onClick={onCreatePost}
        className="bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-4 py-2 rounded-md transition-colors"
      >
        Crear publicación
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ published: 0, scheduled: 0, drafts: 0, errors: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch metrics and accounts (Mocked or real)
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/social/accounts');
        if (res.data && res.data.success) {
          setAccounts(res.data.accounts);
        }
        
        const postsRes = await api.get('/api/posts');
        if (postsRes.data && postsRes.data.success) {
            const posts = postsRes.data.posts;
            const published = posts.filter((p: any) => p.status === 'PUBLISHED').length;
            const scheduled = posts.filter((p: any) => p.status === 'SCHEDULED').length;
            const drafts = posts.filter((p: any) => p.status === 'DRAFT').length;
            const errors = posts.filter((p: any) => p.status === 'FAILED').length;
            setMetrics({ published, scheduled, drafts, errors });
        }
      } catch (err) {
        console.error("Error loading dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="text-text-secondary p-8 animate-pulse">Cargando tu panel...</div>;
  }

  const hasData = metrics.published > 0 || metrics.scheduled > 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-medium text-white mb-1">Bienvenido a tu panel de control</h1>
           <p className="text-sm text-text-secondary">Aquí tienes el resumen del rendimiento de tus cuentas sociales.</p>
        </div>
        <button onClick={() => navigate('/compose')} className="flex items-center gap-2 bg-surface hover:bg-surface-raised border border-borderc text-white px-4 py-2 rounded-md text-sm transition-colors">
          <Plus size={16} /> Crear Publicación
        </button>
      </div>

      <StatsCards metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-text-primary mb-3">Rendimiento a lo largo del tiempo</h2>
          {hasData ? (
             <div className="bg-surface border border-borderc rounded-xl p-8 h-[300px] flex items-center justify-center text-text-secondary">
               Gráfico en construcción...
             </div>
          ) : (
             <EmptyPerformanceState onCreatePost={() => navigate('/compose')} />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-text-primary mb-3">Cuentas Activas</h2>
            <div className="bg-surface border border-borderc rounded-xl p-4 min-h-[150px]">
              {accounts.length === 0 ? (
                <div className="text-sm text-text-secondary flex gap-2">
                  <AlertCircle size={18} className="shrink-0" />
                  No tienes cuentas conectadas.
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex items-center gap-3 p-2 hover:bg-surface-raised rounded-lg transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${acc.platform === 'INSTAGRAM' ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white' : 'bg-[#1877F2] text-white'}`}>
                        {acc.platform === 'INSTAGRAM' ? 'IG' : (acc.platform === 'FACEBOOK' ? 'FB' : 'LI')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary text-sm truncate">{acc.account_name}</p>
                        <p className="text-[11px] text-success flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
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
      </div>
    </div>
  );
}

export { Dashboard };
