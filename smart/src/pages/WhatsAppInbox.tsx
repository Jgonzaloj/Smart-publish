import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Bot, UserCheck, 
  Search, FileText, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  id: string;
  sender: 'USER' | 'BOT' | 'CUSTOMER';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  channel: string;
  status: 'AI_HANDLED' | 'HUMAN_NEEDED' | 'RESOLVED';
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: Message[];
}

export function WhatsAppInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'AI' | 'HUMAN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/api/conversations');
        if (res.data && res.data.conversations) {
          setConversations(res.data.conversations);
          if (res.data.conversations.length > 0) {
            setActiveId(res.data.conversations[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading conversations', err);
      }
    };
    fetchConversations();
  }, []);

  const activeConv = conversations.find(c => c.id === activeId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeId) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'USER',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeId) {
        return {
          ...c,
          last_message: inputText,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    setInputText('');

    try {
      await api.post(`/api/conversations/${activeId}/messages`, { text: inputText });
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const toggleAiMode = async (convId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'AI_HANDLED' ? 'HUMAN_NEEDED' : 'AI_HANDLED';
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: nextStatus as any } : c));
    try {
      await api.patch(`/api/conversations/${convId}/ai-status`, { status: nextStatus });
    } catch (e) {}
  };

  const handleQuickQuote = () => {
    setInputText('Hola, te comparto nuestra cotización formal basada en el catálogo oficial: Plan Redes Pro por 250 USD/mes. ¿Deseas coordinar el inicio?');
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.customer_phone.includes(searchQuery);
    if (!matchesSearch) return false;
    if (filterMode === 'AI') return c.status === 'AI_HANDLED';
    if (filterMode === 'HUMAN') return c.status === 'HUMAN_NEEDED';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">WhatsApp & Omnichannel Inbox</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              SKILL-09 / SKILL-10
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervisión en tiempo real de chats atendidos por IA con opción de toma de control humano inmediato.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Meta Cloud API Conectada</span>
          </div>
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="glass-panel overflow-hidden border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* Left Column: Conversations List (5 cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
          
          {/* Search & Filter */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar conversación..."
                className="input-field pl-9 text-xs py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl text-xs font-medium">
              <button 
                onClick={() => setFilterMode('ALL')}
                className={`py-1 rounded-lg transition-all ${filterMode === 'ALL' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-bold' : 'text-slate-500'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilterMode('AI')}
                className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === 'AI' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300 font-bold' : 'text-slate-500'}`}
              >
                <Bot size={12} /> IA ({conversations.filter(c => c.status === 'AI_HANDLED').length})
              </button>
              <button 
                onClick={() => setFilterMode('HUMAN')}
                className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === 'HUMAN' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-300 font-bold' : 'text-slate-500'}`}
              >
                <AlertCircle size={12} /> Humano ({conversations.filter(c => c.status === 'HUMAN_NEEDED').length})
              </button>
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredConversations.map(conv => {
              const isSelected = conv.id === activeId;
              const isAi = conv.status === 'AI_HANDLED';

              return (
                <div 
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 select-none ${
                    isSelected 
                      ? 'bg-white dark:bg-slate-800/90 shadow-sm border-l-4 border-brand-600' 
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                    {conv.customer_name[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {conv.customer_name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1.5">
                      {conv.last_message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isAi 
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' 
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {isAi ? <Bot size={11} /> : <UserCheck size={11} />}
                        {isAi ? 'IA Bot Activo' : 'Requiere Humano'}
                      </span>

                      {conv.unread_count > 0 && (
                        <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Chat Active View (8 cols) */}
        {activeConv ? (
          <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900 h-full">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shadow-sm">
                  {activeConv.customer_name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {activeConv.customer_name}
                    <span className="px-2 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                      {activeConv.customer_phone}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>WhatsApp Cloud API</span>
                  </div>
                </div>
              </div>

              {/* Bot / Human Controller Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAiMode(activeConv.id, activeConv.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border shadow-sm ${
                    activeConv.status === 'AI_HANDLED'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                      : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                  }`}
                >
                  {activeConv.status === 'AI_HANDLED' ? <Bot size={14} /> : <UserCheck size={14} />}
                  {activeConv.status === 'AI_HANDLED' ? 'Modo: IA Respondiendo' : 'Modo: Toma Humana'}
                </button>
              </div>
            </div>

            {/* Messages Flow Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20 dark:bg-slate-950/20">
              {activeConv.messages.map((msg) => {
                const isCustomer = msg.sender === 'CUSTOMER';
                const isBot = msg.sender === 'BOT';

                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 px-1">
                      {isBot && <span className="text-indigo-600 dark:text-indigo-400 font-bold">Smart IA Bot</span>}
                      {msg.sender === 'USER' && <span className="font-semibold text-slate-600 dark:text-slate-300">Tú (Operador)</span>}
                      <span>• {msg.time}</span>
                    </div>

                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-sm ${
                      isCustomer 
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/80' 
                        : (isBot 
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-glow-accent' 
                            : 'bg-brand-600 text-white rounded-tr-none')
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions Toolbar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-slate-400 text-[11px] shrink-0">Acciones rápidas:</span>
              <button 
                onClick={handleQuickQuote}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-500 transition-colors flex items-center gap-1 shrink-0"
              >
                <FileText size={12} className="text-amber-500" /> Enviar Cotización Oficial
              </button>
              <button 
                onClick={() => setInputText('¡Muchas gracias por contactarnos! Un asesor te llamará en breve.')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-500 transition-colors shrink-0"
              >
                Plantilla: Despedida cordial
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
              <input 
                type="text" 
                placeholder="Escribe una respuesta para enviar a WhatsApp..." 
                className="input-field text-xs sm:text-sm py-2.5"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="btn-primary shrink-0 px-4 py-2.5"
              >
                <Send size={16} />
              </button>
            </form>

          </div>
        ) : (
          <div className="lg:col-span-8 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare size={40} className="mb-2 opacity-40" />
            <p className="font-semibold text-sm">Selecciona una conversación para interactuar</p>
          </div>
        )}

      </div>

    </div>
  );
}
