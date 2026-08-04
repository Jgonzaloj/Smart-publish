import React, { useState } from 'react';
import { Image, Wand2, Send, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export const Composer = () => {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [platform, setPlatform] = useState<'FACEBOOK' | 'INSTAGRAM'>('FACEBOOK');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  React.useEffect(() => {
    api.get('/system/metrics').then(res => {
      if (res.data.success && res.data.data.accounts) {
        setAccounts(res.data.data.accounts);
      }
    }).catch(console.error);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateAI = async () => {
    if (!topic) return alert('Ingresa un tema primero');
    setIsGenerating(true);
    try {
      const response = await api.post('/ai/suggest', { topic });
      if (response.data.success) {
        setContent(response.data.data);
      }
    } catch (error) {
      console.error(error);
      alert('Error generando contenido');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!content) return alert('El contenido no puede estar vacío');
    if (platform === 'INSTAGRAM' && !imageFile) {
        return alert('Instagram requiere obligatoriamente una imagen para publicar.');
    }

    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append('workspaceId', 'ws-1'); // MVP
      formData.append('platform', platform);
      formData.append('message', content);
      
      if (selectedAccountId) {
          formData.append('accountId', selectedAccountId);
      }
      
      if (imageFile) {
          formData.append('image', imageFile);
      }

      if (isScheduled) {
          if (!scheduleDate || !scheduleTime) {
              setIsPublishing(false);
              return alert('Por favor selecciona una fecha y hora para programar.');
          }
          const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
          formData.append('scheduledAt', scheduledAt);
      }

      const response = await api.post('/automation/schedule', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        alert('¡Publicación encolada/enviada con éxito!');
        setContent('');
        setImageFile(null);
        setImagePreview(null);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Error al publicar. Verifica tu sesión o consola.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Columna Izquierda: Editor */}
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">Creador de Publicaciones</h2>
        
        <div className="flex gap-4">
            <button 
                onClick={() => setPlatform('FACEBOOK')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${platform === 'FACEBOOK' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >
                Facebook
            </button>
            <button 
                onClick={() => setPlatform('INSTAGRAM')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${platform === 'INSTAGRAM' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >
                Instagram
            </button>
        </div>

        {accounts.filter(a => a.platform === platform).length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecciona la Cuenta Destino</label>
            <select 
              className="input-field"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="">-- Usar cuenta por defecto --</option>
              {accounts.filter(a => a.platform === platform).map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Asistente IA (Gemini)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ej: Lanzamiento de nuestro nuevo café orgánico..." 
                className="input-field"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating}
                className="btn-secondary"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} className="text-brand-500" />}
                <span className="hidden sm:inline">Generar</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contenido</label>
            <textarea 
              className="input-field min-h-[200px] resize-none"
              placeholder="Escribe tu publicación aquí..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="scheduleToggle"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
              />
              <label htmlFor="scheduleToggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Programar publicación para más tarde
              </label>
            </div>
            
            {isScheduled && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="date" 
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="input-field max-w-[200px]"
                  min={new Date().toISOString().split('T')[0]}
                />
                <input 
                  type="time" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="input-field max-w-[150px]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 py-2">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageChange} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 transition-colors rounded-lg ${platform === 'INSTAGRAM' && !imageFile ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/20 animate-pulse' : 'text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Image size={24} />
            </button>
            <div className="flex-1"></div>
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="btn-primary"
            >
              {isPublishing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {isScheduled ? 'Programar' : 'Publicar Ahora'}
            </button>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Preview */}
      <div className="hidden lg:flex flex-col gap-6">
        <h2 className="text-xl font-bold opacity-0">Preview</h2>
        <div className="flex-1 glass-panel p-6 flex flex-col bg-slate-100/50 dark:bg-slate-900/50">
          <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">
            Vista Previa - {platform === 'FACEBOOK' ? 'Facebook' : 'Instagram'}
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden max-w-sm mx-auto w-full">
            <div className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${platform === 'FACEBOOK' ? 'bg-blue-100' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500'}`}></div>
              <div>
                <p className="font-bold text-sm">Tu Cuenta</p>
                <p className="text-xs text-slate-500">Justo ahora</p>
              </div>
            </div>
            
            {platform === 'INSTAGRAM' && imagePreview ? (
                <>
                    <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-96" />
                    <div className="px-4 py-3 text-sm whitespace-pre-wrap border-t border-slate-100 dark:border-slate-700">
                        <span className="font-bold mr-2">tu_cuenta</span>
                        {content || <span className="text-slate-400 italic">Escribe una descripción...</span>}
                    </div>
                </>
            ) : (
                <>
                    <div className="px-4 pb-4 text-sm whitespace-pre-wrap">
                    {content || <span className="text-slate-400 italic">Aquí aparecerá el texto de tu publicación...</span>}
                    </div>
                    {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-64 border-t border-slate-200 dark:border-slate-700" />
                    )}
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
