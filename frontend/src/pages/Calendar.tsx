import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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

  return (
    <div className="flex flex-col h-full space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendario de Publicaciones</h2>
        <button className="btn-primary">
          <Plus size={20} />
          Programar Post
        </button>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden">
        {/* Header del Calendario */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {monthNames[month]} {year}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          {dayNames.map(day => (
            <div key={day} className="p-4 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 dark:bg-slate-700 gap-px border-b border-slate-200 dark:border-slate-700">
          {/* Celdas vacías */}
          {blanks.map(blank => (
            <div key={`blank-${blank}`} className="bg-white dark:bg-slate-800 p-2 min-h-[120px] opacity-50"></div>
          ))}
          
          {/* Días reales */}
          {days.map(day => {
            const isToday = 
              day === new Date().getDate() && 
              month === new Date().getMonth() && 
              year === new Date().getFullYear();

            return (
              <div key={day} className={`bg-white dark:bg-slate-800 p-2 min-h-[120px] transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col group cursor-pointer relative`}>
                <div className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}`}>
                  {day}
                </div>
                {/* Espacio para futuros "badges" de posts */}
                <div className="flex-1 space-y-1">
                  {/* Ejemplo visual (MVP) */}
                  {day === 15 && (
                    <div className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 truncate font-medium border border-blue-200 dark:border-blue-800">
                      Lanzamiento
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
