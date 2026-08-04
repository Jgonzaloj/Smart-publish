import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loader2, Plus, Zap, Play, Pause } from 'lucide-react';

export const Campaigns = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [isCreating, setIsCreating] = useState(false);
    const [topic, setTopic] = useState('');
    const [frequency, setFrequency] = useState('0 9 * * *'); // Default: Todos los dias a las 9 AM
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

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-500" size={32} /></div>;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Piloto Automático (IA)</h1>
                    <p className="text-slate-500 text-sm mt-1">Deja que la Inteligencia Artificial cree y publique contenido por ti recurrentemente.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="glass-panel p-6 flex flex-col gap-4 col-span-1 lg:col-span-1 h-fit">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Zap className="text-yellow-500" /> Nueva Campaña</h3>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Tema / Instrucción</label>
                        <textarea 
                            placeholder="Ej: Consejos sobre café de especialidad, con tono alegre..." 
                            className="input-field min-h-[100px] resize-none"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Cuenta Destino</label>
                        <select className="input-field" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                            <option value="">-- Selecciona --</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.platform})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Frecuencia (Cron)</label>
                        <select className="input-field" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                            <option value="0 9 * * *">Todos los días a las 9:00 AM</option>
                            <option value="0 18 * * *">Todos los días a las 6:00 PM</option>
                            <option value="0 10 * * 1,3,5">Lunes, Miércoles y Viernes a las 10:00 AM</option>
                            <option value="0 12 * * 0">Todos los Domingos al mediodía</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleCreate} 
                        disabled={isCreating}
                        className="btn-primary mt-4 w-full"
                    >
                        {isCreating ? <Loader2 className="animate-spin mx-auto" /> : <><Plus size={20} /> Crear Campaña</>}
                    </button>
                </div>

                {/* Lista de Campañas */}
                <div className="col-span-1 lg:col-span-2">
                    <h3 className="font-bold text-lg mb-4">Campañas Activas</h3>
                    {campaigns.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 glass-panel">
                            No tienes ninguna campaña activa. ¡Crea una para empezar!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {campaigns.map(camp => (
                                <div key={camp.id} className="glass-panel p-4 flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <p className="font-bold text-md">{camp.topic}</p>
                                        <p className="text-xs text-slate-500">
                                            Destino: <span className="font-medium text-brand-600">{camp.account_name} ({camp.platform})</span> | 
                                            Frecuencia: {camp.frequency_cron}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            {camp.status}
                                        </span>
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
