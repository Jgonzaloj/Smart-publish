import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Phone, Mail, 
  Sparkles, X, UserPlus
} from 'lucide-react';
import { api } from '../lib/api';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'QUOTED' | 'NEGOTIATION' | 'WON' | 'LOST';

interface Lead {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  status: LeadStatus;
  score: number;
  estimated_value: number;
  customer_source?: string;
  notes?: string;
  created_at: string;
}

const COLUMNS: { id: LeadStatus; title: string; color: string; badgeBg: string }[] = [
  { id: 'NEW', title: 'Nuevo Prospecto', color: 'border-blue-500', badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  { id: 'CONTACTED', title: 'Contactado (IA)', color: 'border-amber-500', badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  { id: 'QUALIFIED', title: 'Calificado', color: 'border-purple-500', badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' },
  { id: 'QUOTED', title: 'Cotizado', color: 'border-cyan-500', badgeBg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300' },
  { id: 'NEGOTIATION', title: 'Negociación', color: 'border-indigo-500', badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' },
  { id: 'WON', title: 'Cerrado Ganado', color: 'border-emerald-500', badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { id: 'LOST', title: 'Perdido', color: 'border-rose-500', badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' }
];

export function CRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newValue, setNewValue] = useState('350');
  const [newNotes, setNewNotes] = useState('');

  const fetchLeads = async () => {
    try {
      const res = await api.get('/crm/leads');
      if (res.data && res.data.leads) {
        setLeads(res.data.leads);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await api.patch(`/api/crm/leads/${leadId}/status`, { status: newStatus });
    } catch (e) {
      console.error('Error updating status', e);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      const res = await api.post('/api/crm/leads', {
        name: newName,
        phone: newPhone,
        email: newEmail,
        estimatedValue: Number(newValue),
        notes: newNotes,
        source: 'MANUAL'
      });

      if (res.data && res.data.lead) {
        setLeads([res.data.lead, ...leads]);
        setShowAddModal(false);
        setNewName('');
        setNewPhone('');
        setNewEmail('');
        setNewNotes('');
      }
    } catch (err) {
      console.error('Error creating lead:', err);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.customer_phone?.includes(searchQuery) ||
    l.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPipelineValue = leads
    .filter(l => l.status !== 'LOST')
    .reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Pipeline de Ventas & Leads</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              SKILL-07
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de prospectos calificados por la IA con scoring y trazabilidad de ciclo de vida.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
            <span className="text-xs text-slate-400">Valor en Pipeline:</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">${totalPipelineValue.toLocaleString()} USD</span>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary shrink-0"
          >
            <Plus size={16} /> Nuevo Lead
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, teléfono o correo..." 
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Total: {filteredLeads.length} leads</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none min-h-[600px]">
        {COLUMNS.map(col => {
          const colLeads = filteredLeads.filter(l => l.status === col.id);
          const colTotal = colLeads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);

          return (
            <div key={col.id} className="w-72 shrink-0 flex flex-col bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800/60">
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.id === 'WON' ? 'bg-emerald-500' : (col.id === 'LOST' ? 'bg-rose-500' : 'bg-brand-500')}`}></div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{col.title}</h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colLeads.map(lead => (
                  <div 
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="glass-card p-4 cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 group relative"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {lead.customer_name}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <Sparkles size={12} className="text-amber-500" />
                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">{lead.score} pts</span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {lead.customer_phone && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone size={12} className="text-emerald-500 shrink-0" />
                          <span>{lead.customer_phone}</span>
                        </div>
                      )}
                      {lead.customer_email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-blue-500 shrink-0" />
                          <span>{lead.customer_email}</span>
                        </div>
                      )}
                    </div>

                    {/* Value and Next stage button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                        ${lead.estimated_value} USD
                      </span>

                      {/* Move Stage Selector */}
                      <select 
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                      >
                        {COLUMNS.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-600 text-xs">
                    Sin leads en esta etapa
                  </div>
                )}
              </div>

              {/* Column Footer */}
              <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-400 flex justify-between font-mono">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">${colTotal.toLocaleString()}</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal: Add Lead */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-brand-600 dark:text-brand-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Nuevo Prospecto</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Laura Ramírez" 
                  className="input-field"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Teléfono</label>
                  <input 
                    type="text" 
                    placeholder="+51 999 888 777" 
                    className="input-field"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    placeholder="laura@correo.com" 
                    className="input-field"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Estimado (USD)</label>
                <input 
                  type="number" 
                  className="input-field font-mono"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notas / Requerimiento</label>
                <textarea 
                  placeholder="Detalles sobre lo que busca el cliente..." 
                  className="input-field min-h-[80px] resize-none"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lead Detail */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 animate-slide-up space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">FICHA DE PROSPECTO</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{selectedLead.customer_name}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block mb-1">Canal de Origen</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLead.customer_source || 'WHATSAPP'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block mb-1">Lead Score IA</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">{selectedLead.score} / 100</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block mb-1">Teléfono WhatsApp</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLead.customer_phone || 'No registrado'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block mb-1">Valor Estimado</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">${selectedLead.estimated_value} USD</span>
              </div>
            </div>

            {selectedLead.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Notas de Triage</span>
                <p className="text-xs text-slate-700 dark:text-slate-300">{selectedLead.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Estado Actual:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedLead.status}</span>
              </div>
              <button onClick={() => setSelectedLead(null)} className="btn-secondary text-xs py-2">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
