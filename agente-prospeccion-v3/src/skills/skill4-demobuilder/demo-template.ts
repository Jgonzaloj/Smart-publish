import { escapeHtml, escapeJsString } from '../../utils/html.utils.js';

export interface LeadDemoData {
  business_name: string;
  niche?: string;
  phone?: string;
  whatsapp?: string;
  rating?: number;
  reviews_count?: number;
  current_website_url?: string;
  proposed_solution?: string;
  opportunity_type?: string;
}

export function generateFullWebsiteDemoHtml(lead: LeadDemoData): string {
  const name = lead.business_name || 'Tu Negocio';
  const nameLower = name.toLowerCase();
  const nicheLower = (lead.niche || '').toLowerCase();
  const phone = lead.whatsapp || lead.phone || '+51 900 000 000';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const rating = lead.rating ? lead.rating.toFixed(1) : '4.9';
  const reviewsCount = lead.reviews_count || 128;
  const proposalSolution = lead.proposed_solution || 'Plataforma web de alta conversión diseñada para captar más clientes en piloto automático con velocidad instantánea y conexión a WhatsApp.';

  // Versiones escapadas contextualmente para prevenir vulnerabilidades XSS
  const nameHtml = escapeHtml(name);
  const nameJs = escapeJsString(name);
  const phoneHtml = escapeHtml(phone);
  const proposalSolutionHtml = escapeHtml(proposalSolution);

  // Detección inteligente de industria
  const isLaw = nameLower.includes('juríd') || nameLower.includes('jurid') || nameLower.includes('abog') || nameLower.includes('legal') || nameLower.includes('bufete') || nameLower.includes('lex') || nameLower.includes('ley') || nameLower.includes('notar') || (nicheLower.includes('legal') || nicheLower.includes('abogad') || nicheLower.includes('jurid'));
  const isArchitecture = nameLower.includes('arquitect') || nameLower.includes('interior') || nameLower.includes('diseño') || nameLower.includes('diseno') || nameLower.includes('construc') || nameLower.includes('vanguardia') || (nicheLower.includes('arquitect') || nicheLower.includes('diseño'));
  const isFinance = nameLower.includes('financ') || nameLower.includes('tributar') || nameLower.includes('contab') || nameLower.includes('consultor') || nameLower.includes('auditor') || nameLower.includes('éxito') || nameLower.includes('exito') || (nicheLower.includes('financ') || nicheLower.includes('tributar'));
  const isDental = nameLower.includes('dental') || nameLower.includes('dient') || nameLower.includes('odontol') || nameLower.includes('sonrisa');

  let theme = {
    category: 'Centro Médico & Salud',
    badge: 'Atención Médica & Odontológica de Excelencia',
    heroTitle: `Cuidado Médico de Confianza y Tecnología Avanzada en Lima`,
    heroSubtitle: `Atención personalizada, especialistas certificados y tecnología de última generación para tu bienestar y el de tu familia. Agenda tu cita en segundos.`,
    servicesTitle: 'Nuestras Especialidades y Servicios',
    servicesSubtitle: 'Contamos con un equipo multidisciplinario listo para brindarte la mejor atención médica.',
    ctaBooking: 'Agendar Cita Médica',
    clientLabel: 'Pacientes',
    avgTicket: 120,
    services: [
      { icon: '🩺', title: 'Consultas & Diagnóstico Integral', desc: 'Evaluación médica completa con especialistas dedicados y tecnología de diagnóstico rápido.', tag: 'Popular' },
      { icon: '🦷', title: 'Odontología & Estética Dental', desc: 'Diseño de sonrisa, blanqueamiento, ortodoncia invisible e implantes de alta precisión.', tag: 'Alta Demanda' },
      { icon: '🧪', title: 'Laboratorio & Análisis Clínicos', desc: 'Resultados precisos en tiempo récord con entrega digital directa a tu WhatsApp.', tag: 'Rápido' },
      { icon: '⚡', title: 'Atención Prioritaria & Emergencias', desc: 'Disponibilidad inmediata para urgencias con médicos especialistas de guardia.', tag: '24/7' }
    ],
    bookingOptions: ['Consulta Médica General', 'Odontología / Limpieza', 'Especialidad Pediátrica', 'Chequeo Preventivo', 'Otro Servicio'],
    testimonials: [
      { name: 'Dra. Patricia Morales', text: 'Excelente atención, el proceso de agendamiento fue inmediato y las instalaciones son impecables. 100% recomendados.', date: 'Hace 3 días' },
      { name: 'Ing. Carlos Mendoza', text: 'Gran puntualidad y trato profesional. Me atendieron a la hora exacta y el seguimiento por WhatsApp fue genial.', date: 'Hace 1 semana' },
      { name: 'Mariana Vega', text: 'La mejor experiencia médica que he tenido en Lima. Médicos muy atentos y comprensivos con toda mi familia.', date: 'Hace 2 semanas' }
    ]
  };

  if (isLaw) {
    theme = {
      category: 'Estudio Jurídico & Legal',
      badge: 'Defensa Legal Estratégica & Corporativa',
      heroTitle: `Defensa Jurídica de Alto Nivel y Asesoría Legal Integral`,
      heroSubtitle: `Protegemos tus intereses comerciales y patrimoniales con estrategias legales sólidas, experiencia comprobada y total confidencialidad en Lima.`,
      servicesTitle: 'Áreas de Práctica Jurídica',
      servicesSubtitle: 'Soluciones legales estratégicas a medida para empresas, directores y particulares.',
      ctaBooking: 'Solicitar Asesoría Legal',
      clientLabel: 'Clientes / Casos',
      avgTicket: 850,
      services: [
        { icon: '⚖️', title: 'Derecho Corporativo & Comercial', desc: 'Constitución de sociedades, contratos comerciales de alta cuantía, fusiones y blindaje patrimonial.', tag: 'Empresarial' },
        { icon: '🏛️', title: 'Litigios & Resolución de Conflictos', desc: 'Defensa judicial y arbitral de alta complejidad con enfoque en protección de activos.', tag: 'Estratégico' },
        { icon: '💼', title: 'Derecho Laboral & Tributario', desc: 'Auditoría laboral preventiva, defensa ante SUNAT y optimización impositiva legal.', tag: 'SUNAT' },
        { icon: '🏢', title: 'Derecho Inmobiliario & Notarial', desc: 'Saneamiento de propiedades, compraventas, contratos de arrendamiento y estudio de títulos.', tag: 'Inmobiliario' }
      ],
      bookingOptions: ['Asesoría Corporativa / Contratos', 'Consulta Tributaria / SUNAT', 'Litigio o Conflicto Legal', 'Derecho Inmobiliario', 'Consulta General'],
      testimonials: [
        { name: 'Dr. Roberto Zambrano', text: 'Resolvieron un conflicto contractual complejo en tiempo récord. El nivel de preparación del equipo es sobresaliente.', date: 'Hace 4 días' },
        { name: 'Lucía Fernández (Gerente)', text: 'Nuestro estudio de confianza para todos los asuntos comerciales y societarios. Totalmente recomendados.', date: 'Hace 2 semanas' },
        { name: 'Esteban Quispe', text: 'Excelente asesoramiento en derecho tributario, nos ahorraron contingencias graves con SUNAT. Muy profesionales.', date: 'Hace 1 mes' }
      ]
    };
  } else if (isArchitecture) {
    theme = {
      category: 'Estudio de Arquitectura & Interiorismo',
      badge: 'Diseño Exclusivo & Construcción de Vanguardia',
      heroTitle: `Transformamos Espacios en Obras Arquitectónicas Únicas`,
      heroSubtitle: `Diseño arquitectónico contemporáneo, interiorismo de lujo y gestión integral de obra desde el concepto hasta la entrega llave en mano.`,
      servicesTitle: 'Servicios de Arquitectura & Diseño',
      servicesSubtitle: 'Innovación espacial, estética refinada y máxima eficiencia constructiva.',
      ctaBooking: 'Cotizar Proyecto Arquitectónico',
      clientLabel: 'Proyectos',
      avgTicket: 2500,
      services: [
        { icon: '📐', title: 'Diseño Residencial & Comercial', desc: 'Planificación arquitectónica completa con estética moderna y funcionalidad optimizada.', tag: 'Exclusivo' },
        { icon: '🛋️', title: 'Interiorismo & Remodelaciones', desc: 'Selección de materiales de lujo, iluminación escénica y mobiliario personalizado.', tag: 'Diseño' },
        { icon: '🏗️', title: 'Gestión & Supervisión de Obra', desc: 'Control riguroso de plazos, presupuestos y acabados de máxima calidad constructiva.', tag: 'Llave en Mano' },
        { icon: '🖥️', title: 'Renders 3D & Recorridos Virtuales', desc: 'Visualización hiperrealista de tu proyecto antes de iniciar la construcción.', tag: '3D HD' }
      ],
      bookingOptions: ['Diseño de Casa / Departamento', 'Proyecto Comercial / Oficinas', 'Remodelación & Interiorismo', 'Supervisión de Obra', 'Cotización de Proyecto'],
      testimonials: [
        { name: 'Arq. Gabriela Soto', text: 'El diseño de nuestra casa de playa superó todas las expectativas. Gran manejo de la luz y los espacios.', date: 'Hace 5 días' },
        { name: 'Felipe Paredes', text: 'Remodelaron nuestras oficinas corporativas con un gusto exquisito y dentro del presupuesto pactado.', date: 'Hace 2 semanas' },
        { name: 'Claudia Navarro', text: 'Los renders y la ejecución final fueron idénticos. Cuidaron cada detalle con mucha dedicación.', date: 'Hace 3 semanas' }
      ]
    };
  } else if (isFinance) {
    theme = {
      category: 'Consultoría Financiera & Tributaria',
      badge: 'Estrategia Fiscal & Crecimiento Financiero',
      heroTitle: `Estrategia Tributaria y Control Financiero para Empresas`,
      heroSubtitle: `Optimizamos la carga tributaria de tu empresa, garantizamos cumplimiento ante SUNAT y mejoramos la rentabilidad de tu negocio en Lima.`,
      servicesTitle: 'Nuestros Servicios Financieros',
      servicesSubtitle: 'Soluciones contables, tributarias y de auditoría con rigor técnico.',
      ctaBooking: 'Solicitar Diagnóstico Financiero',
      clientLabel: 'Empresas',
      avgTicket: 1200,
      services: [
        { icon: '📊', title: 'Asesoría & Planeamiento Tributario', desc: 'Estructuración legal y fiscal para reducir riesgos impositivos y maximizar flujo de caja.', tag: 'Ahorro Fiscal' },
        { icon: '📑', title: 'Contabilidad Integral & Outsourcing', desc: 'Estados financieros al día, libros electrónicos y cumplimiento formal oportuno.', tag: 'Mensual' },
        { icon: '🔍', title: 'Auditoría Preventiva SUNAT', desc: 'Revisión exhaustiva para prevenir fiscalizaciones y multas inesperadas.', tag: 'Preventivo' },
        { icon: '💼', title: 'Finanzas Corporativas & Valorizaciones', desc: 'Diagnóstico de rentabilidad, flujo de caja proyectado y valorización de empresas.', tag: 'Estratégico' }
      ],
      bookingOptions: ['Planeamiento Tributario', 'Outsourcing Contable', 'Auditoría Preventiva SUNAT', 'Diagnóstico Financiero', 'Otro Requerimiento'],
      testimonials: [
        { name: 'Ing. Rodrigo Alarcón', text: 'Nos ayudaron a reestructurar los costos y recuperar saldos a favor con SUNAT de manera impecable.', date: 'Hace 6 días' },
        { name: 'Valeria Benavides', text: 'Tranquilidad total para nuestra empresa. Siempre al día con impuestos y reportes financieros claros.', date: 'Hace 2 semanas' },
        { name: 'Martín Córdova', text: 'Asesoría de primer nivel. Entienden perfectamente el ritmo de los negocios en Perú.', date: 'Hace 1 mes' }
      ]
    };
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${nameHtml} — Prototipo Web de Alto Rendimiento</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #060913;
      --bg-card: rgba(17, 24, 43, 0.85);
      --bg-card-hover: rgba(26, 36, 64, 0.95);
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
      --emerald-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --text-title: #ffffff;
      --text-body: #94a3b8;
      --text-light: #e2e8f0;
      --border-glass: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(59, 130, 246, 0.5);
      --glow-blue: 0 10px 30px -5px rgba(37, 99, 235, 0.4);
      --font-display: 'Outfit', sans-serif;
      --font-body: 'Plus Jakarta Sans', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background-color: var(--bg-main);
      background-image: 
        radial-gradient(at 15% 15%, rgba(37, 99, 235, 0.18) 0px, transparent 50%),
        radial-gradient(at 85% 75%, rgba(6, 182, 212, 0.15) 0px, transparent 50%),
        radial-gradient(at 50% 40%, rgba(139, 92, 246, 0.09) 0px, transparent 60%);
      color: var(--text-light);
      font-family: var(--font-body);
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* Top Sticky Sales Banner */
    .prototype-bar {
      background: linear-gradient(90deg, #1e1b4b, #312e81, #1e3a8a);
      border-bottom: 1px solid rgba(139, 92, 246, 0.3);
      color: #e0e7ff;
      padding: 0.85rem 1.5rem;
      font-size: 0.9rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    .badge-lead {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-right: 0.5rem;
    }
    .btn-activate {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 0.45rem 1.2rem;
      border-radius: 50px;
      font-weight: 800;
      text-decoration: none;
      font-size: 0.85rem;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-activate:hover {
      transform: scale(1.04);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
    }

    /* Navigation */
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.2rem 2.5rem;
      max-width: 1240px;
      margin: 0 auto;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    .nav-brand-logo {
      width: 44px;
      height: 44px;
      background: var(--primary-gradient);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 900;
      color: #fff;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
    }
    .nav-brand-text {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      max-width: 320px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav-links {
      display: flex;
      gap: 1.8rem;
      list-style: none;
      align-items: center;
    }
    .nav-links a {
      color: var(--text-body);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.92rem;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: #ffffff; }
    .nav-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--primary-gradient);
      color: #ffffff;
      padding: 0.65rem 1.4rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
      box-shadow: var(--glow-blue);
      transition: all 0.25s;
    }
    .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(37, 99, 235, 0.6); }

    /* Layout */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    /* Hero Section */
    .hero-section {
      padding: 4.5rem 0 3.5rem;
      text-align: center;
      position: relative;
    }
    .hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(37, 99, 235, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #93c5fd;
      padding: 0.4rem 1.2rem;
      border-radius: 50px;
      font-size: 0.88rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }
    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(2.3rem, 5vw, 3.8rem);
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -1px;
      color: var(--text-title);
      margin-bottom: 1.2rem;
      background: linear-gradient(180deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.2rem;
      color: var(--text-body);
      max-width: 760px;
      margin: 0 auto 2.5rem;
      line-height: 1.7;
    }
    .hero-buttons {
      display: flex;
      justify-content: center;
      gap: 1.2rem;
      flex-wrap: wrap;
      margin-bottom: 3.5rem;
    }
    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: var(--primary-gradient);
      color: #ffffff;
      padding: 1.05rem 2.4rem;
      border-radius: 50px;
      font-size: 1.1rem;
      font-weight: 800;
      text-decoration: none;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.5);
      transition: all 0.25s ease;
    }
    .btn-hero-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 18px 40px rgba(37, 99, 235, 0.7);
    }
    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-glass);
      color: #ffffff;
      padding: 1.05rem 2rem;
      border-radius: 50px;
      font-size: 1.05rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-hero-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Live Performance Cards */
    .metrics-ribbon {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.2rem;
      margin-bottom: 5rem;
    }
    .metric-box {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 1.5rem;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 1.2rem;
      transition: transform 0.25s, border-color 0.25s;
    }
    .metric-box:hover { transform: translateY(-4px); border-color: var(--border-focus); }
    .metric-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: rgba(59, 130, 246, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      flex-shrink: 0;
    }
    .metric-value {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.1;
    }
    .metric-label { font-size: 0.85rem; color: var(--text-body); margin-top: 0.2rem; }

    /* Interactive Revenue / Lost Clients Calculator */
    .calculator-section {
      background: linear-gradient(135deg, rgba(30, 41, 69, 0.95), rgba(15, 23, 42, 0.95));
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 32px;
      padding: 3.5rem 2.5rem;
      margin-bottom: 5.5rem;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
    }
    .calc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
    }
    @media (max-width: 860px) { .calc-grid { grid-template-columns: 1fr; gap: 2rem; } }
    .calc-slider {
      width: 100%;
      height: 8px;
      border-radius: 5px;
      background: #1e293b;
      outline: none;
      margin: 1.5rem 0;
      accent-color: var(--primary);
    }
    .calc-card-result {
      background: rgba(6, 9, 19, 0.75);
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 1.8rem;
      text-align: center;
    }
    .calc-big-loss {
      font-family: var(--font-display);
      font-size: 2.8rem;
      font-weight: 900;
      color: var(--accent-rose);
      line-height: 1.1;
      margin: 0.5rem 0;
    }
    .calc-gain-highlight {
      color: var(--accent-emerald);
      font-weight: 800;
      font-size: 1.15rem;
      margin-top: 0.8rem;
    }

    /* Section Headers */
    .section-header { text-align: center; margin-bottom: 3.5rem; }
    .section-tag {
      color: var(--accent-cyan);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      display: block;
    }
    .section-title {
      font-family: var(--font-display);
      font-size: 2.3rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .section-desc { color: var(--text-body); max-width: 600px; margin: 0.75rem auto 0; font-size: 1.05rem; }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
      gap: 1.8rem;
      margin-bottom: 5.5rem;
    }
    .service-card {
      background: var(--bg-card);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-glass);
      border-radius: 24px;
      padding: 2.2rem;
      position: relative;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .service-card:hover {
      transform: translateY(-8px);
      border-color: rgba(6, 182, 212, 0.4);
      background: var(--bg-card-hover);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
    }
    .service-badge {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #93c5fd;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .service-icon-box {
      font-size: 2.5rem;
      margin-bottom: 1.2rem;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 18px;
    }
    .service-card h3 {
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.8rem;
    }
    .service-card p { color: var(--text-body); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; }
    .service-card-btn {
      color: #38bdf8;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    /* Interactive Appointment Booking Form */
    .booking-section {
      background: linear-gradient(135deg, rgba(26, 34, 56, 0.9), rgba(15, 23, 42, 0.9));
      backdrop-filter: blur(14px);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 32px;
      padding: 3.5rem 2.5rem;
      margin-bottom: 5.5rem;
    }
    .booking-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
    }
    @media (max-width: 860px) { .booking-grid { grid-template-columns: 1fr; gap: 2rem; } }
    .form-group { margin-bottom: 1.2rem; }
    .form-label { display: block; font-weight: 600; font-size: 0.88rem; color: #cbd5e1; margin-bottom: 0.4rem; }
    .form-control {
      width: 100%;
      background: rgba(10, 15, 29, 0.8);
      border: 1px solid var(--border-glass);
      border-radius: 12px;
      padding: 0.85rem 1.1rem;
      color: #ffffff;
      font-family: inherit;
      font-size: 0.95rem;
      outline: none;
    }
    .form-control:focus { border-color: var(--primary); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    /* Comparison Section */
    .comparison-section {
      background: var(--bg-card);
      border: 1px solid var(--border-glass);
      border-radius: 28px;
      padding: 3rem 2.5rem;
      margin-bottom: 5.5rem;
    }
    .comp-table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
    .comp-table th, .comp-table td { padding: 1.2rem 1.5rem; text-align: left; border-bottom: 1px solid var(--border-glass); }
    .comp-table th { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; color: #ffffff; }
    .comp-table td { font-size: 0.95rem; color: var(--text-light); }
    .comp-badge-old { color: #f87171; font-weight: 600; }
    .comp-badge-new { color: #34d399; font-weight: 700; }

    /* CTA Closing Box (The Offer) */
    .offer-box {
      background: linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #064e3b 100%);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 32px;
      padding: 3.5rem 2.5rem;
      text-align: center;
      margin-bottom: 5rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .offer-box h2 {
      font-family: var(--font-display);
      font-size: 2.4rem;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 1rem;
    }
    .offer-box p {
      color: #cbd5e1;
      max-width: 700px;
      margin: 0 auto 2rem;
      font-size: 1.1rem;
    }
    .btn-offer {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: #10b981;
      color: #ffffff;
      padding: 1.1rem 2.6rem;
      border-radius: 50px;
      font-size: 1.15rem;
      font-weight: 800;
      text-decoration: none;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.5);
      transition: all 0.25s;
    }
    .btn-offer:hover {
      background: #059669;
      transform: scale(1.05);
      box-shadow: 0 15px 40px rgba(16, 185, 129, 0.7);
    }

    /* Footer */
    .footer {
      border-top: 1px solid var(--border-glass);
      padding: 4rem 0 2rem;
      background: rgba(4, 7, 15, 0.95);
    }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
    @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr; gap: 2rem; } }
    .footer-title { font-family: var(--font-display); font-weight: 700; color: #ffffff; margin-bottom: 1.2rem; }
    .footer-links { list-style: none; }
    .footer-links li { margin-bottom: 0.6rem; }
    .footer-links a { color: var(--text-body); text-decoration: none; font-size: 0.9rem; }

    /* Floating WhatsApp */
    .floating-whatsapp {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #25d366;
      color: #ffffff;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      box-shadow: 0 10px 25px rgba(37, 211, 102, 0.5);
      text-decoration: none;
      z-index: 999;
      transition: transform 0.25s;
    }
    .floating-whatsapp:hover { transform: scale(1.1); }
  </style>
</head>
<body>

  <!-- Top Sticky Notice Banner with Direct CTA -->
  <div class="prototype-bar">
    <div>
      <span class="badge-lead">✨ PROTOTIPO EXCLUSIVO</span>
      <span>Sitio Web de Alto Rendimiento para: <strong>${nameHtml}</strong></span>
    </div>
    <div>
      <a href="https://wa.me/${cleanPhone}?text=Hola,%20vi%20el%20prototipo%20web%20exclusivo%20para%20${encodeURIComponent(name)}%20y%20me%20gustaria%20activarlo" target="_blank" class="btn-activate">
        🚀 Activar Esta Web para mi Negocio
      </a>
    </div>
  </div>

  <!-- Navigation -->
  <header class="navbar">
    <a href="#" class="nav-brand">
      <div class="nav-brand-logo">${nameHtml.charAt(0)}</div>
      <div class="nav-brand-text">${nameHtml}</div>
    </a>
    <ul class="nav-links">
      <li><a href="#servicios">Servicios</a></li>
      <li><a href="#calculadora">Calculadora de Pérdidas</a></li>
      <li><a href="#ventajas">Por qué Cambiar</a></li>
      <li><a href="#reservas">Agendar Cita</a></li>
    </ul>
    <a href="https://wa.me/${cleanPhone}" target="_blank" class="nav-cta">
      💬 WhatsApp Directo
    </a>
  </header>

  <!-- Hero Section -->
  <main class="container">
    <section class="hero-section">
      <div class="hero-pill">
        <span>⚡</span> ${theme.badge}
      </div>
      <h1 class="hero-title">${theme.heroTitle}</h1>
      <p class="hero-subtitle">${proposalSolutionHtml}</p>
      
      <div class="hero-buttons">
        <a href="#reservas" class="btn-hero-primary">
          📅 ${theme.ctaBooking}
        </a>
        <a href="#calculadora" class="btn-hero-secondary">
          📊 Ver Clientes que Estás Perdiendo Hoy
        </a>
      </div>

      <!-- Metrics Ribbon -->
      <div class="metrics-ribbon">
        <div class="metric-box">
          <div class="metric-icon">⭐</div>
          <div>
            <div class="metric-value">${rating} / 5.0</div>
            <div class="metric-label">${reviewsCount}+ Reseñas Verificadas en Google Maps</div>
          </div>
        </div>
        <div class="metric-box">
          <div class="metric-icon">⚡</div>
          <div>
            <div class="metric-value">&lt; 0.3 seg</div>
            <div class="metric-label">Velocidad de Carga Instantánea</div>
          </div>
        </div>
        <div class="metric-box">
          <div class="metric-icon">📱</div>
          <div>
            <div class="metric-value">100% Móvil</div>
            <div class="metric-label">Experiencia Táctil sin Fricción</div>
          </div>
        </div>
        <div class="metric-box">
          <div class="metric-icon">🛡️</div>
          <div>
            <div class="metric-value">24 / 7</div>
            <div class="metric-label">Agendamiento Digital sin Esperas</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Lost Revenue / Client Calculator (THE HOOK) -->
    <section id="calculadora" class="calculator-section">
      <div class="calc-grid">
        <div>
          <span class="section-tag" style="color: #f43f5e;">Auditoría de Impacto Comercial</span>
          <h2 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0.5rem 0 1rem; line-height: 1.2;">
            ¿Cuántos ${theme.clientLabel} está perdiendo tu web actual?
          </h2>
          <p style="color: var(--text-body); font-size: 1rem; margin-bottom: 1.5rem;">
            Las páginas lentas o sin agendamiento por WhatsApp pierden entre el <strong>55% y 75%</strong> de los visitantes que buscan tus servicios en Google.
          </p>

          <label style="font-weight: 700; color: #cbd5e1; font-size: 0.95rem;">
            Visitas estimadas a tu perfil / web al mes: <span id="visitorCountLabel" style="color: #38bdf8; font-size: 1.2rem;">1,200 visitas</span>
          </label>
          <input type="range" id="trafficSlider" min="200" max="5000" step="100" value="1200" class="calc-slider" oninput="updateCalculator(this.value)">

          <div style="display: flex; gap: 1rem; font-size: 0.85rem; color: #94a3b8;">
            <span>200 visitas/mes</span>
            <span style="margin-left: auto;">5,000+ visitas/mes</span>
          </div>
        </div>

        <div class="calc-card-result">
          <span style="font-size: 0.85rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Pérdida Estimada con Web Antigua</span>
          <div class="calc-big-loss" id="lostClientsCount">-42 ${theme.clientLabel}/mes</div>
          <p style="color: #cbd5e1; font-size: 0.95rem;">Que abandonan tu sitio por lentitud o falta de respuesta rápida.</p>
          
          <div style="border-top: 1px solid var(--border-glass); margin: 1.5rem 0; padding-top: 1.2rem;">
            <span style="font-size: 0.85rem; color: #94a3b8;">Ingresos dejados sobre la mesa (aprox):</span>
            <div style="font-size: 1.8rem; font-weight: 900; color: #fbbf24; font-family: var(--font-display);" id="lostRevenueAmount">
              S/ 5,040 / mes
            </div>
            <div class="calc-gain-highlight">
              🚀 Con esta nueva plataforma recuperarías hasta el 80% de estas consultas.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Grid Section -->
    <section id="servicios" style="padding: 2rem 0;">
      <div class="section-header">
        <span class="section-tag">${theme.category}</span>
        <h2 class="section-title">${theme.servicesTitle}</h2>
        <p class="section-desc">${theme.servicesSubtitle}</p>
      </div>

      <div class="services-grid">
        ${theme.services.map(s => `
          <div class="service-card">
            <span class="service-badge">${s.tag}</span>
            <div>
              <div class="service-icon-box">${s.icon}</div>
              <h3>${s.title}</h3>
              <p>${s.desc}</p>
            </div>
            <a href="#reservas" class="service-card-btn">
              Solicitar Información &rarr;
            </a>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Interactive Appointment / Booking Section -->
    <section id="reservas" class="booking-section">
      <div class="booking-grid">
        <div>
          <span class="section-tag" style="color: #38bdf8;">Reserva Online Directa</span>
          <h2 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0.5rem 0 1rem; line-height: 1.2;">
            Agenda tu Atención en Menos de 1 Minuto
          </h2>
          <p style="color: var(--text-body); font-size: 1rem; margin-bottom: 2rem;">
            Elige el servicio de tu interés y fecha preferida. Confirmaremos tu horario de forma automática e inmediata vía WhatsApp.
          </p>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.8rem;">
              <span style="font-size: 1.3rem;">✅</span>
              <span style="font-size: 0.95rem; color: #cbd5e1;">Sin colas ni llamadas en espera</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.8rem;">
              <span style="font-size: 1.3rem;">✅</span>
              <span style="font-size: 0.95rem; color: #cbd5e1;">Recordatorio automático previo a tu cita</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.8rem;">
              <span style="font-size: 1.3rem;">✅</span>
              <span style="font-size: 0.95rem; color: #cbd5e1;">Atención personalizada en Lima o consulta virtual</span>
            </div>
          </div>
        </div>

        <div>
          <form id="bookingForm" onsubmit="handleBookingSubmit(event)">
            <div class="form-group">
              <label class="form-label">Nombre Completo</label>
              <input type="text" id="patientName" required class="form-control" placeholder="Ej: Roberto Salas">
            </div>

            <div class="form-group">
              <label class="form-label">Servicio o Especialidad</label>
              <select id="patientService" class="form-control">
                ${theme.bookingOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Fecha Preferida</label>
                <input type="date" id="patientDate" required class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Horario Preferido</label>
                <select id="patientTime" class="form-control">
                  <option value="Mañana (09:00 - 12:00)">Mañana (09:00 - 12:00)</option>
                  <option value="Tarde (14:00 - 18:00)">Tarde (14:00 - 18:00)</option>
                  <option value="Noche (18:00 - 20:00)">Noche (18:00 - 20:00)</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn-hero-primary" style="width: 100%; border: none; cursor: pointer; justify-content: center; margin-top: 0.8rem;">
              💬 Confirmar por WhatsApp en 1 Clic
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- Comparison / Why Modernize Table -->
    <section id="ventajas" class="comparison-section">
      <div class="section-header" style="margin-bottom: 2rem;">
        <span class="section-tag">Auditoría Comparativa</span>
        <h2 class="section-title">¿Por qué cambiar a esta nueva plataforma?</h2>
      </div>

      <table class="comp-table">
        <thead>
          <tr>
            <th>Factor Clave</th>
            <th>Tu Web Tradicional / Anterior</th>
            <th>Esta Nueva Plataforma de ${nameHtml}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Velocidad en Móviles</strong></td>
            <td><span class="comp-badge-old">⚠️ 3 a 7 segundos de espera</span></td>
            <td><span class="comp-badge-new">⚡ Menos de 0.3 segundos (Instantáneo)</span></td>
          </tr>
          <tr>
            <td><strong>Agendamiento de Citas</strong></td>
            <td><span class="comp-badge-old">❌ Formularios fríos por correo</span></td>
            <td><span class="comp-badge-new">✅ Conexión directa a WhatsApp en 1 Clic</span></td>
          </tr>
          <tr>
            <td><strong>Posicionamiento & Confianza</strong></td>
            <td><span class="comp-badge-old">⚠️ Sin sincronización de reputación</span></td>
            <td><span class="comp-badge-new">⭐ Sincronización en vivo con Google Maps (${rating}★)</span></td>
          </tr>
          <tr>
            <td><strong>Retención de Prospectos</strong></td>
            <td><span class="comp-badge-old">❌ Pierde el 60% de visitantes</span></td>
            <td><span class="comp-badge-new">🏆 +300% más contactos y ventas efectivas</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Closing Sales Offer Box -->
    <section class="offer-box">
      <h2>¿Te gustaría que esta sea la nueva web oficial de ${nameHtml}?</h2>
      <p>
        Podemos tener tu nueva plataforma lista, conectada a tu dominio, con agendamiento por WhatsApp y sincronizada con Google Maps en <strong>menos de 48 horas</strong>.
      </p>
      <a href="https://wa.me/${cleanPhone}?text=Hola,%20deseo%20activar%20la%20nueva%20web%20para%20${encodeURIComponent(name)}.%20%C2%BFCu%C3%A1l%20es%20el%20siguiente%20paso%3F" target="_blank" class="btn-offer">
        🚀 Solicitar Activación de esta Web para mi Negocio
      </a>
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      <div>
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <div class="nav-brand-logo">${nameHtml.charAt(0)}</div>
          <span style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #fff;">${nameHtml}</span>
        </div>
        <p style="color: var(--text-body); font-size: 0.9rem; max-width: 380px;">
          Líderes en atención y servicios de alta calidad. Comprometidos con la excelencia y la satisfacción de cada cliente en Lima.
        </p>
      </div>

      <div>
        <h4 class="footer-title">Enlaces Rápidos</h4>
        <ul class="footer-links">
          <li><a href="#servicios">Servicios</a></li>
          <li><a href="#calculadora">Calculadora de Pérdidas</a></li>
          <li><a href="#ventajas">Ventajas</a></li>
          <li><a href="#reservas">Agendar Cita</a></li>
        </ul>
      </div>

      <div>
        <h4 class="footer-title">Contacto Directo</h4>
        <ul class="footer-links">
          <li style="color: #cbd5e1;">📞 Teléfono: ${phoneHtml}</li>
          <li style="color: #cbd5e1;">📍 Ubicación: Lima, Perú</li>
          <li style="color: #cbd5e1;">🕒 Horarios: Lun - Sáb: 08:00 - 20:00</li>
        </ul>
      </div>
    </div>

    <div class="container" style="text-align: center; border-top: 1px solid var(--border-glass); padding-top: 1.5rem; color: #64748b; font-size: 0.85rem;">
      © 2026 ${nameHtml} — Prototipo de Modernización Web de Alta Conversión.
    </div>
  </footer>

  <a href="https://wa.me/${cleanPhone}" target="_blank" class="floating-whatsapp" title="Escríbenos por WhatsApp">
    💬
  </a>

  <script>
    const avgTicket = ${theme.avgTicket};
    const clientLabel = "${theme.clientLabel}";

    function updateCalculator(traffic) {
      document.getElementById('visitorCountLabel').innerText = parseInt(traffic).toLocaleString() + ' visitas';
      const lostCount = Math.round(traffic * 0.035);
      const lostMoney = lostCount * avgTicket;

      document.getElementById('lostClientsCount').innerText = '-' + lostCount + ' ' + clientLabel + '/mes';
      document.getElementById('lostRevenueAmount').innerText = 'S/ ' + lostMoney.toLocaleString() + ' / mes';
    }

    document.addEventListener('DOMContentLoaded', () => {
      const dateInput = document.getElementById('patientDate');
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
      }
    });

    function handleBookingSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('patientName').value;
      const service = document.getElementById('patientService').value;
      const date = document.getElementById('patientDate').value;
      const time = document.getElementById('patientTime').value;

      const message = encodeURIComponent(
        'Hola ${nameJs}, me gustaría solicitar ' + service + ' para el día ' + date + ' en el horario ' + time + '. Mi nombre es ' + name + '.'
      );

      const whatsappUrl = 'https://wa.me/${cleanPhone}?text=' + message;
      window.open(whatsappUrl, '_blank');
    }
  </script>
</body>
</html>`;
}
