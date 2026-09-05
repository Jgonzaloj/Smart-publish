---
name: smart-publish-dev
description: Convenciones de código, diseño y despliegue del proyecto Smart Publish (SaaS de publicación en redes sociales con IA — frontend React/Tailwind en smart/, backend Express/TypeScript/MySQL en backend/). Usar SIEMPRE que se trabaje en cualquier archivo de este proyecto — nuevos componentes, endpoints, workers, middlewares, migraciones, o cambios de estilo — incluso si el usuario no menciona el nombre del proyecto explícitamente. También usar cuando se pregunte cómo desplegar, cómo aislar datos por tenant/workspace, o por qué algo no se refleja en producción.
---

# Smart Publish — convenciones del proyecto

SaaS de gestión y publicación automática de contenido en redes sociales, con agentes de IA (Gemini) para generar copy, campañas y respuestas de ventas por WhatsApp. Monorepo con `smart/` (frontend) y `backend/` (API).

## Antes de escribir código

1. Lee la sección relevante de este archivo (diseño si es frontend, seguridad/arquitectura si es backend).
2. Si vas a tocar autenticación, tenants, o dinero (Stripe), lee también la sección "Reglas de seguridad no negociables" — son patrones que ya se rompieron una vez en este proyecto y no deben repetirse.
3. Si el archivo que vas a editar está en la lista de "pendientes de migración" abajo, avisa al usuario que ese archivo todavía usa el sistema de diseño viejo antes de asumir que ya tiene los tokens nuevos.

## Sistema de diseño (frontend)

Paleta clara, definida en `smart/tailwind.config.js` bajo `theme.extend.colors`:

| Token | Uso |
|---|---|
| `canvas` | Fondo de página |
| `surface` / `surface-raised` | Tarjetas / estado hover |
| `borderc` | Bordes (NO usar `border`, choca con la utilidad nativa de Tailwind) |
| `text-primary` / `text-secondary` | Texto principal y secundario |
| `accent` / `accent-hover` | Azul — SOLO para el CTA principal y el nav activo, no lo repitas en cada ícono |
| `success` (teal) / `warning` (ámbar) / `danger` (rojo) | Solo para estado semántico real, nunca decorativo |
| `purple` | Reservado para features de IA |

Reglas de estilo:
- Tipografía: `Plus Jakarta Sans` para texto de interfaz, `IBM Plex Mono` (`font-mono`) solo para números grandes en tarjetas de métricas.
- Íconos: `lucide-react`.
- Tarjetas de métrica: chip de color pastel detrás del ícono usando opacidad de Tailwind, ej. `bg-success/10 text-success` — nunca un color sólido de fondo detrás de un ícono pequeño.
- Un stat en cero se muestra con chip neutro (`bg-surface-raised text-text-secondary`), no con el color semántico apagado — un contador de errores en 0 no debe verse como una alerta.
- Estados vacíos (`No hay datos...`) siempre llevan un CTA que resuelve el vacío, nunca solo un mensaje informativo.
- Router: `react-router-dom` (`Link`, `useLocation`), no `<a href>` planas para navegación interna.

### Pendientes de migración
Estas páginas **todavía usan el sistema viejo** (glassmorfismo, `glass-panel`, colores `brand-*`, variantes `dark:`), no los tokens de arriba: `Composer.tsx`, `Calendar.tsx`, `Campaigns.tsx`, `Settings.tsx`, `Billing.tsx`, `TeamSettings.tsx`, `SuperAdmin.tsx`, y todo `pages/auth/*`. Si el usuario pide un cambio ahí, aclara que es el sistema viejo antes de aplicar clases del sistema nuevo a medias.

## Reglas de seguridad no negociables (backend)

Estas ya causaron bugs reales en este proyecto — no las repitas.

1. **Nunca un fallback hardcodeado para secretos.** `JWT_SECRET`, `STRIPE_WEBHOOK_SECRET`, cualquier clave: si falta la env var, la app debe fallar fuerte (`process.exit(1)` o `throw`), nunca `process.env.X || 'valor-en-el-código'`. Si tocas login, tokens o firma de webhooks, verifica que TODOS los archivos que usan ese secreto (no solo uno) sigan este patrón — ya pasó que se corrigió en `auth.middleware.ts` pero se quedó sin corregir en `auth.controller.ts`.
2. **El workspace/tenant siempre sale del JWT verificado, nunca del header o del body.** Patrón correcto, usado en `automation.controller.ts` y `campaign.controller.ts`:
   ```typescript
   const activeWorkspaceId = (req as any).user?.workspace_id; // del JWT, vía authMiddleware
   ```
   Nunca `req.headers['x-workspace-id']` ni `req.body.workspaceId` como fuente de verdad para filtrar queries — el header solo sirve para *detectar* discrepancias, no para autorizar.
3. **Todas las queries a MySQL van parametrizadas** (`?` placeholders vía `mysql2`), nunca interpolación de strings.
4. **Webhooks de Stripe siempre verifican firma** con `stripe.webhooks.constructEvent(payload, signature, webhookSecret)` antes de procesar el evento — nunca confíes en el body sin verificar.
5. **Publicaciones generadas por IA pasan por el QA gate antes de publicarse.** Patrón en `campaign.worker.ts`: hasta 3 intentos de generación+auditoría; si no aprueba, el post se guarda como `DRAFT` para revisión humana — nunca se publica directo ni se descarta en silencio.

## Arquitectura backend

- Cola de trabajos pesados (publicar, generar campañas): `BullMQ` sobre Redis vía `services/queue.service.ts`. Cualquier tarea que dependa de una API externa lenta (Gemini, redes sociales) se encola, no se procesa dentro del request HTTP.
- `services/ai.service.ts` implementa timeout + circuit breaker básico contra Gemini (`TIMEOUT_GEMINI`); el manejo del fallback vive en el worker que lo invoca, no en el servicio.
- Rate limiting global (100 req/15min por IP) y estricto en `/api/auth` (5 intentos/15min) ya configurados en `app.ts` vía `express-rate-limit` — si agregas una ruta sensible nueva (ej. reset de password, invitación a equipo), replica el `authLimiter`, no asumas que el limiter global alcanza.
- `tenantMiddleware` (`middlewares/tenant.middleware.ts`) existe pero está subutilizado — solo lo consumen `analytics`, `ai`, `facebook` routes y `knowledge.controller.ts`. Si agregas una ruta nueva, pregunta si conviene usar este middleware o seguir el patrón manual de `req.user?.workspace_id` que usan `automation`/`campaign` — pero nunca mezcles ambos sin resolver cuál manda.
- Scripts de una sola vez (migraciones, arreglos de datos) van en `backend/scripts/migrations/` con nombre numerado y descriptivo (`001_alter_db.ts`), nunca sueltos en la raíz como `fix.js`/`patch.js`.

## Despliegue

**No hay CI/CD ni git en el servidor.** El flujo real es:
1. Cambios de código se hacen y prueban en local.
2. `npm run build` se corre **en la máquina local** (el droplet no tiene el proyecto fuente, solo sirve el `dist/` compilado — nunca sugieras correr `npm run build` dentro de la sesión SSH del droplet).
3. El contenido de `smart/dist/` (no la carpeta `dist` en sí) se sube por SFTP/FTP a `/var/www/html` en el droplet de DigitalOcean, reemplazando `index.html` y `assets/`.
4. Si un cambio "no se ve" en `redes.inversionesvawi.com`, el primer diagnóstico es siempre: ¿se corrió el build?, ¿se subió el `dist/` nuevo?, ¿hard refresh en el navegador? — en ese orden, antes de sospechar del código.

## Cuando no estés seguro

Si vas a tocar un archivo y no sabés si ya sigue estas convenciones o todavía está en el sistema viejo (diseño) o tiene el bug de secreto hardcodeado (seguridad), **léelo primero** y decilo explícitamente antes de asumir — este proyect tiene partes migradas y partes sin migrar conviviendo, y asumir mal genera parches inconsistentes.
