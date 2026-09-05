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
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-raised text-accent mb-3">
          <Mail size={24} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Recuperar Contraseña</h1>
        <p className="text-text-secondary text-sm">Te enviaremos un enlace seguro para crear una nueva contraseña.</p>
      </div>

      {success ? (
        <div className="text-center py-4">
          <div className="flex justify-center mb-3 text-success">
            <CheckCircle size={36} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">¡Correo Enviado!</h3>
          <p className="text-text-secondary text-sm mb-6">Si existe una cuenta asociada a {email}, recibirás un enlace de recuperación pronto.</p>
          <Link to="/login" className="text-accent text-sm font-medium hover:underline inline-flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Volver al Inicio de Sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-danger/10 text-danger border border-danger/20 text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-9"
                placeholder="tu@correo.com"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !email}
            className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar Enlace'}
          </button>
          
          <div className="text-center pt-2">
            <Link to="/login" className="text-sm text-text-secondary hover:text-white font-medium transition-colors inline-flex items-center justify-center gap-1.5">
              <ArrowLeft size={16} /> Volver a Iniciar Sesión
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
