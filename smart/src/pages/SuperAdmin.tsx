import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Users, Building2, DollarSign, Activity, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardData {
  totalUsers: number;
  totalWorkspaces: number;
  totalPosts: number;
  estimatedMRR: number;
  plansDistribution: { plan_id: string; count: number }[];
  recentUsers: { email: string; role: string; created_at: string }[];
}

export const SuperAdmin = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/superadmin/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error cargando datos del SuperAdmin');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (user?.role !== 'SUPERADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
          <Activity size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Acceso Restringido</h2>
        <p className="text-text-secondary text-xs">Esta sección está reservada exclusivamente para superadministradores de la plataforma.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-text-secondary text-xs">Cargando métricas globales...</div>;
  }

  if (error) {
    return <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl text-xs">{error}</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-medium text-white mb-1">Panel de SuperAdmin</h1>
        <p className="text-sm text-text-secondary">Métricas globales y monitoreo operacional del SaaS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI MRR */}
        <div className="bg-surface rounded-xl p-4 border border-borderc">
          <div className="flex justify-between items-center mb-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-2 py-0.5 rounded">
              <ArrowUpRight size={12} /> +12%
            </span>
          </div>
          <p className="text-text-secondary text-xs">Ingresos Estimados (MRR)</p>
          <h3 className="text-2xl font-mono font-medium text-white mt-1">${data?.estimatedMRR || 0}</h3>
        </div>

        {/* KPI Users */}
        <div className="bg-surface rounded-xl p-4 border border-borderc">
          <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-3">
            <Users size={18} />
          </div>
          <p className="text-text-secondary text-xs">Usuarios Registrados</p>
          <h3 className="text-2xl font-mono font-medium text-white mt-1">{data?.totalUsers || 0}</h3>
        </div>

        {/* KPI Workspaces */}
        <div className="bg-surface rounded-xl p-4 border border-borderc">
          <div className="w-9 h-9 rounded-lg bg-purple/10 text-purple flex items-center justify-center mb-3">
            <Building2 size={18} />
          </div>
          <p className="text-text-secondary text-xs">Workspaces / Tenants</p>
          <h3 className="text-2xl font-mono font-medium text-white mt-1">{data?.totalWorkspaces || 0}</h3>
        </div>

        {/* KPI Posts */}
        <div className="bg-surface rounded-xl p-4 border border-borderc">
          <div className="w-9 h-9 rounded-lg bg-warning/10 text-warning flex items-center justify-center mb-3">
            <Activity size={18} />
          </div>
          <p className="text-text-secondary text-xs">Publicaciones Generadas</p>
          <h3 className="text-2xl font-mono font-medium text-white mt-1">{data?.totalPosts || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución de Planes */}
        <div className="bg-surface rounded-xl p-5 border border-borderc">
          <h3 className="text-sm font-semibold text-white mb-4">Distribución de Planes</h3>
          <div className="space-y-3">
            {data?.plansDistribution.map((plan) => (
              <div key={plan.plan_id} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary capitalize">{plan.plan_id === 'free' || plan.plan_id === 'FREE_TRIAL' ? 'Básico / Prueba' : plan.plan_id}</span>
                <span className="font-mono font-medium text-white">{plan.count} cuentas</span>
              </div>
            ))}
            {(!data?.plansDistribution || data.plansDistribution.length === 0) && (
              <p className="text-text-secondary text-xs text-center py-4">No hay datos de planes registrados</p>
            )}
          </div>
        </div>

        {/* Últimos Usuarios */}
        <div className="bg-surface rounded-xl p-5 border border-borderc lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Nuevos Registros en la Plataforma</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-borderc text-text-secondary">
                  <th className="pb-2.5 font-medium">Email</th>
                  <th className="pb-2.5 font-medium">Rol Asignado</th>
                  <th className="pb-2.5 font-medium text-right">Fecha de Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderc">
                {data?.recentUsers.map((u, idx) => (
                  <tr key={idx} className="hover:bg-surface-raised transition-colors">
                    <td className="py-2.5 text-white font-medium">{u.email}</td>
                    <td className="py-2.5">
                      <span className="text-[10px] font-mono bg-surface-raised px-1.5 py-0.5 rounded border border-borderc text-text-secondary">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-text-secondary">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
