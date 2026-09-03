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

  // Detección geográfica inteligente (España, Madrid, Lima, Perú, etc.)
  const locRaw = (lead.niche || '').split('-')[1]?.trim() || '';
  const isSpain = locRaw.toLowerCase().includes('madrid') || locRaw.toLowerCase().includes('barcelona') || locRaw.toLowerCase().includes('españa') || nameLower.includes('madrid') || nameLower.includes('barcelona');
  const locCity = isSpain ? (nameLower.includes('barcelona') ? 'Barcelona' : 'Madrid') : (locRaw || 'tu ciudad');
  const taxEntity = isSpain ? 'Hacienda / Agencia Tributaria' : 'SUNAT';
  const currencySymbol = isSpain ? '€' : (locRaw.toLowerCase().includes('lima') || locRaw.toLowerCase().includes('peru') ? 'S/' : '$');

  // Detección inteligente de industria / rubro
  const isDental = nameLower.includes('dental') || nameLower.includes('dient') || nameLower.includes('odontol') || nameLower.includes('sonrisa') || nicheLower.includes('dent') || nicheLower.includes('odont');
  const isLaw = nameLower.includes('juríd') || nameLower.includes('jurid') || nameLower.includes('abog') || nameLower.includes('legal') || nameLower.includes('bufete') || nameLower.includes('lex') || nameLower.includes('ley') || nameLower.includes('notar') || (nicheLower.includes('legal') || nicheLower.includes('abogad') || nicheLower.includes('jurid'));
  const isRestaurant = nameLower.includes('restaur') || nameLower.includes('gastron') || nameLower.includes('comida') || nameLower.includes('café') || nameLower.includes('bar') || nameLower.includes('mesón') || nameLower.includes('asador') || nicheLower.includes('restaur') || nicheLower.includes('gastron');
  const isRealEstate = nameLower.includes('inmobil') || nameLower.includes('bienes') || nameLower.includes('raices') || nameLower.includes('propied') || nameLower.includes('fincas') || nicheLower.includes('inmobil');
  const isArchitecture = nameLower.includes('arquitect') || nameLower.includes('interior') || nameLower.includes('diseño') || nameLower.includes('diseno') || nameLower.includes('construc') || nameLower.includes('vanguardia') || nameLower.includes('reforma') || (nicheLower.includes('arquitect') || nicheLower.includes('diseño') || nicheLower.includes('reforma'));
  const isBeauty = nameLower.includes('estetic') || nameLower.includes('belleza') || nameLower.includes('spa') || nameLower.includes('peluquer') || nameLower.includes('facial') || nicheLower.includes('estetic') || nicheLower.includes('belleza') || nicheLower.includes('spa');
  const isAuto = nameLower.includes('taller') || nameLower.includes('mecanic') || nameLower.includes('auto') || nameLower.includes('motor') || nicheLower.includes('taller') || nicheLower.includes('mecanic') || nicheLower.includes('auto');
  const isFitness = nameLower.includes('gym') || nameLower.includes('gimnas') || nameLower.includes('fit') || nameLower.includes('entren') || nicheLower.includes('gym') || nicheLower.includes('fitness');
  const isFinance = nameLower.includes('financ') || nameLower.includes('tributar') || nameLower.includes('contab') || nameLower.includes('consultor') || nameLower.includes('auditor') || (nicheLower.includes('financ') || nicheLower.includes('tributar'));

  let theme = {
    category: 'Centro Médico & Odontológico',
    badge: `Atención Odontológica & Salud de Excelencia en ${locCity}`,
    heroTitle: `Sonrisas Saludables, Tecnología Avanzada y Confianza en ${locCity}`,
    heroSubtitle: `Atención dental especializada, odontología digital y especialistas certificados para transformar tu sonrisa y cuidar la salud bucal de toda tu familia. Agenda en segundos.`,
    servicesTitle: 'Especialidades Odontológicas & Tratamientos',
    servicesSubtitle: 'Tratamientos de vanguardia con mínima invasión y resultados de máxima estética.',
    ctaBooking: 'Agendar Cita Odontológica',
    clientLabel: 'Pacientes',
    avgTicket: isSpain ? 180 : 120,
    primaryColor: '#0284c7',
    primaryGradient: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
    glowColor: '0 10px 30px -5px rgba(2, 132, 199, 0.4)',
    bgRadial1: 'rgba(2, 132, 199, 0.18)',
    bgRadial2: 'rgba(16, 185, 129, 0.14)',
    services: [
      { icon: '🦷', title: 'Diseño de Sonrisa & Estética Dental', desc: 'Carillas de porcelana, blanqueamiento láser y armonización dental personalizada.', tag: 'Alta Demanda' },
      { icon: '🔬', title: 'Ortodoncia Invisible & Brackets Zafiro', desc: 'Alineación dental de alta precisión sin que nadie note que llevas ortodoncia.', tag: 'Top Ventas' },
      { icon: '💎', title: 'Implantes Dentales de Carga Inmediata', desc: 'Recupera tus piezas dentales con titanio de grado médico y cirugía guiada 3D.', tag: 'Garantizado' },
      { icon: '🩺', title: 'Limpieza Profunda & Prevención', desc: 'Higiene ultrasónica sin dolor, eliminación de sarro y control integral de encías.', tag: 'Esencial' }
    ],
    bookingOptions: ['Valoración Dental / Diagnóstico', 'Ortodoncia Invisible', 'Diseño de Sonrisa / Carillas', 'Implante Dental', 'Limpieza y Revisión'],
    testimonials: [
      { name: 'Dra. Patricia Morales', text: `La mejor clínica en ${locCity}. El diseño de mi sonrisa quedó impecable y el trato de todo el personal es de primer nivel.`, date: 'Hace 3 días' },
      { name: 'Ing. Carlos Mendoza', text: 'Puntualidad absoluta, tecnología de escaneo 3D sin pastas molestas y presupuesto transparente desde el primer día.', date: 'Hace 1 semana' },
      { name: 'Mariana Vega', text: 'Trato muy cálido con los niños y adultos. Me colocaron un implante sin dolor alguno. 100% recomendados.', date: 'Hace 2 semanas' }
    ]
  };

  if (isLaw) {
    theme = {
      category: 'Estudio Jurídico & Legal',
      badge: `Defensa Legal Estratégica & Corporativa en ${locCity}`,
      heroTitle: `Defensa Jurídica de Alto Nivel y Protección Patrimonial`,
      heroSubtitle: `Protegemos tus intereses comerciales y patrimoniales con estrategias legales sólidas, experiencia comprobada y total confidencialidad en ${locCity}.`,
      servicesTitle: 'Áreas de Práctica Jurídica',
      servicesSubtitle: 'Soluciones legales estratégicas a medida para empresas, directores y particulares.',
      ctaBooking: 'Solicitar Asesoría Legal',
      clientLabel: 'Clientes / Casos',
      avgTicket: isSpain ? 950 : 750,
      primaryColor: '#1e3a8a',
      primaryGradient: 'linear-gradient(135deg, #1e3a8a 0%, #d97706 100%)',
      glowColor: '0 10px 30px -5px rgba(217, 119, 6, 0.35)',
      bgRadial1: 'rgba(30, 58, 138, 0.22)',
      bgRadial2: 'rgba(217, 119, 6, 0.12)',
      services: [
        { icon: '⚖️', title: 'Derecho Corporativo & Mercantil', desc: 'Constitución societaria, contratos comerciales de alta cuantía, fusiones y blindaje patrimonial.', tag: 'Empresarial' },
        { icon: '🏛️', title: 'Litigios Civiles & Resolución de Conflictos', desc: 'Defensa judicial y arbitral de alta complejidad con enfoque en salvaguarda de activos.', tag: 'Estratégico' },
        { icon: '💼', title: 'Derecho Laboral & Tributario', desc: `Auditoría laboral preventiva, defensa ante ${taxEntity} y optimización fiscal legal.`, tag: 'Preventivo' },
        { icon: '🏢', title: 'Derecho Inmobiliario & Notarial', desc: 'Estudio de títulos, contratos de arrendamiento, compraventas y saneamiento de fincas.', tag: 'Inmobiliario' }
      ],
      bookingOptions: ['Asesoría Corporativa / Contratos', `Consulta Fiscal / ${taxEntity}`, 'Litigio o Conflicto Judicial', 'Derecho Inmobiliario', 'Consulta General'],
      testimonials: [
        { name: 'Dr. Roberto Zambrano', text: 'Resolvieron un conflicto contractual societario en tiempo récord. El nivel de preparación del equipo es sobresaliente.', date: 'Hace 4 días' },
        { name: 'Lucía Fernández (Gerente)', text: `Nuestro despacho de confianza en ${locCity} para todos los asuntos comerciales. Rigor y seriedad total.`, date: 'Hace 2 semanas' },
        { name: 'Esteban Ramos', text: `Excelente asesoramiento tributario, nos evitaron contingencias graves ante ${taxEntity}. Muy agradecido.`, date: 'Hace 1 mes' }
      ]
    };
  } else if (isRestaurant) {
    theme = {
      category: 'Restaurante & Experiencia Gastronómica',
      badge: `Gastronomía de Autor & Sabores Auténticos en ${locCity}`,
      heroTitle: `Experiencia Culinaria Inolvidable, Tradición y Vanguardia`,
      heroSubtitle: `Ingredientes seleccionados de temporada, carnes maduradas a la brasa, cocina con alma y una selecta bodega para deleitar tus sentidos en ${locCity}.`,
      servicesTitle: 'Nuestra Propuesta Gastronómica',
      servicesSubtitle: 'Un viaje de sabores creado con pasión por nuestros maestros de cocina.',
      ctaBooking: 'Reservar Mesa Online',
      clientLabel: 'Comensales',
      avgTicket: isSpain ? 45 : 35,
      primaryColor: '#b91c1c',
      primaryGradient: 'linear-gradient(135deg, #b91c1c 0%, #f59e0b 100%)',
      glowColor: '0 10px 30px -5px rgba(185, 28, 28, 0.4)',
      bgRadial1: 'rgba(185, 28, 28, 0.20)',
      bgRadial2: 'rgba(245, 158, 11, 0.15)',
      services: [
        { icon: '🥩', title: 'Carnes Maduradas & Brasa Viva', desc: 'Cortes premium madurados en su punto exacto, sellados a la brasa de encina con sabor único.', tag: 'Especialidad' },
        { icon: '🍷', title: 'Cava de Vinos & Maridaje Seleccionado', desc: 'Más de 80 referencias de las mejores denominaciones de origen para elevar cada plato.', tag: 'Maridaje' },
        { icon: '🥘', title: 'Arroces de Autor & Pescados Frescos', desc: 'Recetas de mar y tierra preparadas al momento con fondos reducidos durante horas.', tag: 'Favorito' },
        { icon: '🎉', title: 'Eventos Privados & Cenas de Empresa', desc: 'Salones exclusivos para grupos, menús corporativos a medida y atención personalizada.', tag: 'Reservas' }
      ],
      bookingOptions: ['Reserva de Mesa (2-4 personas)', 'Mesa para Grupo (5+ personas)', 'Cena Maridaje de Degustación', 'Evento Privado / Celebración', 'Consulta Carta & Alérgenos'],
      testimonials: [
        { name: 'Marta Delgado', text: `Sin duda uno de los mejores restaurantes de ${locCity}. El solomillo y el trato del sumiller fueron espectaculares.`, date: 'Hace 2 días' },
        { name: 'Javier Navarro', text: 'Celebramos nuestro aniversario y cuidaron cada detalle con postre sorpresa incluido. Una velada mágica.', date: 'Hace 1 semana' },
        { name: 'Beatriz Sanz', text: 'Ambiente acogedor, carta de vinos de nivel y arroces en su punto exacto. Repetiremos siempre.', date: 'Hace 2 semanas' }
      ]
    };
  } else if (isRealEstate) {
    theme = {
      category: 'Inmobiliaria & Gestión Patrimonial',
      badge: `Propiedades Exclusivas & Asesoría Inmobiliaria en ${locCity}`,
      heroTitle: `Encuentra tu Hogar Ideal o Maximiza la Venta de tu Propiedad`,
      heroSubtitle: `Expertos en compra, venta y alquiler de inmuebles residenciales y comerciales en ${locCity}. Tasación profesional gratuita y acompañamiento integral.`,
      servicesTitle: 'Servicios Inmobiliarios Integrales',
      servicesSubtitle: 'Gestión transparente, compradores cualificados y marketing inmobiliario de alto impacto.',
      ctaBooking: 'Solicitar Tasación Gratuita',
      clientLabel: 'Operaciones Cerradas',
      avgTicket: isSpain ? 3500 : 2500,
      primaryColor: '#059669',
      primaryGradient: 'linear-gradient(135deg, #2563eb 0%, #059669 100%)',
      glowColor: '0 10px 30px -5px rgba(5, 150, 105, 0.4)',
      bgRadial1: 'rgba(37, 99, 235, 0.18)',
      bgRadial2: 'rgba(5, 150, 105, 0.16)',
      services: [
        { icon: '🏡', title: 'Venta de Pisos & Chalets Exclusivos', desc: 'Plan de marketing digital 360°, fotografía profesional y filtrado riguroso de compradores.', tag: 'Venta Rápida' },
        { icon: '📈', title: 'Tasación Inmobiliaria Oficial Gratuita', desc: 'Valoración real de mercado basada en datos registrales recientes sin coste ni compromiso.', tag: 'Gratis' },
        { icon: '🔑', title: 'Alquiler Seguro con Garantía de Pago', desc: 'Selección de inquilinos solventes con seguro de impago y gestión integral del contrato.', tag: 'Protegido' },
        { icon: '🏢', title: 'Inversión & Locales Comerciales', desc: 'Oportunidades de alta rentabilidad neta para inversores patrimoniales en ubicaciones prime.', tag: 'Inversión' }
      ],
      bookingOptions: ['Quiero Vender mi Propiedad', 'Tasación Gratuita de Inmueble', 'Busco Comprar Vivienda', 'Alquiler de Propiedades', 'Asesoría de Inversión'],
      testimonials: [
        { name: 'Ignacio Gómez', text: `Vendieron mi piso en ${locCity} en menos de 40 días al precio pactado. Gestión notarial impecable.`, date: 'Hace 5 días' },
        { name: 'Elena Garrido', text: 'Encontrar vivienda con ellos fue un respiro. Nos ahorraron semanas de visitas infructuosas.', date: 'Hace 2 semanas' },
        { name: 'Marcos Gil', text: 'Gran equipo de inversores. Excelente ojo para detectar oportunidades de reforma y rentabilidad.', date: 'Hace 1 mes' }
      ]
    };
  } else if (isBeauty) {
    theme = {
      category: 'Estética Avanzada & Centro de Belleza',
      badge: `Tratamientos Faciales, Corporales & Bienestar en ${locCity}`,
      heroTitle: `Tu Belleza Natural Realzada con Tecnología Avanzada`,
      heroSubtitle: `Rituales de cuidado facial, rejuvenecimiento sin cirugía, aparatología médico-estética y masajes de relajación en un ambiente de calma exclusivo.`,
      servicesTitle: 'Nuestra Carta de Belleza & Estética',
      servicesSubtitle: 'Protocolos personalizados según las necesidades únicas de tu piel y cuerpo.',
      ctaBooking: 'Reservar Tratamiento Estético',
      clientLabel: 'Clientas Satisfechas',
      avgTicket: isSpain ? 85 : 60,
      primaryColor: '#db2777',
      primaryGradient: 'linear-gradient(135deg, #db2777 0%, #8b5cf6 100%)',
      glowColor: '0 10px 30px -5px rgba(219, 39, 119, 0.4)',
      bgRadial1: 'rgba(219, 39, 119, 0.20)',
      bgRadial2: 'rgba(139, 92, 246, 0.16)',
      services: [
        { icon: '✨', title: 'Higiene Facial Profunda & Hydrafacial', desc: 'Limpieza celular con sueros antioxidantes, extracción suave y luminosidad instantánea.', tag: 'Top Glow' },
        { icon: '🌿', title: 'Maderoterapia & Reductor Corporal', desc: 'Drenaje linfático, reafirmación y modelado corporal con técnicas naturales no invasivas.', tag: 'Efectivo' },
        { icon: '💎', title: 'Lifting Facial & Rejuvenecimiento Radiofrecuencia', desc: 'Estimulación de colágeno propio para tensar la piel y difuminar líneas de expresión.', tag: 'Antiedad' },
        { icon: '🧖‍♀️', title: 'Rituales Spa & Masaje Relajante con Aromas', desc: 'Desconexión total del estrés diario con aceites botánicos y aromaterapia guiada.', tag: 'Relax' }
      ],
      bookingOptions: ['Diagnóstico de Piel Gratuito', 'Limpieza Facial Hydrafacial', 'Bono Corporal Reductor', 'Masaje Spa Relajante', 'Tratamiento Antiedad'],
      testimonials: [
        { name: 'Sofía Carvajal', text: `Salí con la piel luminosa y descansada. El mejor centro de estética de ${locCity}, sin duda alguna.`, date: 'Hace 3 días' },
        { name: 'Valeria Montero', text: 'El tratamiento reductor dio resultados visibles desde la tercera sesión. Trato muy profesional y delicado.', date: 'Hace 1 semana' },
        { name: 'Lorena Rubio', text: 'Un oasis de paz en mitad de la ciudad. El masaje con aromaterapia me dejó como nueva.', date: 'Hace 3 semanas' }
      ]
    };
  } else if (isAuto) {
    theme = {
      category: 'Taller Mecánico & Diagnosis Automotriz',
      badge: `Mecánica de Confianza & Mantenimiento Multimarca en ${locCity}`,
      heroTitle: `Mecánica Profesional, Diagnosis de Precisión y Seguridad en Carretera`,
      heroSubtitle: `Mantenimiento oficial pre-ITV, diagnosis por ordenador, revisión de frenos y neumáticos con repuestos homologados y presupuesto cerrado sin sorpresas.`,
      servicesTitle: 'Servicios de Taller & Reparación',
      servicesSubtitle: 'Cuidamos de tu vehículo con mecánicos titulados y tecnología de diagnosis oficial.',
      ctaBooking: 'Pedir Cita en Taller',
      clientLabel: 'Vehículos Reparados',
      avgTicket: isSpain ? 220 : 150,
      primaryColor: '#ea580c',
      primaryGradient: 'linear-gradient(135deg, #1f2937 0%, #ea580c 100%)',
      glowColor: '0 10px 30px -5px rgba(234, 88, 12, 0.4)',
      bgRadial1: 'rgba(31, 41, 55, 0.25)',
      bgRadial2: 'rgba(234, 88, 12, 0.18)',
      services: [
        { icon: '🔧', title: 'Revisión Oficial Pre-ITV & Mantenimiento', desc: 'Chequeo completo de 40 puntos de control para pasar la ITV a la primera y sin contratiempos.', tag: 'Garantizado' },
        { icon: '💻', title: 'Diagnosis Electrónica Multimarca', desc: 'Detección exacta de fallos de motor, sensores e inyección con equipos de última generación.', tag: 'Rápido' },
        { icon: '🛞', title: 'Frenos, Neumáticos & Suspensión', desc: 'Sustitución de pastillas, discos, amortiguadores y equilibrado de ruedas para tu seguridad.', tag: 'Seguridad' },
        { icon: '⚡', title: 'Climatización, Batería & Cambio de Aceite', desc: 'Carga de gas R134a/R1234yf, comprobación de alternador y aceites sintéticos de máxima calidad.', tag: 'Mantenimiento' }
      ],
      bookingOptions: ['Revisión Pre-ITV Completa', 'Diagnosis de Fallo de Motor', 'Cambio de Aceite y Filtros', 'Presupuesto de Frenos / Neumáticos', 'Revisión General de Taller'],
      testimonials: [
        { name: 'Manuel Ortiz', text: `Excelente taller en ${locCity}. Me explicaron la avería con fotos y me dieron presupuesto exacto antes de tocar nada.`, date: 'Hace 4 días' },
        { name: 'Daniel Herranz', text: 'Pasé la ITV a la primera tras la revisión. Muy puntuales y coche limpio al entregarlo.', date: 'Hace 2 semanas' },
        { name: 'Raúl Santana', text: 'Precios justos y mecánicos honestos, que hoy en día es difícil de encontrar. Taller de confianza.', date: 'Hace 1 mes' }
      ]
    };
  } else if (isArchitecture) {
    theme = {
      category: 'Estudio de Arquitectura & Reformas',
      badge: `Diseño Arquitectónico, Interiorismo & Reformas Integrales en ${locCity}`,
      heroTitle: `Transformamos Espacios en Obras Arquitectónicas Extraordinarias`,
      heroSubtitle: `Diseño arquitectónico contemporáneo, reformas integrales de lujo y gestión completa de obra desde la idea conceptual hasta la entrega de llaves en ${locCity}.`,
      servicesTitle: 'Servicios de Arquitectura & Diseño',
      servicesSubtitle: 'Innovación espacial, estética refinada y máximo rigor en plazos y costes.',
      ctaBooking: 'Cotizar Proyecto / Reforma',
      clientLabel: 'Proyectos Entregados',
      avgTicket: isSpain ? 3200 : 2200,
      primaryColor: '#ea580c',
      primaryGradient: 'linear-gradient(135deg, #334155 0%, #ea580c 100%)',
      glowColor: '0 10px 30px -5px rgba(234, 88, 12, 0.35)',
      bgRadial1: 'rgba(51, 65, 85, 0.25)',
      bgRadial2: 'rgba(234, 88, 12, 0.16)',
      services: [
        { icon: '📐', title: 'Diseño Residencial & Comercial', desc: 'Planificación arquitectónica completa con estética moderna y funcionalidad optimizada.', tag: 'Exclusivo' },
        { icon: '🛋️', title: 'Interiorismo & Reformas Integrales', desc: 'Selección de materiales nobles, iluminación escénica y mobiliario personalizado a medida.', tag: 'Diseño' },
        { icon: '🏗️', title: 'Gestión & Dirección de Obra Llave en Mano', desc: 'Control exhaustivo de plazos, licencias municipales y acabados de máxima calidad constructiva.', tag: 'Sin Estrés' },
        { icon: '🖥️', title: 'Renders 3D & Recorridos Virtuales VR', desc: 'Visualización fotorrealista de tu vivienda o local comercial antes de poner el primer ladrillo.', tag: '3D Ultra' }
      ],
      bookingOptions: ['Reforma Integral de Vivienda', 'Diseño de Local Comercial / Oficina', 'Obra Nueva / Proyecto Arquitectónico', 'Interiorismo y Mobiliario', 'Solicitar Presupuesto'],
      testimonials: [
        { name: 'Arq. Gabriela Soto', text: `El proyecto de nuestra vivienda en ${locCity} superó las expectativas. Gran aprovechamiento de la luz.`, date: 'Hace 5 días' },
        { name: 'Felipe Paredes', text: 'Reformaron nuestras oficinas dentro del plazo pactado y sin sobrecostes inesperados. 10/10.', date: 'Hace 2 semanas' },
        { name: 'Claudia Navarro', text: 'Los renders y la casa terminada eran idénticos. Cuidaron cada milímetro con mucha pasión.', date: 'Hace 3 semanas' }
      ]
    };
  } else if (isFinance) {
    theme = {
      category: 'Consultoría Financiera & Tributaria',
      badge: `Estrategia Fiscal & Crecimiento Financiero en ${locCity}`,
      heroTitle: `Estrategia Tributaria, Contabilidad y Control Financiero para Empresas`,
      heroSubtitle: `Optimizamos la carga tributaria de tu empresa de forma 100% legal, garantizamos cumplimiento ante ${taxEntity} y maximizamos la rentabilidad en ${locCity}.`,
      servicesTitle: 'Nuestros Servicios Financieros & Fiscales',
      servicesSubtitle: 'Soluciones contables, tributarias y de auditoría con máximo rigor técnico.',
      ctaBooking: 'Solicitar Diagnóstico Fiscal',
      clientLabel: 'Empresas Asesoradas',
      avgTicket: isSpain ? 1400 : 1000,
      primaryColor: '#0f766e',
      primaryGradient: 'linear-gradient(135deg, #0f766e 0%, #0284c7 100%)',
      glowColor: '0 10px 30px -5px rgba(15, 118, 110, 0.4)',
      bgRadial1: 'rgba(15, 118, 110, 0.22)',
      bgRadial2: 'rgba(2, 132, 199, 0.15)',
      services: [
        { icon: '📊', title: 'Planeamiento Fiscal & Ahorro Tributario', desc: `Estructuración legal y fiscal para reducir riesgos impositivos ante ${taxEntity} y ganar liquidez.`, tag: 'Ahorro' },
        { icon: '📑', title: 'Contabilidad Integral & Cierre de Cuentas', desc: 'Presentación puntual de impuestos, estados financieros mensuales y libros contables oficiales.', tag: 'Mensual' },
        { icon: '🔍', title: `Auditoría Preventiva & Blindaje ante ${taxEntity}`, desc: 'Revisión exhaustiva de ejercicios anteriores para evitar inspecciones, multas o requerimientos.', tag: 'Blindaje' },
        { icon: '💼', title: 'Finanzas Corporativas & Flujo de Caja', desc: 'Diagnóstico de rentabilidad, análisis de márgenes operativos y valoración de empresas.', tag: 'Estratégico' }
      ],
      bookingOptions: ['Diagnóstico Fiscal Gratuito', 'Outsourcing Contable Mensual', `Revisión Preventiva ${taxEntity}`, 'Planificación Financiera Empresarial', 'Consulta General'],
      testimonials: [
        { name: 'Ing. Rodrigo Alarcón', text: `Nos ahorraron miles de euros en deducciones legales ante ${taxEntity}. Asesoría brillante.`, date: 'Hace 6 días' },
        { name: 'Valeria Benavides', text: 'Tranquilidad total para nuestra junta directiva. Siempre al día con impuestos y reportes nítidos.', date: 'Hace 2 semanas' },
        { name: 'Martín Córdova', text: 'Asesoría cercana, rápida y de primer nivel. Un socio estratégico indispensable para crecer.', date: 'Hace 1 mes' }
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
      --primary: ${theme.primaryColor || '#3b82f6'};
      --primary-gradient: ${theme.primaryGradient || 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)'};
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
      --glow-blue: ${theme.glowColor || '0 10px 30px -5px rgba(37, 99, 235, 0.4)'};
      --font-display: 'Outfit', sans-serif;
      --font-body: 'Plus Jakarta Sans', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background-color: var(--bg-main);
      background-image: 
        radial-gradient(at 15% 15%, ${theme.bgRadial1 || 'rgba(37, 99, 235, 0.18)'} 0px, transparent 50%),
        radial-gradient(at 85% 75%, ${theme.bgRadial2 || 'rgba(6, 182, 212, 0.15)'} 0px, transparent 50%),
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
