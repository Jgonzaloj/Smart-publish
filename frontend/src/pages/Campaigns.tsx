import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loader2, Plus, Zap, Play, Pause, Bot, CalendarClock, Settings2 } from 'lucide-react';

export const Campaigns = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [isCreating, setIsCreating] = useState(false);
    const [topic, setTopic] = useState('');
    const [frequency, setFrequency] = useState('0 9 * * *');
    const [accountId, setAccountId] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [campRes, sysRes] = await Promise.all([
                api.get('/automation/campaigns'),
                api.get('/system/metrics')
            ]);
            if (campRes.data.success) setCampaigns(campRes.data.data);
            if (sysRes.data.success && sysRes.data.data.accounts) setAccounts(sysRes.data.data.accounts);
        } catch (error) {
            console.error('Error cargando datos de campañas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!topic || !accountId || !frequency) return alert('Completa todos los campos obligatorios');
        
        setIsCreating(true);
        try {
            const res = await api.post('/automation/campaigns', {
                workspaceId: 'ws-1', // MVP
                accountId,
                topic,
                frequencyCron: frequency
            });
            
            if (res.data.success) {
                alert('Campaña programada exitosamente. ¡La IA se encargará del resto!');
                setTopic('');
                await fetchData();
            }
        } catch (error) {
            console.error(error);
            alert('Error al crear campaña');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin text-brand-500" size={40} /></div>;

    return (
        <div className="flex flex-col gap-10 animate-fade-in relative z-10">
            <div className="flex items-center justify-between glass-panel p-8 !bg-gradient-to-r from-brand-500/10 to-purple-500/10 border-none">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 shadow-lg shadow-brand-500/20 flex items-center justify-center text-white relative group">
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Bot size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                            Piloto Automático (IA)
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
                            Configura campañas inteligentes. Nuestra IA investigará, redactará y publicará el contenido más relevante para tu audiencia de forma automática.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="glass-panel p-8 flex flex-col gap-6 col-span-1 xl:col-span-1 h-fit sticky top-8">
                    <div className="flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                            <Zap size={18} className="animate-pulse" />
                        </div>
                        <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">Nueva Campaña</h3>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Settings2 size={16} className="text-brand-500" /> Tema / Instrucción
                        </label>
                        <textarea 
                            placeholder="Ej: Consejos sobre café de especialidad, con tono alegre..." 
                            className="input-field min-h-[120px] resize-none"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cuenta Destino</label>
                        <select className="input-field cursor-pointer" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                            <option value="">-- Selecciona --</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.platform})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <CalendarClock size={16} className="text-brand-500" /> Frecuencia (Cron)
                        </label>
                        <select className="input-field cursor-pointer" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                            <option value="0 9 * * *">Todos los días a las 9:00 AM</option>
                            <option value="0 18 * * *">Todos los días a las 6:00 PM</option>
                            <option value="0 10 * * 1,3,5">Lunes, Miércoles y Viernes - 10:00 AM</option>
                            <option value="0 12 * * 0">Todos los Domingos al mediodía</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleCreate} 
                        disabled={isCreating}
                        className="btn-primary mt-2 w-full py-3.5 text-lg"
                    >
                        {isCreating ? <Loader2 className="animate-spin mx-auto" /> : <><Plus size={22} /> Programar IA</>}
                    </button>
                </div>

                {/* Lista de Campañas */}
                <div className="col-span-1 xl:col-span-2">
                    <h3 className="font-bold text-xl mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Play size={20} className="text-brand-500" /> Campañas Activas
                    </h3>
                    
                    {campaigns.length === 0 ? (
                        <div className="p-16 text-center glass-panel border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                            <Bot size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Sin campañas activas</h4>
                            <p className="text-slate-500 dark:text-slate-500">
                                Crea tu primera campaña a la izquierda y deja que la IA haga el trabajo pesado por ti.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {campaigns.map(camp => (
                                <div key={camp.id} className="glass-panel p-6 flex flex-col justify-between group hover:border-brand-300 dark:hover:border-brand-700">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100/80 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                {camp.status}
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600">
                                                <Pause size={14} className="text-slate-600 dark:text-slate-300" />
                                            </div>
                                        </div>
                                        <p className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-2">{camp.topic}</p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            Destino: <span className="font-semibold text-slate-700 dark:text-slate-300">{camp.account_name} ({camp.platform})</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <CalendarClock size={12} className="text-slate-400" />
                                            Frecuencia: <span className="font-medium text-slate-600 dark:text-slate-300">{camp.frequency_cron}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
