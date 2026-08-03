import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Share2, Loader2 } from 'lucide-react';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    published: 0, drafts: 0, errors: 0, scheduled: 0
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/system/status');
        if (res.data.success) {
          setMetrics(res.data.data.metrics);
          setAccounts(res.data.data.accounts);
        }
      } catch (err) {
        console.error('Error fetching dashboard status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold">Resumen General</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric Cards */}
        {[
          { title: 'Publicados', value: metrics.published, color: 'bg-emerald-500' },
          { title: 'Programados', value: metrics.scheduled, color: 'bg-brand-500' },
          { title: 'Borradores', value: metrics.drafts, color: 'bg-slate-500' },
          { title: 'Errores', value: metrics.errors, color: 'bg-red-500' }
        ].map((metric, i) => (
          <div key={i} className="glass-panel p-6 hover:-translate-y-1 transition-transform">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-2">{metric.title}</h3>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-10 rounded-full ${metric.color}`}></div>
              <span className="text-4xl font-bold text-slate-800 dark:text-white">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Cuentas conectadas */}
      <div className="glass-panel p-6 mt-8">
        <h3 className="text-lg font-bold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Cuentas Sociales Activas</h3>
        
        {accounts.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 py-4">
            No tienes ninguna cuenta conectada. Ve a Configuración para conectar Meta.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${acc.platform === 'INSTAGRAM' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                  {acc.platform === 'INSTAGRAM' ? 'IG' : (acc.platform === 'FACEBOOK' ? 'FB' : <Share2 size={24} />)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{acc.account_name}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Conectado
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
