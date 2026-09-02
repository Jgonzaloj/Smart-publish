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
  private generateMockLeads(
    niche: string,
    location: string,
    limit: number
  ): Array<Omit<ProspectLead, 'id' | 'status' | 'retry_count' | 'do_not_contact' | 'created_at' | 'updated_at'>> {
    const mockTemplates = [
      {
        namePrefix: 'Clínica Dental & Estética Sonrisas',
        rating: 4.8,
        reviews: 142,
        website: 'https://www.multident.pe',
        phone: '+51 987 654 321',
      },
      {
        namePrefix: 'Bufete Jurídico & Asociados Lex',
        rating: 4.6,
        reviews: 89,
        website: 'https://www.prcp.com.pe',
        phone: '+51 988 765 432',
      },
      {
        namePrefix: 'Centro Médico Especializado Sanitas Care',
        rating: 4.9,
        reviews: 210,
        website: undefined, // Sin web -> máxima oportunidad para crearle su web desde cero
        phone: '+51 989 876 543',
      },
      {
        namePrefix: 'Consultoría Financiera & Tributaria Éxito',
        rating: 4.4,
        reviews: 53,
        website: 'https://inversionesvawi.com',
        phone: '+51 990 987 654',
      },
      {
        namePrefix: 'Estudio de Arquitectura e Interiorismo Vanguardia',
        rating: 4.7,
        reviews: 97,
        website: 'https://inversionesvawi.com',
        phone: '+51 991 098 765',
      },
    ];

    const leads: Array<Omit<ProspectLead, 'id' | 'status' | 'retry_count' | 'do_not_contact' | 'created_at' | 'updated_at'>> = [];
    const timestamp = Date.now();
    const cycleCode = Math.floor(100 + Math.random() * 900);

    for (let i = 0; i < limit; i++) {
      const template = mockTemplates[i % mockTemplates.length];
      const placeId = `ChIJ_mock_${niche.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${location.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}_${cycleCode}_${i}`;

      const normalizedPhone = normalizeToE164(template.phone, config.DEFAULT_COUNTRY_CODE) || template.phone;

      leads.push({
        place_id: placeId,
        business_name: `${template.namePrefix} ${location} #${cycleCode + i}`,
        niche: `${niche} - ${location}`,
        phone: normalizedPhone,
        whatsapp: normalizedPhone,
        email: `contacto@${template.namePrefix.toLowerCase().replace(/[^a-z0-9]/g, '')}${cycleCode + i}.com`,
        google_maps_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        rating: template.rating,
        reviews_count: template.reviews,
        current_website_url: template.website,
      });
    }

    return leads;
  }
}
