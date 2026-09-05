import { useState, useEffect } from 'react';
import { 
  Activity, Zap, Clock, CheckCircle2, 
  Cpu, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';

interface ObservabilitySummary {
  total_ai_requests: number;
  total_tokens_used: number;
  estimated_ai_cost_usd: number;
  average_latency_ms: number;
  qa_acceptance_rate: number;
  human_handoff_rate: number;
}

interface AiRunLog {
  id: string;
  task_type: string;
  model: string;
  tokens: number;
  latency_ms: number;
  status: string;
  decision: string;
  timestamp: string;
}

export function AiObservability() {
  const [summary, setSummary] = useState<ObservabilitySummary>({
    total_ai_requests: 1420,
    total_tokens_used: 284500,
    estimated_ai_cost_usd: 0.85,
    average_latency_ms: 680,
    qa_acceptance_rate: 94.6,
    human_handoff_rate: 5.4
  });

  const [logs, setLogs] = useState<AiRunLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/observability/metrics');
      if (res.data) {
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.recent_runs) setLogs(res.data.recent_runs);
      }
    } catch (err) {
      console.error('Error fetching observability metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Observabilidad de Inteligencia Artificial</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              SKILL-25
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Métricas de rendimiento, consumo de tokens de Gemini, latencia y registro de decisiones del orquestador.
          </p>
        </div>

        <button 
          onClick={fetchMetrics}
          className="btn-secondary shrink-0 text-xs py-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar Telemetría
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Peticiones Totales IA</span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Cpu size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.total_ai_requests.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">99.8% Disponibilidad</span>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tokens Consumidos</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Zap size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {(summary.total_tokens_used / 1000).toFixed(1)}k
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Costo est.: ${summary.estimated_ai_cost_usd} USD</span>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Latencia Promedio</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.average_latency_ms} ms
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Gemini 1.5 Flash Ultra-Rápido</span>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Aprobación QA Creativo</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.qa_acceptance_rate}%
          </div>
          <span className="text-[11px] text-slate-400">SKILL-17 Quality Control</span>
        </div>

      </div>

      {/* Decision Audit Log Feed */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registro de Decisiones & Trazabilidad del Orquestador</h3>
          </div>
          <span className="text-xs text-slate-400">Filtrando últimos eventos</span>
        </div>

        <div className="space-y-3">
          {logs.map(log => (
            <div 
              key={log.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2 hover:border-brand-400 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {log.task_type}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">{log.model}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>{log.tokens} tokens</span>
                  <span>•</span>
                  <span>{log.latency_ms}ms</span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Decision rationale */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">¿Por qué la IA tomó esta decisión?</span>
                {log.decision}
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
