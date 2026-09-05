import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', { name, email, password });
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar usuario. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="text-xl font-bold mb-1.5 text-white">¡Registro Exitoso!</h2>
        <p className="text-text-secondary text-sm">Tu cuenta ha sido creada. Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">Crea tu cuenta</h2>
      <p className="text-text-secondary text-sm mb-6">Comienza a probar Smart Publish gratis por 14 días.</p>

      {error && (
        <div className="bg-danger/10 text-danger p-3.5 rounded-lg flex items-start gap-2.5 mb-6 border border-danger/20 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nombre Completo</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field pl-9" 
              placeholder="Juan Pérez" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Correo Electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field pl-9" 
              placeholder="tu@correo.com" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field pl-9" 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Crear Cuenta'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-text-secondary">
        ¿Ya tienes una cuenta? <Link to="/login" className="text-accent font-semibold hover:underline">Inicia sesión</Link>
      </p>
    </div>
  );
};
