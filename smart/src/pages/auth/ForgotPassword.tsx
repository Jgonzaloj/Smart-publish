import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError('');
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError('Hubo un error al intentar enviar el correo. Por favor intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-500 mb-6 relative">
          <Mail size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Recuperar Contraseña</h1>
        <p className="text-slate-500 dark:text-slate-400">Te enviaremos un enlace seguro para que puedas crear una nueva contraseña.</p>
      </div>

      <div className="glass-panel rounded-2xl p-8 border border-white/40 dark:border-slate-700/50 shadow-xl shadow-brand-500/5">
        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-4 text-emerald-500">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">¡Correo Enviado!</h3>
            <p className="text-slate-500 mb-6">Si existe una cuenta asociada a {email}, recibirás un enlace de recuperación pronto.</p>
            <Link to="/login" className="text-brand-500 font-medium hover:text-brand-600 transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Volver al Inicio de Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-500 border border-red-100 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none text-slate-800 dark:text-white"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !email}
              className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-lg shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : 'Enviar Enlace'}
            </button>
            
            <div className="text-center pt-2">
              <Link to="/login" className="text-sm text-slate-500 hover:text-brand-500 font-medium transition-colors flex items-center justify-center gap-1">
                <ArrowLeft size={16} /> Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
