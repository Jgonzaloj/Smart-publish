import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-canvas text-white">
      
      {/* Columna Izquierda: Formulario (Auth) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-canvas">
        <div className="w-full max-w-md bg-surface border border-borderc p-8 sm:p-10 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm shadow-md shadow-accent/20">
              SP
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
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
