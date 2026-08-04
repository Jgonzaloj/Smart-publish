import { useState } from 'react';
import { api } from '../lib/api';
import { Share2, Loader2 } from 'lucide-react';

export const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);

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

  const handleConnectLinkedIn = async () => {
    window.location.href = '/api/social/linkedin/auth';
  };

  const handleConnectTikTok = async () => {
    window.location.href = '/api/social/tiktok/auth';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Configuración e Integraciones</h2>
      
      <div className="glass-panel p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Share2 className="text-blue-600" /> Facebook e Instagram
            </h3>
            <p className="text-slate-500 mt-1">
              Conecta tu cuenta de Meta para publicar en Páginas de Facebook y Cuentas Profesionales de Instagram.
            </p>
          </div>
          <button 
            onClick={handleConnectFacebook}
            disabled={isLoading}
            className="btn-primary bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
            Conectar Meta
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 mt-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Share2 className="text-blue-500" /> LinkedIn
            </h3>
            <p className="text-slate-500 mt-1">
              Conecta tu perfil o página de LinkedIn para llegar a profesionales.
            </p>
          </div>
          <button 
            onClick={handleConnectLinkedIn}
            disabled={isLoading}
            className="btn-primary bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
          >
            Conectar LinkedIn
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 mt-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Share2 className="text-black dark:text-white" /> TikTok
            </h3>
            <p className="text-slate-500 mt-1">
              Conecta tu cuenta de TikTok para programar la subida de videos.
            </p>
          </div>
          <button 
            onClick={handleConnectTikTok}
            disabled={isLoading}
            className="btn-primary bg-black hover:bg-zinc-800 shadow-black/20"
          >
            Conectar TikTok
          </button>
        </div>
      </div>
    </div>
  );
};
