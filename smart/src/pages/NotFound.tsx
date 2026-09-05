import { Link } from 'react-router-dom';
import { Home, ShieldAlert } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-glow-accent">
        <ShieldAlert size={36} />
      </div>
      
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">404</h1>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Página No Encontrada</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          La ruta que intentas acceder no existe en el sistema o fue reubicada en la suite de Smart Publish AI.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Link to="/" className="btn-primary">
          <Home size={16} /> Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
