import React, { useState, useEffect } from 'react';
import { Image, Wand2, Send, Loader2, Smile, Hash, Heart, MessageCircle, Share2, Bookmark, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

export const Composer = () => {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
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

  const handleGenerateImage = async () => {
    if (!topic) return alert('Ingresa un tema primero para generar la imagen');
    setIsGeneratingImage(true);
    try {
      const response = await api.post('/ai/image', { topic });
      if (response.data.success) {
        const dataUrl = response.data.data;
        setImagePreview(dataUrl);
        const fetchRes = await fetch(dataUrl);
        const blob = await fetchRes.blob();
        const file = new File([blob], "ai-generated-image.jpg", { type: "image/jpeg" });
        setImageFile(file);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Error al generar la imagen');
    } finally {
      setIsGeneratingImage(false);
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
      
      {/* Columna Izquierda: Editor */}
      <div className="xl:col-span-7 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium text-white mb-1">Creador de Posts</h1>
          <p className="text-sm text-text-secondary">Crea, previsualiza y programa contenido en múltiples plataformas.</p>
        </div>
        
        {/* Selector de Plataformas */}
        <div className="flex bg-surface border border-borderc p-1 rounded-xl w-max">
            <button 
                onClick={() => setPlatform('FACEBOOK')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${platform === 'FACEBOOK' ? 'bg-surface-raised text-white border border-borderc' : 'text-text-secondary hover:text-white'}`}
            >
                Facebook
            </button>
            <button 
                onClick={() => setPlatform('INSTAGRAM')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${platform === 'INSTAGRAM' ? 'bg-surface-raised text-white border border-borderc' : 'text-text-secondary hover:text-white'}`}
            >
                Instagram
            </button>
        </div>

        <div className="bg-surface border border-borderc rounded-xl p-5 sm:p-6 flex flex-col gap-5">
          {/* Cuenta Destino */}
          {accounts.filter(a => a.platform === platform).length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Publicar como</label>
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

          {/* Asistente IA */}
          <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-surface-raised border border-borderc">
            <label className="text-xs font-semibold text-purple flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple" /> Piloto IA (Gemini)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                placeholder="Ej: Anuncia nuestro nuevo menú de temporada con emojis..." 
                className="input-field flex-1"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleGenerateAI} 
                  disabled={isGenerating || !topic}
                  className="bg-purple/20 hover:bg-purple/30 text-purple border border-purple/30 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                  Redactar
                </button>
                <button 
                  onClick={handleGenerateImage} 
                  disabled={isGeneratingImage || !topic}
                  className="bg-surface hover:bg-surface-raised text-text-secondary hover:text-white border border-borderc px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                  title="Generar Imagen con IA"
                >
                  {isGeneratingImage ? <Loader2 className="animate-spin" size={14} /> : <Image size={14} />}
                  Imagen IA
                </button>
              </div>
            </div>
          </div>

          {/* Área de Texto y Controles */}
          <div className="flex flex-col">
            <div className="relative">
              <textarea 
                className="input-field min-h-[180px] resize-none rounded-b-none border-b-0 text-sm leading-relaxed p-3.5"
                placeholder="¿Qué quieres compartir hoy con tu audiencia?..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={maxChars}
              />
              {/* Barra de Progreso de Caracteres */}
              <div className="h-0.5 w-full bg-borderc">
                <div 
                  className={`h-full transition-all duration-300 ${progressPercentage > 90 ? 'bg-danger' : progressPercentage > 75 ? 'bg-warning' : 'bg-success'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Toolbar debajo del textarea */}
            <div className="flex items-center justify-between p-2.5 bg-surface-raised rounded-b-lg border border-borderc">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium ${platform === 'INSTAGRAM' && !imageFile ? 'text-warning bg-warning/10' : 'text-text-secondary hover:text-white hover:bg-surface'}`}
                >
                  <Image size={15} />
                  <span>Multimedia</span>
                </button>
                <button className="p-1.5 text-text-secondary hover:text-white hover:bg-surface rounded-md transition-colors" title="Emojis">
                  <Smile size={15} />
                </button>
                <button className="p-1.5 text-text-secondary hover:text-white hover:bg-surface rounded-md transition-colors" title="Hashtags">
                  <Hash size={15} />
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </div>
              <div className={`text-xs font-mono font-medium ${progressPercentage > 90 ? 'text-danger' : 'text-text-secondary'}`}>
                {content.length.toLocaleString()} / {maxChars.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Programación */}
          <div className="bg-surface-raised rounded-lg p-3.5 border border-borderc">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded border-borderc text-accent focus:ring-accent bg-surface"
                />
                <span className="text-xs font-medium text-white transition-colors">
                  Programar publicación para más tarde
                </span>
              </label>
            </div>
            
            {isScheduled && (
              <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-text-secondary">Fecha</label>
                  <input 
                    type="date" 
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="input-field py-1.5 text-xs"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-text-secondary">Hora</label>
                  <input 
                    type="time" 
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Acción Principal */}
          <div className="pt-2 flex justify-end">
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isPublishing ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              {isScheduled ? 'Dejar Programado' : 'Publicar Ahora'}
            </button>
          </div>

        </div>
      </div>

      {/* Columna Derecha: Vista Previa */}
      <div className="hidden xl:flex flex-col gap-4 xl:col-span-5 sticky top-6">
        <div>
          <h2 className="text-sm font-medium text-text-primary flex items-center gap-2">
            Vista Previa en Vivo
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">Así es como lo verá tu audiencia en tiempo real.</p>
        </div>

        {platform === 'FACEBOOK' ? (
          /* MOCKUP FACEBOOK */
          <div className="bg-[#18191a] rounded-xl border border-borderc overflow-hidden w-full max-w-md mx-auto shadow-xl transition-colors">
            {/* Header FB */}
            <div className="p-3.5 flex items-center justify-between border-b border-[#3a3b3c]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                  FB
                </div>
                <div>
                  <p className="font-semibold text-xs text-white leading-tight">{selectedAccountName}</p>
                  <p className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                    Justo ahora · <span>🌎</span>
                  </p>
                </div>
              </div>
              <div className="text-text-secondary text-sm">•••</div>
            </div>
            
            {/* Texto FB */}
            <div className="p-3.5 text-xs text-slate-200 whitespace-pre-wrap break-words leading-relaxed min-h-[60px]">
              {content || <span className="text-text-secondary italic">Escribe algo en el editor para previsualizarlo aquí...</span>}
            </div>
            
            {/* Imagen FB */}
            {imagePreview && (
              <div className="w-full bg-black overflow-hidden border-y border-borderc">
                <img src={imagePreview} alt="Preview" className="w-full max-h-[380px] object-contain" />
              </div>
            )}
            
            {/* Actions FB */}
            <div className="px-3.5 py-2 border-t border-[#3a3b3c]/40">
              <div className="flex items-center justify-between pt-1 text-[11px] text-text-secondary">
                <button className="flex-1 py-1 text-center hover:text-white transition-colors">👍 Me gusta</button>
                <button className="flex-1 py-1 text-center hover:text-white transition-colors">💬 Comentar</button>
                <button className="flex-1 py-1 text-center hover:text-white transition-colors">↗ Compartir</button>
              </div>
            </div>
          </div>
        ) : (
          /* MOCKUP INSTAGRAM */
          <div className="bg-[#121212] rounded-xl border border-borderc overflow-hidden w-full max-w-[380px] mx-auto shadow-xl transition-colors">
            {/* Header IG */}
            <div className="p-3 flex items-center justify-between border-b border-borderc">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                  <div className="w-full h-full bg-surface rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    IG
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-xs text-white leading-tight">{selectedAccountName.replace(/\s+/g, '').toLowerCase()}</p>
                  <p className="text-[10px] text-text-secondary">Original Audio</p>
                </div>
              </div>
              <div className="text-text-secondary text-xs">•••</div>
            </div>

            {/* Imagen IG */}
            <div className="w-full aspect-square bg-surface flex items-center justify-center overflow-hidden border-y border-borderc relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-text-secondary flex flex-col items-center gap-1.5 p-4 text-center">
                  <Image size={36} className="opacity-30" />
                  <p className="text-xs font-medium">Instagram requiere imagen obligatoria</p>
                </div>
              )}
            </div>

            {/* Actions IG */}
            <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-text-secondary">
              <div className="flex gap-3 items-center">
                <Heart size={18} className="hover:text-danger cursor-pointer transition-colors" />
                <MessageCircle size={18} className="cursor-pointer" />
                <Share2 size={18} className="cursor-pointer" />
              </div>
              <Bookmark size={18} className="cursor-pointer" />
            </div>

            {/* Texto IG */}
            <div className="px-3 pb-3">
              <div className="text-xs text-slate-200 leading-relaxed mt-1">
                <span className="font-semibold text-white mr-1.5">{selectedAccountName.replace(/\s+/g, '').toLowerCase()}</span>
                {content ? (
                  <span className="whitespace-pre-wrap">{content}</span>
                ) : (
                  <span className="text-text-secondary italic">La descripción aparecerá aquí...</span>
                )}
              </div>
              <p className="text-[10px] font-mono text-text-secondary uppercase mt-2">Hace un momento</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
