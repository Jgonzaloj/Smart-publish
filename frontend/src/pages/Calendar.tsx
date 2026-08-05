import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter, MoreHorizontal, MessageSquare, Heart, Share2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 0 (Domingo) a 6 (Sábado)

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Array para renderizar celdas vacías al principio
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  // Array para los días del mes
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Mocks de Posts (MVP Demo)
  const getMockPosts = (day: number) => {
    const posts = [];
    if (day === 5) posts.push({ id: 1, type: 'facebook', time: '10:00 AM', text: '¡Feliz Lunes a todos!' });
    if (day === 12) posts.push({ id: 2, type: 'instagram', time: '02:30 PM', text: 'Detrás de escenas en la oficina.' });
    if (day === 15) {
      posts.push({ id: 3, type: 'facebook', time: '09:00 AM', text: 'Lanzamiento de producto.' });
      posts.push({ id: 4, type: 'instagram', time: '05:00 PM', text: 'Sorteo exclusivo en historias.' });
    }
    if (day === 22) posts.push({ id: 5, type: 'facebook', time: '11:15 AM', text: 'Promoción de fin de mes.' });
    return posts;
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendario de Contenidos</h2>
          <p className="text-slate-500 mt-1">Organiza y visualiza todas tus publicaciones del mes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary hidden sm:flex">
            <Filter size={18} /> Filtrar
          </button>
          <Link to="/composer" className="btn-primary">
            <Plus size={20} />
            Programar Post
          </Link>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Main Calendar View */}
        <div className="glass-panel flex-1 flex flex-col overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
          {/* Header del Calendario */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 rounded-xl">
                <CalendarIcon size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 capitalize">
                {monthNames[month]} {year}
              </h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={prevMonth}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDay(new Date().getDate());
                }}
                className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
              >
                Hoy
              </button>
              <button 
                onClick={nextMonth}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
            {dayNames.map(day => (
              <div key={day} className="py-4 px-2 text-center text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">
                {day}
              </div>
            ))}
          </div>

          {/* Cuadrícula de días */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 dark:bg-slate-700 gap-[1px] overflow-y-auto">
            {/* Celdas vacías */}
            {blanks.map(blank => (
              <div key={`blank-${blank}`} className="bg-slate-50 dark:bg-slate-800/50 p-2 min-h-[100px] sm:min-h-[120px] opacity-40"></div>
            ))}
            
            {/* Días reales */}
            {days.map(day => {
              const isToday = 
                day === new Date().getDate() && 
                month === new Date().getMonth() && 
                year === new Date().getFullYear();
                
              const isSelected = selectedDay === day;
              const posts = getMockPosts(day);

              return (
                <div 
                  key={day} 
                  onClick={() => setSelectedDay(day)}
                  className={`bg-white dark:bg-slate-900 p-2 min-h-[100px] sm:min-h-[120px] transition-all flex flex-col group cursor-pointer relative
                    ${isSelected ? 'ring-2 ring-inset ring-brand-500 z-10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'}
                  `}
                >
                  <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-1 transition-colors
                    ${isToday ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' : 
                      isSelected ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 
                      'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}
                  `}>
                    {day}
                  </div>
                  
                  {/* Badges de Posts */}
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    {posts.slice(0, 2).map((post) => (
                      <div 
                        key={post.id}
                        className={`text-xs px-2 py-1.5 rounded-md truncate font-medium flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]
                          ${post.type === 'facebook' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50' 
                            : 'bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800/50'}
                        `}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                        <span className="hidden sm:inline">{post.text}</span>
                        <span className="sm:hidden">{post.time}</span>
                      </div>
                    ))}
                    {posts.length > 2 && (
                      <div className="text-[10px] font-bold text-slate-400 pl-2">
                        + {posts.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral de Detalles (Se muestra al hacer clic en un día) */}
        {selectedDay && (
          <div className="w-full xl:w-96 glass-panel flex flex-col overflow-hidden animate-in slide-in-from-right-8 shrink-0">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="text-brand-500" size={20} />
                  {selectedDay} de {monthNames[month]}
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  {getMockPosts(selectedDay).length} publicación(es) programada(s)
                </p>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {getMockPosts(selectedDay).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <CalendarIcon size={24} className="opacity-50" />
                  </div>
                  <p className="text-center text-sm">No hay publicaciones para este día.</p>
                  <Link to="/composer" className="btn-secondary text-sm">Programar algo</Link>
                </div>
              ) : (
                getMockPosts(selectedDay).map(post => (
                  <div key={post.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {post.type === 'facebook' ? (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                            <Share2 size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 flex items-center justify-center">
                            <Share2 size={16} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold capitalize">{post.type}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={12} /> {post.time}
                          </p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">
                      {post.text}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Heart size={14} /> 0
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <MessageSquare size={14} /> 0
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Share2 size={14} /> 0
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
