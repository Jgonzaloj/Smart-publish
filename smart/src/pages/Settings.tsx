import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Share2, Loader2, AlertCircle, RefreshCw, Unplug, Info, Clock, Briefcase, Camera, Users, Link as LinkIcon } from 'lucide-react';
import { TeamSettings } from './TeamSettings';

export const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<'integrations' | 'team'>('integrations');

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

  const handleConnectTikTok = () => {
    setIsLoading(true);
    window.location.href = api.defaults.baseURL + '/social/tiktok/auth';
  };

  const facebookAccounts = accounts.filter(a => a.platform === 'FACEBOOK');
  const instagramAccounts = accounts.filter(a => a.platform === 'INSTAGRAM');
  const tiktokAccounts = accounts.filter(a => a.platform === 'TIKTOK'); 

  const isMetaConnected = facebookAccounts.length > 0 || instagramAccounts.length > 0;
  const isTikTokConnected = tiktokAccounts.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium text-white mb-1">Configuración y Conexiones</h1>
          <p className="text-sm text-text-secondary">Gestiona tus integraciones sociales y permisos de equipo.</p>
        </div>
        <button 
          onClick={fetchStatus} 
          disabled={fetchingStatus}
          className="flex items-center gap-2 bg-surface hover:bg-surface-raised border border-borderc text-text-secondary hover:text-white px-3.5 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
        >
          <RefreshCw size={15} className={fetchingStatus ? 'animate-spin' : ''} /> 
          Sincronizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-borderc gap-4">
        <button 
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'integrations' ? 'text-white' : 'text-text-secondary hover:text-white'
          }`}
        >
          <LinkIcon size={16} className={activeTab === 'integrations' ? 'text-accent' : ''} /> 
          Canales Sociales
          {activeTab === 'integrations' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'team' ? 'text-white' : 'text-text-secondary hover:text-white'
          }`}
        >
          <Users size={16} className={activeTab === 'team' ? 'text-accent' : ''} /> 
          Equipo y Permisos
          {activeTab === 'team' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'team' && (
        <div className="mt-6">
          <TeamSettings />
        </div>
      )}

      {activeTab === 'integrations' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
            
            {/* Tarjeta Meta */}
            <div className="bg-surface border border-borderc rounded-xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-[#1877F2] text-white flex items-center justify-center border-2 border-surface shadow-sm z-10">
                        <Share2 size={18} />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white flex items-center justify-center border-2 border-surface shadow-sm relative z-0">
                        <Camera size={18} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Meta Business</h3>
                      <div className="mt-0.5">
                        {isMetaConnected ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-md border border-success/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Conectado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-surface-raised px-2 py-0.5 rounded-md border border-borderc">
                            <AlertCircle size={11} /> Desconectado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-text-secondary text-xs leading-relaxed mb-5">
                  Publica simultáneamente en tus páginas oficiales de Facebook y perfiles profesionales de Instagram.
                </p>

                {isMetaConnected && (
                  <div className="bg-surface-raised rounded-lg p-3.5 border border-borderc space-y-2 mb-4">
                    <div className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2">Cuentas vinculadas</div>
                    {facebookAccounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2]"></span>
                          <span className="text-white font-medium">{acc.account_name}</span>
                        </div>
                        <span className="text-[10px] text-text-secondary">Facebook</span>
                      </div>
                    ))}
                    {instagramAccounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                          <span className="text-white font-medium">{acc.account_name}</span>
                        </div>
                        <span className="text-[10px] text-text-secondary">Instagram</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {isMetaConnected ? (
                  <button className="text-danger hover:text-danger/80 text-xs font-medium flex items-center gap-1.5 transition-colors">
                    <Unplug size={14} /> Desconectar Meta
                  </button>
                ) : (
                  <button 
                    onClick={handleConnectFacebook}
                    disabled={isLoading}
                    className="w-full bg-accent hover:bg-accent-hover text-white text-xs font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Share2 size={16} />}
                    Conectar Facebook e Instagram
                  </button>
                )}
              </div>
            </div>

            {/* Tarjeta LinkedIn */}
            <div className="bg-surface border border-borderc rounded-xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shadow-sm">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">LinkedIn</h3>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-surface-raised px-2 py-0.5 rounded-md border border-borderc">
                          <Clock size={11} /> Próximamente
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-text-secondary text-xs leading-relaxed mb-5">
                  Conecta tu perfil profesional o página de empresa para automatizar publicaciones en tu red B2B.
                </p>
              </div>

              <button 
                disabled={true}
                className="w-full bg-surface-raised text-text-secondary/50 border border-borderc text-xs font-medium py-2.5 px-4 rounded-lg cursor-not-allowed text-center"
              >
                Próximamente disponible
              </button>
            </div>

            {/* Tarjeta TikTok */}
            <div className="bg-surface border border-borderc rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center lg:col-span-2">
              <div className="w-12 h-12 rounded-xl bg-surface-raised border border-borderc text-white flex items-center justify-center shadow-sm shrink-0">
                <Share2 size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-base font-semibold text-white">TikTok Creators</h3>
                  {isTikTokConnected ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-md border border-success/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-surface-raised px-2 py-0.5 rounded-md border border-borderc">
                      <AlertCircle size={11} /> Desconectado
                    </span>
                  )}
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Programa tus videos de formato corto directamente a tu feed de TikTok usando la API oficial.
                </p>
              </div>
              
              <div className="shrink-0 w-full sm:w-auto">
                {isTikTokConnected ? (
                  <button className="text-danger hover:text-danger/80 text-xs font-medium flex items-center gap-1.5 transition-colors">
                    <Unplug size={14} /> Desconectar
                  </button>
                ) : (
                  <button 
                    onClick={handleConnectTikTok}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-surface-raised hover:bg-borderc border border-borderc text-white text-xs font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Conectar TikTok'}
                  </button>
                )}
              </div>
            </div>

          </div>
          
          <div className="mt-6 bg-surface-raised border border-borderc rounded-xl p-4 flex gap-3 text-text-secondary text-xs leading-relaxed">
            <Info size={18} className="shrink-0 text-accent" />
            <p>
              <strong className="text-white">Seguridad y Privacidad:</strong> No almacenamos contraseñas personales. Todas las conexiones se realizan mediante tokens seguros oficiales OAuth 2.0 que puedes revocar en cualquier instante desde tus cuentas de red social.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
