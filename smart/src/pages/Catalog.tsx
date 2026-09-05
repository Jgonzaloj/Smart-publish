import React, { useState, useEffect } from 'react';
import { 
  Tag, Plus, Search, ShieldCheck, 
  CheckCircle2, X
} from 'lucide-react';
import { api } from '../lib/api';

interface Service {
  id: string;
  name: string;
  category_name: string;
  amount: number;
  currency: string;
  duration?: string;
  conditions?: string;
  is_active: boolean;
}

export function Catalog() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Marketing Digital');
  const [amount, setAmount] = useState('250');
  const [currency, setCurrency] = useState('USD');
  const [duration, setDuration] = useState('Mensual');
  const [conditions, setConditions] = useState('');

  const fetchCatalog = async () => {
    try {
      const res = await api.get('/api/catalog');
      if (res.data && res.data.services) {
        setServices(res.data.services);
      }
    } catch (err) {
      console.error('Error loading catalog', err);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    try {
      const res = await api.post('/api/catalog', {
        name,
        category,
        amount: Number(amount),
        currency,
        duration,
        conditions
      });

      if (res.data && res.data.service) {
        setServices([...services, res.data.service]);
        setShowAddModal(false);
        setName('');
        setConditions('');
      }
    } catch (e) {
      console.error('Error creating service', e);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(services.map(s => s.category_name || 'General')))];

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.conditions?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory !== 'ALL' && s.category_name !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Catálogo & Tarifario Oficial</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              SKILL-08
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Precios y servicios oficiales de la empresa. La Inteligencia Artificial consulta esta fuente de verdad para cotizar.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary shrink-0"
        >
          <Plus size={16} /> Agregar Servicio
        </button>
      </div>

      {/* Anti-Hallucination Safe Notice */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Garantía Anti-Alucinación Activa (SKILL-08 & SKILL-12)</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
            La IA tiene estrictamente prohibido inventar o alterar precios. Cada vez que un prospecto pide una cotización en WhatsApp, el sistema extrae las tarifas exactas de esta tabla oficial.
          </p>
        </div>
      </div>

      {/* Filter and Categories Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por servicio o término..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'Todos los Servicios' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredServices.map(service => (
          <div 
            key={service.id}
            className="glass-panel p-5 flex flex-col justify-between group hover:border-brand-300 dark:hover:border-brand-700"
          >
            <div>
              {/* Category & Status */}
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {service.category_name}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} /> Activo en IA
                </span>
              </div>

              {/* Service Name */}
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {service.name}
              </h3>

              {/* Conditions / Details */}
              {service.conditions && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {service.conditions}
                </p>
              )}
            </div>

            {/* Price Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tarifa Oficial</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    ${service.amount}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-mono">{service.currency}</span>
                  {service.duration && (
                    <span className="text-xs text-slate-400">/ {service.duration}</span>
                  )}
                </div>
              </div>

              <div className="px-3 py-1 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold font-mono">
                ID: {service.id}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Modal: Add Service */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag size={20} className="text-brand-600 dark:text-brand-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Servicio Oficial</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Servicio *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Plan Community Manager Full" 
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                <input 
                  type="text" 
                  placeholder="Ej: Marketing Digital" 
                  className="input-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Precio *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="250" 
                    className="input-field font-mono"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Moneda</label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PEN">PEN (S/)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Frecuencia / Duración</label>
                <input 
                  type="text" 
                  placeholder="Ej: Mensual / Pago Único" 
                  className="input-field"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Condiciones & Entregables</label>
                <textarea 
                  placeholder="Especifica qué incluye el paquete..." 
                  className="input-field min-h-[70px] resize-none"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
