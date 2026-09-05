import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Loader2, Plus, Zap, Play, Trash2, Bot, CalendarClock, Settings2, Sparkles } from 'lucide-react';

export const Campaigns = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [isCreating, setIsCreating] = useState(false);
    const [topic, setTopic] = useState('');
    const [frequency, setFrequency] = useState('0 9 * * *');
    const [accountId, setAccountId] = useState('');
    const topicInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [campRes, sysRes] = await Promise.all([
                api.get('/automation/campaigns').catch(e => e.response || {}),
                api.get('/system/status').catch(e => e.response || {})
            ]);
            if (campRes?.data?.success) setCampaigns(campRes.data.data);
            if (sysRes?.data?.success && sysRes.data.data.accounts) setAccounts(sysRes.data.data.accounts);
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

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return;
        
        try {
            const res = await api.delete(`/automation/campaigns/${id}`);
            if (res.data.success) {
                alert('Campaña eliminada correctamente');
                await fetchData();
            }
        } catch (error) {
            console.error('Error al eliminar campaña:', error);
            alert('Error al eliminar la campaña');
        }
    };

    if (loading) {
        return <div className="text-text-secondary p-8 animate-pulse">Cargando tus campañas...</div>;
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            {/* Header Banner */}
            <div className="bg-surface border border-borderc rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple/15 text-purple border border-purple/20 flex items-center justify-center shrink-0">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-medium text-white mb-0.5">
                            Piloto Automático con IA
                        </h1>
                        <p className="text-text-secondary text-sm">
                            Configura campañas automatizadas. Nuestra IA investigará, redactará y publicará en tus canales de forma continua.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Formulario de Campaña */}
                <div className="bg-surface border border-borderc rounded-xl p-5 sm:p-6 flex flex-col gap-4 col-span-1 xl:col-span-1 h-fit">
                    <div className="flex items-center gap-2 pb-3 border-b border-borderc">
                        <Zap size={16} className="text-purple" />
                        <h2 className="font-semibold text-sm text-white">Nueva Campaña Inteligente</h2>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                            <Settings2 size={13} className="text-purple" /> Tema / Directiva para la IA
                        </label>
                        <textarea 
                            ref={topicInputRef}
                            placeholder="Ej: Consejos de marketing digital para emprendedores, con llamado a la acción..." 
                            className="input-field min-h-[110px] resize-none text-xs leading-relaxed"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-secondary">Cuenta Social Destino</label>
                        <select className="input-field cursor-pointer text-xs" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                            <option value="">-- Selecciona una cuenta --</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.platform})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                            <CalendarClock size={13} className="text-text-secondary" /> Frecuencia de Publicación
                        </label>
                        <select className="input-field cursor-pointer text-xs" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                            {Array.from({ length: 24 }).map((_, i) => {
                                const ampm = i >= 12 ? 'PM' : 'AM';
                                const displayHour = i % 12 === 0 ? 12 : i % 12;
                                return (
                                    <option key={i} value={`0 ${i} * * *`}>
                                        Todos los días a las {displayHour}:00 {ampm}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <button 
                        onClick={handleCreate} 
                        disabled={isCreating}
                        className="bg-accent hover:bg-accent-hover text-white text-xs font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-50"
                    >
                        {isCreating ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Activar Campaña con IA</>}
                    </button>
                </div>

                {/* Lista de Campañas */}
                <div className="col-span-1 xl:col-span-2">
                    <h3 className="font-medium text-sm mb-4 text-text-primary flex items-center gap-2">
                        <Play size={15} className="text-accent" /> Campañas Activas ({campaigns.length})
                    </h3>
                    
                    {campaigns.length === 0 ? (
                        <div className="p-12 text-center bg-surface border border-dashed border-borderc rounded-xl flex flex-col items-center justify-center">
                            <Bot size={36} className="text-text-secondary opacity-40 mb-3" />
                            <h4 className="text-sm font-medium text-white mb-1">Sin campañas activas</h4>
                            <p className="text-xs text-text-secondary max-w-sm mb-4">
                                Configura tu primera campaña para que los agentes autónomos redacten y programen tus posts.
                            </p>
                            <button 
                                onClick={() => topicInputRef.current?.focus()}
                                className="bg-surface-raised hover:bg-borderc border border-borderc text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
                            >
                                Iniciar configuración
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {campaigns.map(camp => (
                                <div key={camp.id} className="bg-surface border border-borderc rounded-xl p-4 flex flex-col justify-between hover:bg-surface-raised transition-colors group">
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-start justify-between">
                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-success/10 text-success border border-success/20">
                                                {camp.status || 'ACTIVA'}
                                            </span>
                                            <button 
                                                onClick={() => handleDelete(camp.id)} 
                                                className="p-1 text-text-secondary hover:text-danger rounded transition-colors opacity-0 group-hover:opacity-100"
                                                title="Eliminar campaña"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <p className="font-medium text-sm text-white line-clamp-2">{camp.topic}</p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-borderc flex flex-col gap-1.5 text-xs text-text-secondary">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                                            Destino: <span className="text-white font-medium">{camp.account_name || 'Cuenta vinculada'} ({camp.platform})</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono text-[11px]">
                                            <CalendarClock size={12} className="text-text-secondary" />
                                            Cron: {camp.frequency_cron}
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
