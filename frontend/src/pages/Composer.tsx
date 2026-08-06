import React, { useState, useEffect } from 'react';
import { Image, Wand2, Send, Loader2, Smile, Hash, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
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

  useEffect(() => {
    api.get('/system/status').then(res => {
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
      // formData.append('workspaceId', 'ws-1'); // Eliminado: el backend lo lee del token
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

  const maxChars = platform === 'INSTAGRAM' ? 2200 : 63206;
  const progressPercentage = Math.min((content.length / maxChars) * 100, 100);
  
  const selectedAccountName = accounts.find(a => a.id === selectedAccountId)?.account_name || 'Tu Cuenta Profesional';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full max-w-7xl mx-auto pb-10">
      
      {/* Columna Izquierda: Editor (7 columnas) */}
      <div className="xl:col-span-7 flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Creador de Posts</h2>
          <p className="text-slate-500 mt-1">Crea, previsualiza y programa contenido en múltiples plataformas.</p>
        </div>
        
        {/* Selector de Plataformas Moderno */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-max">
            <button 
                onClick={() => setPlatform('FACEBOOK')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${platform === 'FACEBOOK' ? 'bg-white dark:bg-slate-700 text-[#1877F2] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                Facebook
            </button>
            <button 
                onClick={() => setPlatform('INSTAGRAM')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${platform === 'INSTAGRAM' ? 'bg-white dark:bg-slate-700 text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                Instagram
            </button>
        </div>

        <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden">
          {platform === 'INSTAGRAM' && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-yellow-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          )}
          {platform === 'FACEBOOK' && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          )}

          {/* Cuenta Destino */}
          {accounts.filter(a => a.platform === platform).length > 0 && (
            <div className="flex flex-col gap-2 relative z-10">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Publicar como</label>
              <select 
                className="input-field bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm focus:ring-brand-500/20"
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

          {/* Asistente IA */}
          <div className="flex flex-col gap-2 relative z-10">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Wand2 size={16} className="text-brand-500" /> Piloto IA Mágico
            </label>
            <div className="flex gap-2 group">
              <input 
                type="text" 
                placeholder="Ej: Anuncia nuestro nuevo menú de verano con emojis..." 
                className="input-field bg-white dark:bg-slate-900 shadow-sm transition-all focus:ring-brand-500/20"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
              />
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || !topic}
                className="btn-primary whitespace-nowrap shadow-brand-500/20 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : 'Escribir por mí'}
              </button>
            </div>
          </div>

          {/* Área de Texto y Controles */}
          <div className="flex flex-col relative z-10">
            <div className="relative group">
              <textarea 
                className="input-field min-h-[220px] resize-none bg-white dark:bg-slate-900 shadow-inner p-4 text-base leading-relaxed rounded-b-none focus:ring-0 focus:border-slate-300 dark:focus:border-slate-600 border-b-0"
                placeholder="¿Qué quieres compartir hoy con tu audiencia?..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={maxChars}
              />
              {/* Barra de Progreso de Caracteres */}
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${progressPercentage > 90 ? 'bg-red-500' : progressPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Toolbar debajo del textarea */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${platform === 'INSTAGRAM' && !imageFile ? 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                >
                  <Image size={18} />
                  <span className="hidden sm:inline">Multimedia</span>
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Emojis (Proximamente)">
                  <Smile size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Hashtags (Proximamente)">
                  <Hash size={18} />
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </div>
              <div className={`text-xs font-medium ${progressPercentage > 90 ? 'text-red-500' : 'text-slate-400'}`}>
                {content.length.toLocaleString()} / {maxChars.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Programación */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700 relative z-10">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${isScheduled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 absolute left-1 ${isScheduled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  Programar para más tarde
                </span>
              </label>
            </div>
            
            <div className={`grid grid-cols-2 gap-4 transition-all duration-300 overflow-hidden ${isScheduled ? 'mt-4 opacity-100 max-h-40' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
                <input 
                  type="date" 
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="input-field bg-white dark:bg-slate-900"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hora</label>
                <input 
                  type="time" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="input-field bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Acción Principal */}
          <div className="pt-4 flex justify-end relative z-10 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className={`btn-primary px-8 py-3 text-base shadow-xl ${isScheduled ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30' : (platform === 'INSTAGRAM' ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-pink-500/30' : 'bg-[#1877F2] shadow-blue-500/30')}`}
            >
              {isPublishing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {isScheduled ? 'Dejar Programado' : 'Publicar Ahora'}
            </button>
          </div>

        </div>
      </div>

      {/* Columna Derecha: Vista Previa Realista (5 columnas) */}
      <div className="hidden xl:flex flex-col gap-6 xl:col-span-5 sticky top-6">
        <div>
          <h2 className="text-lg font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
            Vista Previa en Vivo
          </h2>
          <p className="text-sm text-slate-400 mt-1">Así es como lo verá tu audiencia.</p>
        </div>

        {platform === 'FACEBOOK' ? (
          /* MOCKUP FACEBOOK */
          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden w-full max-w-md mx-auto transition-all">
            {/* Header FB */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[#1877F2] text-xl shrink-0 overflow-hidden">
                  <img src="https://ui-avatars.com/api/?name=SP&background=e2e8f0&color=1877f2" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-[15px] text-[#050505] dark:text-[#E4E6EB] leading-tight hover:underline cursor-pointer">{selectedAccountName}</p>
                  <p className="text-[13px] text-[#65676B] dark:text-[#B0B3B8] flex items-center gap-1">
                    Justo ahora · <span className="w-3 h-3 bg-slate-400 mask mask-globe">🌎</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer text-xl font-bold pb-2">...</div>
              </div>
            </div>
            
            {/* Texto FB */}
            <div className="px-4 pb-3 text-[15px] text-[#050505] dark:text-[#E4E6EB] whitespace-pre-wrap break-words font-normal">
              {content || <span className="text-slate-400 italic">Escribe algo para ver cómo queda...</span>}
            </div>
            
            {/* Imagen FB */}
            {imagePreview && (
              <div className="w-full bg-slate-100 dark:bg-black overflow-hidden border-y border-slate-200 dark:border-slate-800">
                <img src={imagePreview} alt="Preview" className="w-full max-h-[500px] object-contain" />
              </div>
            )}
            
            {/* Actions FB */}
            <div className="px-4 py-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700/50 text-[13px] text-[#65676B] dark:text-[#B0B3B8]">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xs p-1">👍</div>
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs p-1 -ml-1 border-2 border-white dark:border-[#242526]">❤️</div>
                  <span className="ml-1">Tú y 42 más</span>
                </div>
                <div>12 comentarios</div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 text-[#65676B] dark:text-[#B0B3B8] font-semibold text-[15px] transition-colors">
                  <span className="text-xl">👍</span> Me gusta
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 text-[#65676B] dark:text-[#B0B3B8] font-semibold text-[15px] transition-colors">
                  <MessageCircle size={20} /> Comentar
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 text-[#65676B] dark:text-[#B0B3B8] font-semibold text-[15px] transition-colors">
                  <Share2 size={20} /> Compartir
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MOCKUP INSTAGRAM */
          <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden w-full max-w-[400px] mx-auto shadow-2xl transition-all">
            {/* Header IG */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                  <div className="w-full h-full bg-white dark:bg-black rounded-full border border-white dark:border-black p-0.5">
                    <img src="https://ui-avatars.com/api/?name=IG&background=000&color=fff" alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-black dark:text-white leading-tight">{selectedAccountName.replace(/\s+/g, '').toLowerCase()}</p>
                  <p className="text-xs text-black dark:text-white opacity-60">Sponsored</p>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-black dark:bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-black dark:bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-black dark:bg-white rounded-full"></div>
              </div>
            </div>

            {/* Imagen IG */}
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-y border-slate-100 dark:border-slate-800 relative group">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 flex flex-col items-center gap-2">
                  <Image size={48} className="opacity-50" />
                  <p className="text-sm font-medium">Requiere imagen obligatoria</p>
                </div>
              )}
              {/* Pagination Dots falsos */}
              {imagePreview && (
                <div className="absolute bottom-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                </div>
              )}
            </div>

            {/* Actions IG */}
            <div className="px-3 pt-3 pb-1 flex items-center justify-between">
              <div className="flex gap-4 items-center text-black dark:text-white">
                <Heart size={24} className="hover:text-red-500 transition-colors cursor-pointer" />
                <MessageCircle size={24} className="cursor-pointer" />
                <Share2 size={24} className="cursor-pointer -rotate-45 mb-1" />
              </div>
              <Bookmark size={24} className="text-black dark:text-white cursor-pointer" />
            </div>

            {/* Texto IG */}
            <div className="px-3 pb-4">
              <p className="text-sm font-semibold text-black dark:text-white mb-1">1,342 Me gusta</p>
              <div className="text-sm text-black dark:text-white leading-relaxed">
                <span className="font-semibold mr-2">{selectedAccountName.replace(/\s+/g, '').toLowerCase()}</span>
                {content ? (
                  <span className="whitespace-pre-wrap">{content}</span>
                ) : (
                  <span className="text-slate-400 italic font-normal">La descripción de tu foto aparecerá aquí...</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 uppercase mt-2 font-medium tracking-wider">Hace 2 horas</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
