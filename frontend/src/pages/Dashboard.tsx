import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Share2, Loader2, CheckCircle2, Clock, AlertCircle, Activity, BarChart3, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    published: 0, drafts: 0, errors: 0, scheduled: 0
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, analyticsRes] = await Promise.all([
          api.get('/system/status'),
          api.get('/analytics/overview').catch(() => ({ data: { data: [] } }))
        ]);
        
        if (statusRes.data.success) {
          setMetrics(statusRes.data.data.metrics);
          setAccounts(statusRes.data.data.accounts);
        }
        
        if (analyticsRes.data?.data) {
           setAnalytics(analyticsRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    );
  }

  const pieData = [
    { name: 'Publicados', value: metrics.published || 1, color: '#10b981' },
    { name: 'Programados', value: metrics.scheduled || 1, color: '#3b82f6' },
    { name: 'Borradores', value: metrics.drafts || 1, color: '#64748b' },
    { name: 'Errores', value: metrics.errors, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Datos falsos para rellenar si está vacío y que se vea premium
  const hasData = pieData.length > 0 && pieData.some(d => d.value > 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-600 to-brand-400 p-8 rounded-3xl text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight">Bienvenido a tu panel de control</h2>
          <p className="text-brand-100 mt-2 text-lg">Aquí tienes el resumen del rendimiento de tus cuentas sociales.</p>
        </div>
        <Link to="/composer" className="relative z-10 bg-white text-brand-600 px-6 py-3 rounded-full font-bold hover:bg-slate-50 transition-colors shadow-lg flex items-center gap-2">
          <Plus size={20} /> Crear Publicación
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Métricas Principales (Izquierda) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { title: 'Publicados', value: metrics.published, icon: <CheckCircle2 size={24} className="text-emerald-500" />, color: 'emerald' },
              { title: 'Programados', value: metrics.scheduled, icon: <Clock size={24} className="text-blue-500" />, color: 'blue' },
              { title: 'Borradores', value: metrics.drafts, icon: <Activity size={24} className="text-slate-500" />, color: 'slate' },
              { title: 'Errores', value: metrics.errors, icon: <AlertCircle size={24} className="text-red-500" />, color: 'red' }
            ].map((metric, i) => (
              <div key={i} className="glass-panel p-6 flex flex-col justify-between hover:border-brand-300 transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-${metric.color}-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-${metric.color}-50 dark:bg-${metric.color}-900/20`}>
                    {metric.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">{metric.title}</h3>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Analíticas Avanzadas */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="text-brand-500" /> Rendimiento a lo largo del tiempo
              </h3>
              <select className="input-field py-1 px-3 text-sm min-h-0 h-auto bg-slate-50 dark:bg-slate-800 w-auto">
                <option>Últimos 7 días</option>
                <option>Últimos 30 días</option>
              </select>
            </div>
            
            {analytics.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <BarChart3 size={40} className="mb-2 opacity-50" />
                <p>No hay datos suficientes para graficar</p>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorImpresiones" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="impresiones" name="Impresiones" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorImpresiones)" />
                    <Area type="monotone" dataKey="engagement" name="Interacciones" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagement)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Panel Lateral (Derecha) */}
        <div className="space-y-6">
          
          {/* Cuentas conectadas */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Share2 className="text-brand-500" /> Cuentas Activas
            </h3>
            
            {accounts.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl text-sm font-medium border border-amber-200 dark:border-amber-800/30 flex gap-3">
                <AlertCircle size={20} className="shrink-0" />
                No tienes cuentas conectadas. Conecta Meta en la configuración.
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm ${acc.platform === 'INSTAGRAM' ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white' : 'bg-[#1877F2] text-white'}`}>
                      {acc.platform === 'INSTAGRAM' ? 'IG' : (acc.platform === 'FACEBOOK' ? 'FB' : 'LI')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{acc.account_name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sincronizado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gráfico de Distribución */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-2">Distribución de Posts</h3>
            <div className="h-[200px] w-full flex items-center justify-center relative">
               {!hasData ? (
                 <div className="text-slate-400 flex flex-col items-center">
                    <PieChart width={64} height={64} className="opacity-50 mb-2">
                      <Pie data={[{ value: 1 }]} dataKey="value" cx="50%" cy="50%" outerRadius={30} fill="#cbd5e1" />
                    </PieChart>
                    <span className="text-sm">Sin datos aún</span>
                 </div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                       stroke="none"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       itemStyle={{ color: '#333', fontWeight: 'bold' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               )}
               {hasData && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                   <span className="text-3xl font-bold">{metrics.published + metrics.scheduled}</span>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
                 </div>
               )}
            </div>
            {hasData && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
