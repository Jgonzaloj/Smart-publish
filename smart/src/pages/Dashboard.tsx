import { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, Plus, Zap, CheckCircle2, 
  BarChart3, ArrowUpRight, TrendingUp,
  Sparkles, DollarSign, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function Dashboard() {
  const navigate = useNavigate();
  const [metrics] = useState({ 
    published: 18, 
    scheduled: 6, 
    activeLeads: 12, 
    pipelineValue: 4850,
    conversionRate: 24.8,
    aiRequests: 1420 
  });
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/social/accounts');
        if (res.data && res.data.accounts) {
          setAccounts(res.data.accounts);
        }
      } catch (err) {
        // Fallback accounts if offline
        setAccounts([
          { id: 'acc-1', platform: 'INSTAGRAM', account_name: 'Inversiones Vawi Oficial', status: 'ACTIVE' },
          { id: 'acc-2', platform: 'FACEBOOK', account_name: 'Smart Publish Media', status: 'ACTIVE' }
        ]);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-2rem)] bg-[#0B0F17] overflow-hidden p-2 sm:p-6 rounded-3xl text-slate-100 shadow-2xl">
      
      {/* Aurora Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 space-y-8 max-w-7xl mx-auto">
        
        {/* Welcome Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md text-xs font-medium border border-white/10 text-cyan-200">
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              AI Business Operating System • Orquestador Activo
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Panel de Control Central
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Tu suite integral de Marketing Autónomo y Ventas por WhatsApp impulsada por Gemini 1.5 Flash.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 shrink-0">
            <button 
              onClick={() => navigate('/crm')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-md text-slate-200 font-medium text-sm border border-white/10 transition-all hover:border-white/20"
            >
              Ver Pipeline CRM
            </button>
            <button 
              onClick={() => navigate('/compose')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <Plus size={18} /> Crear Post
            </button>
          </div>
        </div>

        {/* Main KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Pipeline Value */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/[0.05] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-wider">Valor en Pipeline</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(52,211,153,0.3)]">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              ${metrics.pipelineValue.toLocaleString()} <span className="text-xs font-sans text-slate-500">USD</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <TrendingUp size={12} /> +18.4% este mes
            </div>
          </div>

          {/* Leads in Triage */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/[0.05] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-wider">Leads Calificados</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]">
                <Users size={16} />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {metrics.activeLeads}
            </div>
            <div className="text-[11px] text-slate-500">
              SKILL-07 & 11 Triage Comercial
            </div>
          </div>

          {/* Posts Published & Scheduled */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/[0.05] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-wider">Redes Sociales</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {metrics.published} <span className="text-xs text-amber-400/80 font-normal">({metrics.scheduled} prog.)</span>
            </div>
            <div className="text-[11px] text-slate-500">
              FB, Instagram & TikTok
            </div>
          </div>

          {/* AI Conversion Rate */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/[0.05] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-wider">Conversión IA</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)]">
                <Activity size={16} />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {metrics.conversionRate}%
            </div>
            <div className="text-[11px] text-emerald-400/80 font-medium">
              94.6% Aprobación en QA
            </div>
          </div>

        </div>

        {/* Two Column Layout: Quick Actions & Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Suite Navigation Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">
              Módulos del Sistema Operativo
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: CRM & WhatsApp */}
              <div 
                onClick={() => navigate('/inbox')}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_15px_-3px_rgba(52,211,153,0.3)] transition-all border border-emerald-500/20">
                  <MessageSquare size={18} />
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">
                  WhatsApp Inbox & Ventas IA
                </h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Supervisa el bot de WhatsApp, toma el control en vivo y responde a prospectos en tiempo real.
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                  Abrir Bandeja <ArrowUpRight size={14} />
                </div>
              </div>

              {/* Card 2: Marketing Pilot */}
              <div 
                onClick={() => navigate('/campaigns')}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)] transition-all border border-amber-500/20">
                  <Zap size={18} />
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">
                  Piloto IA de Marketing
                </h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Genera campañas autónomas con copywriter, arte visual y control de calidad antes de publicar.
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                  Configurar Piloto <ArrowUpRight size={14} />
                </div>
              </div>

              {/* Card 3: Official Catalog */}
              <div 
                onClick={() => navigate('/catalog')}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)] transition-all border border-cyan-500/20">
                  <BarChart3 size={18} />
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">
                  Catálogo & Tarifario Oficial
                </h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Configura los precios que la IA consulta para cotizar formalmente a los clientes.
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-cyan-400 uppercase tracking-wide">
                  Gestionar Tarifas <ArrowUpRight size={14} />
                </div>
              </div>

              {/* Card 4: RAG Knowledge Base */}
              <div 
                onClick={() => navigate('/knowledge')}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] transition-all border border-purple-500/20">
                  <Sparkles size={18} />
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">
                  Base de Conocimiento (RAG)
                </h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Entrena a la IA con manuales, políticas y preguntas frecuentes de tu empresa.
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-purple-400 uppercase tracking-wide">
                  Subir Documentos <ArrowUpRight size={14} />
                </div>
              </div>

            </div>
          </div>

          {/* Right 1 Col: Social Accounts & AI Live Status */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">
              Cuentas Conectadas
            </h2>

            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-2">
              {accounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-inner ${
                    acc.platform === 'INSTAGRAM' 
                      ? 'bg-gradient-to-tr from-yellow-400/80 via-pink-500/80 to-purple-600/80 border border-white/20' 
                      : 'bg-[#1877F2]/80 border border-white/20'
                  }`}>
                    {acc.platform === 'INSTAGRAM' ? 'IG' : 'FB'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{acc.account_name}</p>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_1px_rgba(52,211,153,0.8)] animate-pulse"></span> Sincronizado
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 backdrop-blur-md space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">SLA de Respuesta IA</span>
              </div>
              <p className="text-sm text-slate-300">
                Tiempo promedio de atención en WhatsApp: <span className="font-bold font-mono text-cyan-300">1.2s</span>
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;
