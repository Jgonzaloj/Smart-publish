import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Users, Building2, DollarSign, Activity, Loader2, ArrowUpRight } from 'lucide-react';
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
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Activity size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Acceso Denegado</h2>
        <p className="text-slate-500">Esta zona está restringida únicamente para los dueños de la plataforma.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 size={40} className="animate-spin text-brand-500" /></div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-xl">{error}</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Panel Administrativo</h1>
        <p className="text-slate-500 mt-2">Visión global de tu negocio SaaS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI MRR */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} /> +12%
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ingresos Estimados (MRR)</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">${data?.estimatedMRR}</h3>
        </div>

        {/* KPI Users */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Usuarios Totales</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{data?.totalUsers}</h3>
        </div>

        {/* KPI Workspaces */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <Building2 size={24} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Agencias / Equipos</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{data?.totalWorkspaces}</h3>
        </div>

        {/* KPI Posts */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <Activity size={24} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Posts Creados</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{data?.totalPosts}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución de Planes */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4">Distribución de Planes</h3>
          <div className="space-y-4">
            {data?.plansDistribution.map((plan) => (
              <div key={plan.plan_id} className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 capitalize font-medium">{plan.plan_id === 'free' || plan.plan_id === 'FREE_TRIAL' ? 'Básico / Prueba' : plan.plan_id}</span>
                <span className="font-bold">{plan.count} equipos</span>
              </div>
            ))}
            {(!data?.plansDistribution || data.plansDistribution.length === 0) && (
              <p className="text-slate-500 text-sm text-center py-4">No hay datos suficientes</p>
            )}
          </div>
        </div>

        {/* Últimos Usuarios */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">Nuevos Registros</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold text-slate-500">Email</th>
                  <th className="pb-3 font-semibold text-slate-500">Rol</th>
                  <th className="pb-3 font-semibold text-slate-500 text-right">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {data?.recentUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 text-slate-800 dark:text-white font-medium">{user.email}</td>
                    <td className="py-3">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-bold text-slate-600 dark:text-slate-400">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
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
