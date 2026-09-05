import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/auth/reset-password', { email, token, newPassword: password });
      alert('Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña. El enlace pudo haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="text-center p-8 text-slate-500">
        Enlace de recuperación inválido o incompleto.
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-raised text-accent mb-3">
          <Lock size={24} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Nueva Contraseña</h1>
        <p className="text-text-secondary text-sm">Ingresa tu nueva contraseña para {email}.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-lg bg-danger/10 text-danger border border-danger/20 text-sm font-medium">
            {error}
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nueva Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-9"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Confirmar Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field pl-9"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !password}
          className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Contraseña'}
        </button>
      </form>
    </div>
  );
};
