import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const FacebookCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando conexión con Facebook...');
  const calledRef = React.useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('La conexión fue cancelada o rechazada.');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Código de autorización no encontrado.');
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    // Intercambiar el código con nuestro backend
    api.get(`/social/facebook/callback?code=${code}`)
      .then(response => {
        if (response.data.success) {
          setStatus('success');
          setMessage('¡Conectado exitosamente!');
          setTimeout(() => navigate('/settings'), 3000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Error desconocido.');
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage('Error al comunicarse con el servidor.');
        console.error(err);
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="glass-panel p-8 text-center flex flex-col items-center gap-4 max-w-md w-full">
        {status === 'loading' && <Loader2 className="animate-spin text-brand-500" size={48} />}
        {status === 'success' && <CheckCircle2 className="text-emerald-500" size={48} />}
        {status === 'error' && <XCircle className="text-red-500" size={48} />}
        
        <h2 className="text-xl font-bold">{message}</h2>
        
        {status === 'success' && (
          <p className="text-slate-500 dark:text-slate-400">Redirigiendo a configuración...</p>
        )}
        
        {status === 'error' && (
          <button 
            className="btn-primary mt-4 w-full"
            onClick={() => navigate('/settings')}
          >
            Volver a Configuración
          </button>
        )}
      </div>
    </div>
  );
};
