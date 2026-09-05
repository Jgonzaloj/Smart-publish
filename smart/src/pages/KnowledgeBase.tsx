import React, { useState } from 'react';
import { 
  UploadCloud, CheckCircle2, 
  Search, Sparkles, BookOpen, Database
} from 'lucide-react';

interface KnowledgeDoc {
  id: string;
  title: string;
  file_type: string;
  total_chunks: number;
  status: 'READY' | 'INDEXING';
  created_at: string;
  size: string;
}

export function KnowledgeBase() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([
    {
      id: 'doc-1',
      title: 'Politicas_Garantias_y_Devoluciones_2026.pdf',
      file_type: 'PDF',
      total_chunks: 14,
      status: 'READY',
      created_at: '2026-08-14',
      size: '1.2 MB'
    },
    {
      id: 'doc-2',
      title: 'Manual_Comercial_Servicios_Digitales.docx',
      file_type: 'DOCX',
      total_chunks: 28,
      status: 'READY',
      created_at: '2026-08-15',
      size: '850 KB'
    },
    {
      id: 'doc-3',
      title: 'FAQ_Preguntas_Frecuentes_Clientes.txt',
      file_type: 'TXT',
      total_chunks: 8,
      status: 'READY',
      created_at: '2026-08-16',
      size: '120 KB'
    }
  ]);

  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: KnowledgeDoc = {
        id: `doc-${Date.now()}`,
        title: 'Presentacion_Corporativa_Smart_Publish.pdf',
        file_type: 'PDF',
        total_chunks: 18,
        status: 'READY',
        created_at: new Date().toISOString().split('T')[0],
        size: '2.4 MB'
      };
      setDocs([newDoc, ...docs]);
      setIsUploading(false);
    }, 1500);
  };

  const handleTestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setTestResults([
        `[Fragmento Relevante - Score 0.94]: "Las garantías cubren 30 días continuos con derecho a soporte técnico 24/7 y 2 revisiones de entregables de campaña."`,
        `[Fragmento Relevante - Score 0.88]: "Los pagos se procesan en USD o PEN al tipo de cambio oficial del día, con facturación electrónica automática vía Stripe/Sunat."`,
        `[Fragmento Relevante - Score 0.81]: "El tiempo de entrega para páginas web y chatbots es de 5 días hábiles a partir de la recepción del brief."`
      ]);
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Base de Conocimiento Empresarial (RAG)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              SKILL-19
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Alimenta a la Inteligencia Artificial con documentos, manuales, políticas y preguntas frecuentes de tu empresa.
          </p>
        </div>

        <button 
          onClick={handleSimulateUpload}
          disabled={isUploading}
          className="btn-primary shrink-0"
        >
          <UploadCloud size={16} /> {isUploading ? 'Procesando Embeddings...' : 'Subir Documento'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Documents Index (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-brand-600 dark:text-brand-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Archivos Indexados ({docs.length})</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Modelo: text-embedding-004</span>
            </div>

            {/* Drag & Drop Upload Dropzone Area */}
            <div 
              onClick={handleSimulateUpload}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/40 mb-4"
            >
              <UploadCloud size={32} className="mx-auto text-brand-600 dark:text-brand-400 mb-2 animate-pulse-subtle" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Haz clic o arrastra aquí tus archivos PDF, DOCX o TXT
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                La IA segmentará el texto en chunks y calculará los vectores semánticos automáticamente.
              </p>
            </div>

            {/* Document list */}
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-brand-400 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-brand-600 dark:text-brand-400 shadow-sm shrink-0">
                      {doc.file_type}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{doc.total_chunks} fragmentos indexados</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Listo
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right Column: Semantic Test Search Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="glass-panel p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Simulador de Recuperación RAG</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Prueba en vivo qué fragmentos de información recupera el bot cuando un cliente le hace una pregunta en WhatsApp.
            </p>

            {/* Test Form */}
            <form onSubmit={handleTestSearch} className="space-y-3 mb-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ej: ¿Qué pasa si quiero cancelar o pedir devolución?"
                  className="input-field text-xs py-2.5"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                disabled={isSearching}
                className="btn-primary w-full text-xs py-2"
              >
                <Search size={14} /> {isSearching ? 'Calculando Similitud Coseno...' : 'Probar Búsqueda Vectorial'}
              </button>
            </form>

            {/* Results Display */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60 overflow-y-auto min-h-[220px]">
              <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Fragmentos Recuperados (Top K)
              </div>

              {testResults.length > 0 ? (
                <div className="space-y-2.5">
                  {testResults.map((res, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
                      {res}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8 text-xs">
                  <BookOpen size={28} className="opacity-40 mb-2" />
                  <p>Escribe una consulta arriba para probar el motor semántico.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
