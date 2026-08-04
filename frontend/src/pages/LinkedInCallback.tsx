import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

export const LinkedInCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      api.post(`/social/linkedin/callback?code=${code}`)
        .then(() => {
          navigate('/settings');
        })
        .catch(err => {
          console.error(err);
          navigate('/settings');
        });
    } else {
      navigate('/settings');
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <h2 className="text-xl font-bold">Conectando con LinkedIn...</h2>
      <p className="text-slate-500">Por favor espera un momento</p>
    </div>
  );
};
