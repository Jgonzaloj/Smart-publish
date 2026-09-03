/**
 * Utilidades de escape para prevenir XSS en HTML generado dinámicamente
 * (Skill 4 — Demo Builder). El HTML de demo se sirve públicamente sin
 * autenticación, así que cualquier dato que venga de fuentes externas
 * (Google Places, LLM, o input manual del pipeline) debe pasar por aquí
 * antes de insertarse en la plantilla.
 */

/**
 * Escapa texto para insertarlo de forma segura dentro de contenido HTML
 * o de atributos HTML (title, span, li, footer, etc.).
 */
export function escapeHtml(value: unknown): string {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapa texto para insertarlo de forma segura dentro de un string
 * literal de JavaScript embebido en un <script> (ej. 'Hola ${name}, ...').
 * Sin esto, una comilla simple en el dato rompe el string y permite
 * inyectar JS arbitrario que se ejecuta en el navegador de quien
 * visite el demo.
 */
export function escapeJsString(value: unknown): string {
  const str = String(value ?? '');
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\r?\n/g, '\\n')
    .replace(/<\/script/gi, '<\\/script');
}
