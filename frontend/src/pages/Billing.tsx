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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Suscripción y Límites</h1>
          <p className="text-slate-500 mt-2">Gestiona tu plan y revisa tus consumos de este mes.</p>
        </div>
        <button 
          onClick={handleManageBilling}
          disabled={loading === 'portal'}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors font-medium flex items-center gap-2"
        >
          {loading === 'portal' ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
          Gestionar Facturación
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Plan Gratis */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-xl shadow-slate-200/20 dark:shadow-none border border-slate-200 dark:border-slate-700">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Básico</h3>
            <p className="text-slate-500 text-sm h-10">Para probar la plataforma y descubrir su magia.</p>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900 dark:text-white">
              $0
              <span className="ml-1 text-xl font-medium text-slate-500">/mes</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Check size={20} className="text-emerald-500 flex-shrink-0" />
              <span>Hasta 50 posts mensuales</span>
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Check size={20} className="text-emerald-500 flex-shrink-0" />
              <span>30 generaciones con IA</span>
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Check size={20} className="text-emerald-500 flex-shrink-0" />
              <span>1 cuenta social por red</span>
            </li>
          </ul>
          <button disabled className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold">
            Plan Actual
          </button>
        </div>

        {/* Plan Pro */}
        <div className="bg-gradient-to-b from-brand-600 to-brand-700 rounded-2xl p-6 shadow-xl shadow-brand-500/30 border border-brand-500 relative transform md:-translate-y-4">
          <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <Sparkles size={14} /> RECOMENDADO
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-brand-100 text-sm h-10">Para profesionales y pequeños negocios que buscan crecer.</p>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-white">
              $49
              <span className="ml-1 text-xl font-medium text-brand-200">/mes</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-white">
              <Check size={20} className="text-brand-300 flex-shrink-0" />
              <span>Hasta 1,000 posts mensuales</span>
            </li>
            <li className="flex items-center gap-3 text-white">
              <Check size={20} className="text-brand-300 flex-shrink-0" />
              <span>500 generaciones con IA</span>
            </li>
            <li className="flex items-center gap-3 text-white">
              <Check size={20} className="text-brand-300 flex-shrink-0" />
              <span>10 cuentas por red social</span>
            </li>
          </ul>
          <button 
            onClick={() => handleSubscribe('price_XXXXXXXXXXXX_pro')} // Reemplazar con ID de Stripe real
            disabled={loading === 'price_XXXXXXXXXXXX_pro'}
            className="w-full py-3 rounded-xl bg-white text-brand-600 font-bold hover:bg-slate-50 transition-colors shadow-lg flex justify-center items-center gap-2"
          >
            {loading === 'price_XXXXXXXXXXXX_pro' ? <Loader2 size={20} className="animate-spin" /> : 'Mejorar a Pro'}
          </button>
        </div>

        {/* Plan Agencia */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-xl shadow-slate-200/20 dark:shadow-none border border-slate-200 dark:border-slate-700">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Agencia</h3>
            <p className="text-slate-500 text-sm h-10">Escala tus operaciones con múltiples clientes y equipo.</p>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900 dark:text-white">
              $199
              <span className="ml-1 text-xl font-medium text-slate-500">/mes</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Check size={20} className="text-emerald-500 flex-shrink-0" />
              <span>Hasta 10,000 posts mensuales</span>
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Check size={20} className="text-emerald-500 flex-shrink-0" />
              <span>5,000 generaciones con IA</span>
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Check size={20} className="text-emerald-500 flex-shrink-0" />
              <span>Cuentas ilimitadas</span>
            </li>
          </ul>
          <button 
            onClick={() => handleSubscribe('price_XXXXXXXXXXXX_agency')} // Reemplazar con ID de Stripe real
            disabled={loading === 'price_XXXXXXXXXXXX_agency'}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-bold transition-colors shadow-lg flex justify-center items-center gap-2"
          >
             {loading === 'price_XXXXXXXXXXXX_agency' ? <Loader2 size={20} className="animate-spin" /> : 'Contactar Ventas'}
          </button>
        </div>
      </div>

    </div>
  );
};
