import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-900">
      
      {/* Columna Izquierda: Formulario (Auth) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 bg-white dark:bg-[#1e293b]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Sparkles size={24} />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-400">
              Smart Publish
            </span>
          </div>
          <Outlet />
        </div>
      </div>

      {/* Columna Derecha: Imagen/Decoración */}
      <div 
        className="hidden lg:flex w-1/2 text-white p-12 flex-col justify-between relative overflow-hidden"
        style={{ backgroundImage: 'url(/auth-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-slate-900/40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        
        <div className="relative z-10">
          {/* Espacio reservado para texto superior */}
        </div>

        <div className="relative z-10 max-w-lg mb-20">
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Gestiona tus redes sociales con Inteligencia Artificial.
          </h1>
          <p className="text-brand-100 text-lg">
            Únete a cientos de agencias y creadores que programan, generan y analizan su contenido en piloto automático.
          </p>
        </div>
        
        <div className="relative z-10 text-sm text-brand-200">
          © {new Date().getFullYear()} Smart Publish. Todos los derechos reservados.
        </div>
      </div>
      
    </div>
  );
};
