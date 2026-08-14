# Implementación: Fase 5 (SaaS, Analítica e Infraestructura)

Hemos llegado a la fase final y más extensa de la arquitectura original. Ya tenemos un bot de ventas y una agencia de marketing funcional, pero ahora necesitamos convertir este código en un **Software as a Service (SaaS)** escalable, donde múltiples empresas puedan registrarse y tener su propia inteligencia artificial privada.

Esta fase incluye:
- **SKILL-19 (RAG / Base de Conocimiento):** Darle memoria y documentos (PDFs, FAQs) a la IA.
- **SKILL-20 (Agent Orchestration):** Un maestro de agentes para decidir cuándo usar Ventas vs Marketing.
- **SKILL-21 (Analytics):** Dashboard de métricas para los clientes.
- **SKILL-22 (Notificaciones):** Avisos por email/SMS al dueño del negocio cuando ocurre algo importante.
- **SKILL-23 (Billing/Stripe):** Cobros por suscripción al SaaS.
- **SKILL-24 (SaaS Multitenancy):** Aislamiento de datos (que un cliente no vea los leads del otro).
- **SKILL-25 (Observability):** Monitoreo de uso y costos de API (cuántos tokens gasta cada cliente).
- **SKILL-26 a 29 (DevOps):** Pruebas de carga, CI/CD, Documentación, y Go-To-Market.

## User Review Required
Esta fase es enorme e involucra infraestructura crítica. Por favor, revisa mis preguntas antes de comenzar.

## Open Questions

1. **Prioridad del SaaS:** ¿Qué te urge más validar en esta iteración? 
   - A) La arquitectura **Multitenant y Facturación (SKILL 23/24)** para asegurar que puedes cobrar y separar clientes.
   - B) La **Memoria RAG (SKILL-19)** para que el bot pueda leer PDFs propios de cada empresa.
   - C) Crear la estructura de carpetas de todos los 11 skills restantes de una vez para dejar el proyecto arquitectónicamente cerrado.

2. **Proveedor de Pagos:** Para el SKILL-23, ¿asumo la integración estándar con **Stripe** para cobrar suscripciones recurrentes, o usas otro procesador de pagos en tu país?

## Proposed Changes

### [NEW] Estructura Fase 5
#### [NEW] [19-rag-knowledge](file:///C:/Users/PC/Desktop/SMART/smart-publish-ai/19-rag-knowledge)
- Almacenamiento vectorial y búsqueda de contexto para Gemini.
#### [NEW] [21-analytics](file:///C:/Users/PC/Desktop/SMART/smart-publish-ai/21-analytics)
- `analytics.service.ts`: Recopila eventos de ventas y genera reportes.
#### [NEW] [23-billing](file:///C:/Users/PC/Desktop/SMART/smart-publish-ai/23-billing)
- `billing.routes.ts`: Control de planes (Basic/Pro) y límites de mensajes.
#### [NEW] [24-multitenant](file:///C:/Users/PC/Desktop/SMART/smart-publish-ai/24-multitenant)
- `tenant.middleware.ts`: Middleware de Express que inyecta de forma segura el ID de la empresa en cada request, garantizando el aislamiento (Tenant Isolation).

## Verification Plan
### Automated Tests
- Usaremos Playwright para asegurar que el `tenant.middleware.ts` bloquee peticiones de un usuario intentando acceder a los leads (SKILL-07) de otra empresa. Esto es vital para un SaaS.
