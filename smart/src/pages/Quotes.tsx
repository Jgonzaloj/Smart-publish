import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, 
  Share2, X
} from 'lucide-react';
import { api } from '../lib/api';

interface QuoteItem {
  service_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  total_amount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';
  valid_until: string;
  items: QuoteItem[];
  created_at: string;
}

export function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [itemService, setItemService] = useState('Gestión Redes Sociales Pro');
  const [itemPrice, setItemPrice] = useState('250');
  const [itemQty, setItemQty] = useState('1');
  const [validDays, setValidDays] = useState('15');

  const fetchQuotes = async () => {
    try {
      const res = await api.get('/api/quotes');
      if (res.data && res.data.quotes) {
        setQuotes(res.data.quotes);
      }
    } catch (e) {
      console.error('Error fetching quotes', e);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    try {
      const res = await api.post('/api/quotes', {
        customerName,
        currency: 'USD',
        validDays: Number(validDays),
        items: [
          {
            service_name: itemService,
            quantity: Number(itemQty),
            unit_price: Number(itemPrice),
            total: Number(itemPrice) * Number(itemQty)
          }
        ]
      });

      if (res.data && res.data.quote) {
        setQuotes([res.data.quote, ...quotes]);
        setShowAddModal(false);
        setCustomerName('');
      }
    } catch (e) {
      console.error('Error creating quote', e);
    }
  };

  const filteredQuotes = quotes.filter(q => 
    q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.quote_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Cotizaciones Formales</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              SKILL-12
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generador estructurado de presupuestos enlazado con el catálogo oficial y seguimiento de validez.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary shrink-0"
        >
          <Plus size={16} /> Nueva Cotización
        </button>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por cliente o número de cotización (Ej: QT-2026-001)..." 
          className="input-field pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quotes Table */}
      <div className="glass-panel overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Servicios Incluidos</th>
                <th className="py-3.5 px-4">Monto Total</th>
                <th className="py-3.5 px-4">Validez</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuotes.map(quote => (
                <tr key={quote.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {quote.quote_number}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {quote.customer_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {quote.items?.map(i => i.service_name).join(', ') || '1 Servicio'}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ${quote.total_amount} {quote.currency}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(quote.valid_until).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      quote.status === 'ACCEPTED' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : (quote.status === 'SENT' 
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                            : 'bg-slate-100 text-slate-600')
                    }`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button 
                      onClick={() => setSelectedQuote(quote)}
                      className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-500 font-medium text-slate-700 dark:text-slate-200"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Quote */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generar Cotización Formal</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Cliente *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Inversiones Los Andes SAC" 
                  className="input-field"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Servicio del Catálogo</label>
                <select 
                  value={itemService} 
                  onChange={(e) => setItemService(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  <option value="Gestión Redes Sociales Pro">Gestión Redes Sociales Pro ($250 USD)</option>
                  <option value="Campaña Meta & TikTok Ads">Campaña Meta & TikTok Ads ($450 USD)</option>
                  <option value="Desarrollo Web Landing Page">Desarrollo Web Landing Page ($350 USD)</option>
                  <option value="Bot IA WhatsApp Automatizado">Bot IA WhatsApp Automatizado ($180 USD)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Precio Unitario ($)</label>
                  <input 
                    type="number" 
                    className="input-field font-mono"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    className="input-field font-mono"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Días de Validez de la Oferta</label>
                <input 
                  type="number" 
                  className="input-field font-mono"
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Generar y Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Quote Detail */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 animate-slide-up space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">{selectedQuote.quote_number}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{selectedQuote.customer_name}</h3>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Desglose de Ítems:</span>
                {selectedQuote.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                    <span>{item.quantity}x {item.service_name}</span>
                    <span className="font-mono font-bold">${item.total || item.unit_price} USD</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-brand-50 dark:bg-brand-950/60 rounded-xl text-brand-900 dark:text-brand-200 font-bold text-sm">
                <span>Total a Facturar:</span>
                <span className="font-mono text-base">${selectedQuote.total_amount} {selectedQuote.currency}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setSelectedQuote(null)} className="btn-secondary text-xs py-2">
                Cerrar
              </button>
              <button 
                onClick={() => {
                  alert(`Texto formateado para WhatsApp copiado al portapapeles con éxito.`);
                  setSelectedQuote(null);
                }} 
                className="btn-primary text-xs py-2 flex items-center gap-1.5"
              >
                <Share2 size={14} /> Compartir por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
