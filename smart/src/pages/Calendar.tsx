import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter, MoreHorizontal, MessageSquare, Heart, Share2, Clock, X } from 'lucide-react';
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

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
    <div className="flex flex-col h-full space-y-6 max-w-[1600px] mx-auto pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-white mb-1">Calendario de Contenidos</h1>
          <p className="text-sm text-text-secondary">Organiza y visualiza todas tus publicaciones del mes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-surface hover:bg-surface-raised border border-borderc text-text-secondary hover:text-white px-3.5 py-2 rounded-lg text-sm transition-colors">
            <Filter size={16} /> Filtrar
          </button>
          <Link to="/compose" className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Plus size={16} /> Programar Post
          </Link>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-[600px]">
        {/* Main Calendar View */}
        <div className="bg-surface border border-borderc rounded-xl flex-1 flex flex-col overflow-hidden">
          {/* Header del Calendario */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-borderc bg-surface">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/15 text-accent rounded-lg">
                <CalendarIcon size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white capitalize">
                {monthNames[month]} {year}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={prevMonth}
                className="p-2 text-text-secondary hover:text-white hover:bg-surface-raised rounded-lg transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDay(new Date().getDate());
                }}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-white hover:bg-surface-raised rounded-md transition-colors"
              >
                Hoy
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 text-text-secondary hover:text-white hover:bg-surface-raised rounded-lg transition-colors"
                title="Siguiente mes"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-borderc bg-surface-raised">
            {dayNames.map(day => (
              <div key={day} className="py-2.5 px-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Cuadrícula de días */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-borderc gap-[1px] overflow-y-auto">
            {/* Celdas vacías */}
            {blanks.map(blank => (
              <div key={`blank-${blank}`} className="bg-surface/50 p-2 min-h-[90px] sm:min-h-[110px] opacity-25"></div>
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
                  className={`bg-surface p-2 min-h-[90px] sm:min-h-[110px] transition-colors flex flex-col group cursor-pointer relative
                    ${isSelected ? 'ring-1 ring-inset ring-accent bg-surface-raised' : 'hover:bg-surface-raised'}
                  `}
                >
                  <div className={`text-xs font-mono font-medium w-6 h-6 flex items-center justify-center rounded-md mb-1.5 transition-colors
                    ${isToday ? 'bg-accent text-white font-bold' : 
                      isSelected ? 'bg-surface-raised text-white font-bold' : 
                      'text-text-secondary group-hover:text-white'}
                  `}>
                    {day}
                  </div>
                  
                  {/* Badges de Posts */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {posts.slice(0, 2).map((post) => (
                      <div 
                        key={post.id}
                        className={`text-[11px] px-2 py-1 rounded truncate font-medium flex items-center gap-1.5 transition-colors
                          ${post.type === 'facebook' 
                            ? 'bg-accent/15 text-accent' 
                            : 'bg-purple/15 text-purple'}
                        `}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                        <span className="hidden sm:inline truncate">{post.text}</span>
                        <span className="sm:hidden font-mono">{post.time}</span>
                      </div>
                    ))}
                    {posts.length > 2 && (
                      <div className="text-[10px] font-mono text-text-secondary pl-1">
                        +{posts.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral de Detalles */}
        {selectedDay && (
          <div className="w-full xl:w-80 bg-surface border border-borderc rounded-xl flex flex-col overflow-hidden shrink-0 animate-fade-in">
            <div className="p-4 border-b border-borderc bg-surface-raised flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CalendarIcon className="text-accent" size={16} />
                  {selectedDay} de {monthNames[month]}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {getMockPosts(selectedDay).length} publicación(es)
                </p>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="p-1.5 hover:bg-surface rounded-md transition-colors text-text-secondary hover:text-white"
                title="Cerrar panel"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {getMockPosts(selectedDay).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary py-12 space-y-3">
                  <CalendarIcon size={24} className="opacity-40" />
                  <p className="text-center text-xs">No hay publicaciones para este día.</p>
                  <Link to="/compose" className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                    Programar publicación
                  </Link>
                </div>
              ) : (
                getMockPosts(selectedDay).map(post => (
                  <div key={post.id} className="bg-surface-raised rounded-lg border border-borderc p-3 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                          post.type === 'facebook' ? 'bg-accent/15 text-accent' : 'bg-purple/15 text-purple'
                        }`}>
                          <Share2 size={12} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white capitalize">{post.type}</p>
                          <p className="text-[10px] text-text-secondary font-mono flex items-center gap-1">
                            <Clock size={10} /> {post.time}
                          </p>
                        </div>
                      </div>
                      <button className="text-text-secondary hover:text-white">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    
                    <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                      {post.text}
                    </p>
                    
                    <div className="flex items-center gap-3 pt-2 border-t border-borderc text-[11px] text-text-secondary font-mono">
                      <span className="flex items-center gap-1"><Heart size={12} /> 0</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> 0</span>
                      <span className="flex items-center gap-1"><Share2 size={12} /> 0</span>
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
