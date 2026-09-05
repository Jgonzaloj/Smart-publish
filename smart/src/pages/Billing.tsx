import { useState } from 'react';
import { Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

export const Billing = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(priceId);
      const res = await api.post('/billing/create-checkout-session', { priceId });
      
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Error al suscribirse:', error);
      alert('Hubo un error al conectar con el servidor de pagos.');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoading('portal');
      const res = await api.post('/billing/create-portal-session');
      
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Error al abrir portal:', error);
      alert('Hubo un error al abrir el portal de facturación.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium text-white mb-1">Suscripción y Planes</h1>
          <p className="text-sm text-text-secondary">Elige el plan adecuado según la escala de tus publicaciones y marcas.</p>
        </div>
        <button 
          onClick={handleManageBilling}
          disabled={loading === 'portal'}
          className="bg-surface hover:bg-surface-raised border border-borderc text-text-secondary hover:text-white px-3.5 py-2 rounded-lg text-sm transition-colors font-medium flex items-center gap-2"
        >
          {loading === 'portal' ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          Portal de Facturación
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {/* Plan Gratis */}
        <div className="bg-surface rounded-xl p-6 border border-borderc flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white mb-1">Básico</h3>
              <p className="text-text-secondary text-xs h-8">Ideal para probar la plataforma y descubrir la automatización.</p>
              <div className="mt-3 flex items-baseline font-mono text-3xl font-medium text-white">
                $0
                <span className="ml-1 text-xs font-normal text-text-secondary">/mes</span>
              </div>
            </div>
            <ul className="space-y-2.5 my-6 text-xs text-text-secondary">
              <li className="flex items-center gap-2.5">
                <Check size={16} className="text-success shrink-0" />
                <span>Hasta 50 publicaciones al mes</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={16} className="text-success shrink-0" />
                <span>30 generaciones con IA</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={16} className="text-success shrink-0" />
                <span>1 cuenta social conectada</span>
              </li>
            </ul>
          </div>
          <button disabled className="w-full py-2.5 rounded-lg bg-surface-raised border border-borderc text-text-secondary text-xs font-medium cursor-default">
            Plan Actual
          </button>
        </div>

        {/* Plan Pro */}
        <div className="bg-surface rounded-xl p-6 border border-accent/60 flex flex-col justify-between relative shadow-lg shadow-accent/5">
          <div className="absolute top-0 right-5 -translate-y-1/2 bg-accent text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide flex items-center gap-1">
            <Sparkles size={11} /> RECOMENDADO
          </div>
          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white mb-1">Profesional</h3>
              <p className="text-text-secondary text-xs h-8">Para agencias y negocios en crecimiento continuo.</p>
              <div className="mt-3 flex items-baseline font-mono text-3xl font-medium text-white">
                $49
                <span className="ml-1 text-xs font-normal text-text-secondary">/mes</span>
              </div>
            </div>
            <ul className="space-y-2.5 my-6 text-xs text-text-secondary">
              <li className="flex items-center gap-2.5 text-white">
                <Check size={16} className="text-accent shrink-0" />
                <span>Hasta 1,000 publicaciones al mes</span>
              </li>
              <li className="flex items-center gap-2.5 text-white">
                <Check size={16} className="text-accent shrink-0" />
                <span>500 generaciones con IA y Piloto</span>
              </li>
              <li className="flex items-center gap-2.5 text-white">
                <Check size={16} className="text-accent shrink-0" />
                <span>10 cuentas sociales por red</span>
              </li>
              <li className="flex items-center gap-2.5 text-white">
                <Check size={16} className="text-accent shrink-0" />
                <span>Soporte prioritario 24/7</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => handleSubscribe('price_pro_monthly')}
            disabled={loading === 'price_pro_monthly'}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors flex justify-center items-center gap-2 shadow-sm"
          >
            {loading === 'price_pro_monthly' ? <Loader2 size={16} className="animate-spin" /> : 'Mejorar a Plan Pro'}
          </button>
        </div>

        {/* Plan Agencia */}
        <div className="bg-surface rounded-xl p-6 border border-borderc flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white mb-1">Agencia / Enterprise</h3>
              <p className="text-text-secondary text-xs h-8">Control total para equipos y agencias a gran escala.</p>
              <div className="mt-3 flex items-baseline font-mono text-3xl font-medium text-white">
                $199
                <span className="ml-1 text-xs font-normal text-text-secondary">/mes</span>
              </div>
            </div>
            <ul className="space-y-2.5 my-6 text-xs text-text-secondary">
              <li className="flex items-center gap-2.5">
                <Check size={16} className="text-success shrink-0" />
                <span>Hasta 10,000 publicaciones al mes</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={16} className="text-success shrink-0" />
                <span>Generaciones ilimitadas con IA</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={16} className="text-success shrink-0" />
                <span>Cuentas y marcas ilimitadas</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={16} className="text-success shrink-0" />
                <span>Módulo de roles y permisos multi-usuario</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => handleSubscribe('price_agency_monthly')}
            disabled={loading === 'price_agency_monthly'}
            className="w-full py-2.5 rounded-lg bg-surface-raised hover:bg-borderc border border-borderc text-white text-xs font-medium transition-colors flex justify-center items-center gap-2"
          >
             {loading === 'price_agency_monthly' ? <Loader2 size={16} className="animate-spin" /> : 'Contratar Plan Agencia'}
          </button>
        </div>
      </div>
    </div>
  );
};
