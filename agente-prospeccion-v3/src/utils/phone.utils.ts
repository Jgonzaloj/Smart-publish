import { config } from '../config/env.js';

/**
 * Normaliza cualquier formato telefónico ingresado al estándar internacional E.164 (+[código][número]).
 * 
 * Ejemplos:
 * - "987 654 321" con default "+51" -> "+51987654321"
 * - "+34 612 34 56 78" -> "+34612345678"
 * - "(01) 456-7890" con default "+51" -> "+5114567890"
 * - "+1 (555) 123-4567" -> "+15551234567"
 * - "51987654321" -> "+51987654321"
 */
export function normalizeToE164(rawPhone?: string | null, fallbackCountryCode = config.DEFAULT_COUNTRY_CODE): string | undefined {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return undefined;
  }

  const trimmed = rawPhone.trim();
  if (!trimmed) return undefined;

  // Si ya empieza con '+'
  const hasPlus = trimmed.startsWith('+');

  // Eliminar todo lo que no sea dígito
  let digits = trimmed.replace(/\D/g, '');

  if (!digits || digits.length < 6) {
    return undefined;
  }

  const cleanCountryCode = (fallbackCountryCode || '+51').replace(/\D/g, '');

  let e164 = '';

  if (hasPlus) {
    // Si tenía +, respetamos el código internacional ya presente
    e164 = `+${digits}`;
  } else {
    // Casos comunes de prefijo ya incluido sin el signo '+':
    // Ej: 51987654321 (Perú), 34612345678 (España), 5219876543210 (México)
    if (cleanCountryCode && digits.startsWith(cleanCountryCode) && digits.length >= cleanCountryCode.length + 8) {
      e164 = `+${digits}`;
    } else {
      // Es un número local sin prefijo internacional
      // Quitar ceros a la izquierda típicos de llamadas locales
      digits = digits.replace(/^0+/, '');
      e164 = `+${cleanCountryCode}${digits}`;
    }
  }

  // Validación E.164: debe tener el '+' y entre 8 y 15 dígitos según la recomendación ITU-T E.164
  const digitsOnly = e164.replace(/\D/g, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return undefined;
  }

  return e164;
}
