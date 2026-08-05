import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Share2, Loader2, AlertCircle, RefreshCw, Unplug, Info, Clock, Briefcase, Camera } from 'lucide-react';

export const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  const fetchStatus = async () => {
    try {
      setFetchingStatus(true);
      const response = await api.get('/system/status');
      if (response.data.success && response.data.data.accounts) {
        setAccounts(response.data.data.accounts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnectFacebook = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/social/facebook/auth-url');
      if (response.data.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error(error);
      alert('Error conectando con Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  const facebookAccounts = accounts.filter(a => a.platform === 'FACEBOOK');
  const instagramAccounts = accounts.filter(a => a.platform === 'INSTAGRAM');
  const linkedinAccounts = accounts.filter(a => a.platform === 'LINKEDIN'); // Futuro
  const tiktokAccounts = accounts.filter(a => a.platform === 'TIKTOK'); // Futuro

  const isMetaConnected = facebookAccounts.length > 0 || instagramAccounts.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Integraciones y Cuentas</h2>
          <p className="text-slate-500 mt-1">Conecta tus redes sociales para empezar a publicar y analizar tu contenido.</p>
        </div>
        <button 
          onClick={fetchStatus} 
          disabled={fetchingStatus}
          className="btn-secondary whitespace-nowrap"
        >
          <RefreshCw size={18} className={fetchingStatus ? 'animate-spin' : ''} /> 
          Sincronizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* TARJETA META (FACEBOOK + INSTAGRAM) */}
        <div className={`glass-panel overflow-hidden transition-all duration-300 relative group
          ${isMetaConnected ? 'border-brand-200 dark:border-brand-800 ring-1 ring-brand-500/20 shadow-lg shadow-brand-500/10' : 'hover:border-slate-300 dark:hover:border-slate-600'}
        `}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="p-6 relative z-10 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md z-10">
                    <Share2 size={24} />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md relative z-0">
                    <Camera size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold break-words max-w-[200px] sm:max-w-full">Meta Business</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {isMetaConnected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        <AlertCircle size={12} className="shrink-0" /> Requiere conexión
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-1">
              Desbloquea el poder de publicar simultáneamente en tus páginas de Facebook y cuentas profesionales de Instagram.
            </p>

            {isMetaConnected ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cuentas vinculadas</div>
                {facebookAccounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center">
                        <Share2 size={14} />
                      </div>
                      <span className="font-semibold text-sm">{acc.account_name}</span>
                    </div>
                  </div>
                ))}
                {instagramAccounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-500/10 text-pink-600 flex items-center justify-center">
                        <Camera size={14} />
                      </div>
                      <span className="font-semibold text-sm">{acc.account_name}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                  <button className="text-red-500 hover:text-red-600 text-sm font-semibold flex items-center gap-1 transition-colors">
                    <Unplug size={16} /> Desconectar Meta
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleConnectFacebook}
                disabled={isLoading}
                className="w-full btn-primary bg-[#1877F2] hover:bg-[#166fe5] shadow-blue-500/30 text-white justify-center py-3"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                Conectar con Facebook e Instagram
              </button>
            )}
          </div>
        </div>

        {/* TARJETA LINKEDIN */}
        <div className={`glass-panel overflow-hidden transition-all duration-300 relative group
          ${linkedinAccounts.length > 0 ? 'border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10' : 'hover:border-slate-300 dark:hover:border-slate-600'}
        `}>
          <div className="p-6 relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-md">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">LinkedIn</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      <Clock size={12} /> Próximamente
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-1">
              Conecta tu perfil profesional o la página de tu empresa para llegar a tu red B2B. (Disponible en la fase 2).
            </p>

            <button 
              disabled={true}
              className="w-full btn-primary bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed justify-center py-3 shadow-none border border-slate-300 dark:border-slate-700"
            >
              Conectar LinkedIn
            </button>
          </div>
        </div>

        {/* TARJETA TIKTOK */}
        <div className={`glass-panel overflow-hidden transition-all duration-300 relative group lg:col-span-2 lg:max-w-2xl
          ${tiktokAccounts.length > 0 ? 'border-zinc-200 dark:border-zinc-800 ring-1 ring-zinc-500/20 shadow-lg shadow-zinc-500/10' : 'hover:border-slate-300 dark:hover:border-slate-600'}
        `}>
          <div className="p-6 relative z-10 flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-16 h-16 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg shrink-0">
              <Share2 size={32} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">TikTok Creators</h3>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  <Clock size={12} /> Próximamente
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Programa tus videos de formato corto directamente a tu feed de TikTok. La integración directa estará disponible una vez que la app sea aprobada por TikTok for Developers.
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <button 
                disabled={true}
                className="w-full sm:w-auto btn-primary bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed justify-center px-8 shadow-none border border-slate-300 dark:border-slate-700"
              >
                Conectar
              </button>
            </div>
          </div>
        </div>

      </div>
      
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex gap-3 text-blue-800 dark:text-blue-300">
        <Info size={24} className="shrink-0" />
        <p className="text-sm font-medium">
          <strong>Seguridad primero:</strong> No guardamos tus contraseñas. Utilizamos tokens de acceso seguros oficiales (OAuth 2.0) proporcionados por las propias plataformas, los cuales puedes revocar en cualquier momento.
        </p>
      </div>

    </div>
  );
};
