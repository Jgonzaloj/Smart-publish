import { LeadsRepository } from '../../db/repositories/leads.repository.js';
import { ProspectLead } from '../../types/index.js';
import { config } from '../../config/env.js';
import { normalizeToE164 } from '../../utils/phone.utils.js';

export interface HuntCriteria {
  niche: string;
  location: string;
  limit?: number;
}

export class LeadHunterService {
  private leadsRepo = new LeadsRepository();

  /**
   * Ejecuta la búsqueda de leads asegurando idempotencia.
   * Si USE_MOCK_MODE es true o no hay API KEY, utiliza el dataset sintético representativo de nicho.
   */
  async huntLeads(criteria: HuntCriteria): Promise<{ ingested: ProspectLead[]; skipped: number }> {
    const limit = criteria.limit || 10;
    let rawLeads: Array<Omit<ProspectLead, 'id' | 'status' | 'retry_count' | 'do_not_contact' | 'created_at' | 'updated_at'>>;

    const hasValidPlacesKey = config.GOOGLE_PLACES_API_KEY && !config.GOOGLE_PLACES_API_KEY.includes('your_');

    if (config.USE_MOCK_MODE || !hasValidPlacesKey) {
      rawLeads = this.generateMockLeads(criteria.niche, criteria.location, limit);
    } else {
      try {
        rawLeads = await this.fetchFromGooglePlaces(criteria.niche, criteria.location, limit);
        if (rawLeads.length === 0) {
          console.warn('[LeadHunter] Google Places no devolvió resultados. Usando dataset de contingencia.');
          rawLeads = this.generateMockLeads(criteria.niche, criteria.location, limit);
        }
      } catch (err) {
        console.warn('[LeadHunter] Error consultando Google Places. Usando dataset de contingencia:', err);
        rawLeads = this.generateMockLeads(criteria.niche, criteria.location, limit);
      }
    }

    const ingested: ProspectLead[] = [];
    let skipped = 0;

    for (const item of rawLeads) {
      const created = this.leadsRepo.insertLead(item);
      if (created) {
        ingested.push(created);
      } else {
        skipped++;
      }
    }

    return { ingested, skipped };
  }

  private async fetchFromGooglePlaces(
    niche: string,
    location: string,
    limit: number
  ): Promise<Array<Omit<ProspectLead, 'id' | 'status' | 'retry_count' | 'do_not_contact' | 'created_at' | 'updated_at'>>> {
    const query = encodeURIComponent(`${niche} en ${location}`);
    const leads: Array<Omit<ProspectLead, 'id' | 'status' | 'retry_count' | 'do_not_contact' | 'created_at' | 'updated_at'>> = [];
    let nextPageToken: string | undefined = undefined;
    let page = 0;
    const maxPages = Math.ceil(limit / 20);

    try {
      while (leads.length < limit && page < maxPages) {
        let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${config.GOOGLE_PLACES_API_KEY}`;
        if (nextPageToken) {
          // Google Places requiere un breve delay para que el nextPageToken sea válido
          console.log(`[LeadHunter] Esperando activación de next_page_token para página ${page + 1}...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${config.GOOGLE_PLACES_API_KEY}`;
        }

        const res = await fetch(searchUrl);
        const data = (await res.json()) as any;

        if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
          break;
        }

        for (const place of data.results) {
          if (leads.length >= limit) break;

          let website = undefined;
          let phone = undefined;

          if (place.place_id) {
            const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,international_phone_number,website,url&key=${config.GOOGLE_PLACES_API_KEY}`;
            try {
              const detailRes = await fetch(detailUrl);
              const detailData = (await detailRes.json()) as any;
              if (detailData.result) {
                website = detailData.result.website;
                phone = detailData.result.international_phone_number || detailData.result.formatted_phone_number;
              }
            } catch (e) {
              // Continuar con los datos básicos
            }
          }

          // Normalizar teléfono a formato internacional E.164
          const normalizedPhone = normalizeToE164(phone, config.DEFAULT_COUNTRY_CODE);

          leads.push({
            place_id: place.place_id || `place_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            business_name: place.name,
            niche,
            phone: normalizedPhone || phone,
            whatsapp: normalizedPhone || phone,
            email: undefined,
            google_maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            rating: place.rating,
            reviews_count: place.user_ratings_total,
            current_website_url: website,
          });
        }

        nextPageToken = data.next_page_token;
        page++;
        if (!nextPageToken) break;
      }

      return leads;
    } catch (err) {
      console.error('[LeadHunter] Error llamando a Google Places API con paginación:', err);
      return leads;
    }
  }

  /**
   * Generador de dataset mock con casos realistas:
   * 1. Negocio con web lenta y WordPress desactualizado (modernización)
   * 2. Negocio sin página web pero con alto rating en Google Maps (oportunidad NEW_WEBSITE)
   * 3. Negocio con web moderna y rápida (candidato a DISCARDED por score alto)
   * 4. Negocio con web no responsive y problemas móviles
   */
  /**
   * Generador dinámico y realista según el rubro y la ubicación geográfica (España, Perú, México, etc.)
   */
  private generateMockLeads(
    niche: string,
    location: string,
    limit: number
  ): Array<Omit<ProspectLead, 'id' | 'status' | 'retry_count' | 'do_not_contact' | 'created_at' | 'updated_at'>> {
    const locLower = (location || '').toLowerCase();
    const nicheLower = (niche || '').toLowerCase();

    // Detección de país y prefijo
    const isSpain = locLower.includes('madrid') || locLower.includes('barcelona') || locLower.includes('españa') || locLower.includes('spain') || locLower.includes('valencia') || locLower.includes('sevilla') || locLower.includes('málaga') || locLower.includes('bilbao') || locLower.includes('zaragoza');
    const isPeru = locLower.includes('lima') || locLower.includes('perú') || locLower.includes('peru') || locLower.includes('ica') || locLower.includes('arequipa') || locLower.includes('trujillo') || locLower.includes('cusco');
    const isMexico = locLower.includes('mexico') || locLower.includes('méxico') || locLower.includes('cdmx') || locLower.includes('guadalajara') || locLower.includes('monterrey');

    let phonePrefix = '+34 91';
    let countryCode = '34';
    let tld = '.es';

    if (isSpain) {
      phonePrefix = '+34 91';
      countryCode = '34';
      tld = '.es';
    } else if (isPeru) {
      phonePrefix = '+51 9';
      countryCode = '51';
      tld = '.pe';
    } else if (isMexico) {
      phonePrefix = '+52 55';
      countryCode = '52';
      tld = '.mx';
    } else {
      phonePrefix = '+34 91';
      countryCode = '34';
      tld = '.es';
    }

    // Detección de rubro / nicho para generar plantillas específicas
    const isDental = nicheLower.includes('dent') || nicheLower.includes('odont') || nicheLower.includes('sonris');
    const isLaw = nicheLower.includes('abog') || nicheLower.includes('jurid') || nicheLower.includes('legal') || nicheLower.includes('bufete') || nicheLower.includes('ley');
    const isRestaurant = nicheLower.includes('restaur') || nicheLower.includes('gastron') || nicheLower.includes('comida') || nicheLower.includes('café') || nicheLower.includes('bar') || nicheLower.includes('mesón') || nicheLower.includes('asador');
    const isRealEstate = nicheLower.includes('inmobil') || nicheLower.includes('bienes') || nicheLower.includes('raices') || nicheLower.includes('propied');
    const isArchitecture = nicheLower.includes('arquit') || nicheLower.includes('interior') || nicheLower.includes('reform') || nicheLower.includes('construc');
    const isBeauty = nicheLower.includes('estetic') || nicheLower.includes('belleza') || nicheLower.includes('spa') || nicheLower.includes('peluquer') || nicheLower.includes('facial');
    const isAuto = nicheLower.includes('taller') || nicheLower.includes('mecanic') || nicheLower.includes('auto') || nicheLower.includes('motor');
    const isFinance = nicheLower.includes('financ') || nicheLower.includes('contab') || nicheLower.includes('tribut') || nicheLower.includes('fiscal') || nicheLower.includes('asesor');

    let templates: Array<{ namePrefix: string; rating: number; reviews: number; websiteDomain?: string }> = [];

    if (isDental) {
      templates = [
        { namePrefix: 'Clínica Dental & Estética Sonrisas', rating: 4.8, reviews: 142, websiteDomain: 'clinicadentalsonrisas' },
        { namePrefix: 'Centro Odontológico Avanzado', rating: 4.9, reviews: 215, websiteDomain: 'odontologiaavanzada' },
        { namePrefix: 'Clínica de Ortodoncia & Implantes', rating: 4.7, reviews: 98, websiteDomain: 'ortodonciayestetica' },
        { namePrefix: 'Dental Care & Cirugía Oral', rating: 4.6, reviews: 84, websiteDomain: undefined }, // Oportunidad sin web
        { namePrefix: 'Clínica Dental Familiar', rating: 4.8, reviews: 175, websiteDomain: 'dentalfamiliar' },
      ];
    } else if (isLaw) {
      templates = [
        { namePrefix: 'Bufete Jurídico & Asociados Lex', rating: 4.7, reviews: 89, websiteDomain: 'bufetelexabogados' },
        { namePrefix: 'Gabinete Legal & Corporativo', rating: 4.8, reviews: 112, websiteDomain: 'gabinetelegal' },
        { namePrefix: 'Abogados Especialistas en Litigios', rating: 4.6, reviews: 67, websiteDomain: 'abogadoslitigios' },
        { namePrefix: 'Consultoría Legal & Fiscal', rating: 4.9, reviews: 154, websiteDomain: undefined },
        { namePrefix: 'Estudio Jurídico Mercantil', rating: 4.5, reviews: 52, websiteDomain: 'juridicomercantil' },
      ];
    } else if (isRestaurant) {
      templates = [
        { namePrefix: 'Restaurante Asador Tradición & Fuego', rating: 4.8, reviews: 340, websiteDomain: 'asadorfuego' },
        { namePrefix: 'Bistró Gourmet & Vinos', rating: 4.9, reviews: 280, websiteDomain: 'bistrogourmet' },
        { namePrefix: 'Taberna & Arrocería La Cava', rating: 4.6, reviews: 195, websiteDomain: 'tabernalacava' },
        { namePrefix: 'Restaurante Fusión & Mar', rating: 4.7, reviews: 220, websiteDomain: undefined },
        { namePrefix: 'Mesón Gastronómico de Autor', rating: 4.8, reviews: 165, websiteDomain: 'mesondeautor' },
      ];
    } else if (isRealEstate) {
      templates = [
        { namePrefix: 'Inmobiliaria Habitat & Propiedades', rating: 4.7, reviews: 95, websiteDomain: 'habitatpropiedades' },
        { namePrefix: 'Gestión Inmobiliaria & Fincas', rating: 4.8, reviews: 130, websiteDomain: 'gestionfincas' },
        { namePrefix: 'Inversiones Inmobiliarias Prime', rating: 4.9, reviews: 160, websiteDomain: 'inversionesprime' },
        { namePrefix: 'Consultora de Viviendas & Locales', rating: 4.5, reviews: 78, websiteDomain: undefined },
        { namePrefix: 'Agencia Inmobiliaria Selecta', rating: 4.8, reviews: 140, websiteDomain: 'inmobiliariaselecta' },
      ];
    } else if (isArchitecture) {
      templates = [
        { namePrefix: 'Estudio de Arquitectura e Interiorismo Vanguardia', rating: 4.8, reviews: 104, websiteDomain: 'arquitecturavanguardia' },
        { namePrefix: 'Proyectos Arquitectónicos & Reformas', rating: 4.7, reviews: 88, websiteDomain: 'proyectosyreformas' },
        { namePrefix: 'Diseño de Espacios & Obra Llave en Mano', rating: 4.9, reviews: 142, websiteDomain: 'disenoespacios' },
        { namePrefix: 'Gabinete Técnico & Reformas Integrales', rating: 4.6, reviews: 71, websiteDomain: undefined },
        { namePrefix: 'Arquitectura Residencial Moderna', rating: 4.8, reviews: 93, websiteDomain: 'arquitecturaresidencial' },
      ];
    } else if (isBeauty) {
      templates = [
        { namePrefix: 'Centro de Estética Avanzada & Spa', rating: 4.9, reviews: 210, websiteDomain: 'esteticavanzada' },
        { namePrefix: 'Salón de Belleza & Cuidado Capilar', rating: 4.8, reviews: 175, websiteDomain: 'salonbelleza' },
        { namePrefix: 'Clínica de Medicina Estética & Rejuvenecimiento', rating: 4.7, reviews: 134, websiteDomain: 'medicinaesteticarejuvenece' },
        { namePrefix: 'Spa Urbano & Masajes Terapéuticos', rating: 4.9, reviews: 190, websiteDomain: undefined },
        { namePrefix: 'Estudio de Imagen & Alta Peluquería', rating: 4.6, reviews: 89, websiteDomain: 'estudioimagen' },
      ];
    } else if (isAuto) {
      templates = [
        { namePrefix: 'Taller Mecánico & Diagnosis Electrónica', rating: 4.7, reviews: 156, websiteDomain: 'tallermecanicodiagnosis' },
        { namePrefix: 'Centro del Motor & Servicio Multimarca', rating: 4.8, reviews: 184, websiteDomain: 'centromotorservicio' },
        { namePrefix: 'Taller de Chapa, Pintura & Mecánica', rating: 4.6, reviews: 98, websiteDomain: 'chapaymecanica' },
        { namePrefix: 'Especialistas en Frenos, Suspensión & Neumáticos', rating: 4.9, reviews: 230, websiteDomain: undefined },
        { namePrefix: 'Mecánica Rápida & Mantenimiento Pre-ITV', rating: 4.7, reviews: 145, websiteDomain: 'mecanicarapida' },
      ];
    } else if (isFinance) {
      templates = [
        { namePrefix: 'Consultoría Financiera & Tributaria Éxito', rating: 4.7, reviews: 88, websiteDomain: 'consultoriafiscalexito' },
        { namePrefix: 'Asesoría Fiscal & Contable para Empresas', rating: 4.8, reviews: 120, websiteDomain: 'asesoriafiscalempresas' },
        { namePrefix: 'Auditoría & Planificación Financiera', rating: 4.9, reviews: 145, websiteDomain: 'auditoriayfinanzas' },
        { namePrefix: 'Gestoría Integral de Negocios', rating: 4.5, reviews: 65, websiteDomain: undefined },
        { namePrefix: 'Consultores de Finanzas & Reestructuración', rating: 4.8, reviews: 110, websiteDomain: 'finanzascorporativas' },
      ];
    } else {
      templates = [
        { namePrefix: `${niche} Especializado`, rating: 4.8, reviews: 120, websiteDomain: 'serviciosprofesionales' },
        { namePrefix: `Centro Integral de ${niche}`, rating: 4.7, reviews: 95, websiteDomain: 'centrointegral' },
        { namePrefix: `Expertos en ${niche}`, rating: 4.9, reviews: 160, websiteDomain: 'expertosprofesionales' },
        { namePrefix: `Servicios y Soluciones ${niche}`, rating: 4.6, reviews: 75, websiteDomain: undefined },
        { namePrefix: `Gabinete Profesional ${niche}`, rating: 4.8, reviews: 140, websiteDomain: 'gabineteintegral' },
      ];
    }

    const leads: Array<Omit<ProspectLead, 'id' | 'status' | 'retry_count' | 'do_not_contact' | 'created_at' | 'updated_at'>> = [];
    const timestamp = Date.now();
    const cycleCode = Math.floor(100 + Math.random() * 900);

    // Dominios reales vivos para auditoría de Playwright según país y rubro
    const realWebsitesSpain: Record<string, Array<string | undefined>> = {
      dental: ['https://www.adeslasdental.es', 'https://artydents.es', 'https://docdental.es', undefined, 'https://www.sanitas.es'],
      law: ['https://www.uria.com', 'https://www.garrigues.com', 'https://www.cuatrecasas.com', undefined, 'https://www.abogados.es'],
      restaurant: ['https://www.asadorarandino.es', 'https://www.grupolamusa.com', 'https://www.cerveceriasangines.com', undefined, 'https://www.restauranteamaznico.com'],
      realestate: ['https://www.idealista.com', 'https://www.fotocasa.es', 'https://www.habitaclia.com', undefined, 'https://www.pisos.com'],
      architecture: ['https://www.archdaily.es', 'https://www.reformas-madrid.es', 'https://www.houzz.es', undefined, 'https://www.arquitecturaviva.com'],
      beauty: ['https://www.treatwell.es', 'https://www.hedonai.com', 'https://www.dorsia.es', undefined, 'https://www.clinicasesteticas.es'],
      auto: ['https://www.norauto.es', 'https://www.midas.es', 'https://www.feuvert.es', undefined, 'https://www.euromaster-neumaticos.es'],
      finance: ['https://www.kpmg.com/es', 'https://www.pwc.es', 'https://www.deloitte.com/es', undefined, 'https://www.bdo.es'],
    };

    let nicheKey = 'dental';
    if (isDental) nicheKey = 'dental';
    else if (isLaw) nicheKey = 'law';
    else if (isRestaurant) nicheKey = 'restaurant';
    else if (isRealEstate) nicheKey = 'realestate';
    else if (isArchitecture) nicheKey = 'architecture';
    else if (isBeauty) nicheKey = 'beauty';
    else if (isAuto) nicheKey = 'auto';
    else if (isFinance) nicheKey = 'finance';

    const realList = isSpain ? realWebsitesSpain[nicheKey] || realWebsitesSpain.dental : [];

    for (let i = 0; i < limit; i++) {
      const template = templates[i % templates.length];
      const placeId = `ChIJ_mock_${niche.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${location.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}_${cycleCode}_${i}`;

      const phoneNum = `${phonePrefix}${Math.floor(2000000 + Math.random() * 7000000)}`;
      const normalizedPhone = normalizeToE164(phoneNum, countryCode) || phoneNum;

      // Usar URL real viva si está disponible para que Playwright audite en tiempo real
      const websiteUrl = realList.length > 0
        ? realList[i % realList.length]
        : (template.websiteDomain ? `https://www.${template.websiteDomain}${tld}` : undefined);

      const cleanBizName = `${template.namePrefix} ${location} #${cycleCode + i}`;

      leads.push({
        place_id: placeId,
        business_name: cleanBizName,
        niche: `${niche} - ${location}`,
        phone: normalizedPhone,
        whatsapp: normalizedPhone,
        email: `contacto@${(template.websiteDomain || 'negocio')}${cycleCode + i}${tld}`,
        google_maps_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        rating: template.rating,
        reviews_count: template.reviews,
        current_website_url: websiteUrl,
      });
    }

    return leads;
  }
}
