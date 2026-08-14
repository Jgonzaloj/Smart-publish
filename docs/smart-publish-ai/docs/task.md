# Tareas: Arquitectura Smart Publish AI

- [x] Crear estructura de directorios en `C:\Users\PC\Desktop\SMART\smart-publish-ai`.
- [x] Crear `/skills/SKILL-REGISTRY.md`.
- [x] Crear archivos de skill (SKILL, README, INPUTS, OUTPUTS, DEPENDENCIES, TESTS) para:
  - `00-orchestrator`
  - `01-audit`
  - `02-product`
  - `03-architecture`
  - `04-data`
  - `26-testing`
- [x] Inicializar entorno Node.js en la raíz del proyecto.
- [x] Instalar y configurar Playwright para pruebas E2E.

## Fase 2: Core & Data
- [x] Inicializar proyecto modular en `06-core` (Express + TypeScript).
- [x] Configurar Prisma ORM y volcar el modelo de datos (SKILL-04).
- [x] Crear estructura básica para `05-security` (Auth & Roles).
- [x] Crear estructura básica para `07-crm` (Leads).
- [x] Crear estructura básica para `08-catalog` (Servicios y Precios).

## Fase 3: Motor de IA y Conversación
- [x] Crear estructura para `09-conversations` a `13-followup`.
- [x] Implementar endpoint Webhook para WhatsApp (`SKILL-10`).
- [x] Implementar mock del motor conversacional con Gemini (`SKILL-09`).
- [x] Implementar agente de Triage y lógica comercial (`SKILL-11`).
- [x] Conectar Triage con Catálogo (SKILL-08) y Cotizador (`SKILL-12`).
- [x] Escribir tests de Playwright simulando mensajes de Webhooks.

## Fase 4: Inteligencia Artificial en Marketing
- [x] Crear estructura para `14-marketing` a `18-social-publish`.
- [x] Implementar orquestador de Marketing (`SKILL-14`).
- [x] Implementar Agentes Copywriter (`SKILL-15`) y Art Director (`SKILL-16`).
- [x] Implementar Agente de Control de Calidad (`SKILL-17`).
- [x] Implementar adaptador de Publicación (`SKILL-18`).

## Fase 5: SaaS, Analítica e Infraestructura
- [ ] Crear estructura para `19-rag-knowledge` a `29-gtm`.
- [ ] Implementar middleware Multitenant (`SKILL-24`).
- [ ] Implementar rutas de Billing mock con Stripe (`SKILL-23`).
- [ ] Implementar servicio de Analytics (`SKILL-21`).
- [ ] Escribir tests de Playwright de aislamiento de Tenants.
