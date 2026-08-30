---
name: taxi-app-ica
description: >
  Guía completa y ya fundamentada para desarrollar el aplicativo de taxis en Ica (app de pasajeros, app de conductores y panel de administración), incluyendo stack tecnológico decidido, arquitectura, funciones exactas por módulo, y el proceso de desarrollo paso a paso. Usar SIEMPRE que el usuario pida crear, continuar, programar, diseñar, cotizar o planificar cualquier parte de "la app de taxi", "el aplicativo de taxi para Ica", "Taxi Ica" o proyectos equivalentes de transporte tipo Uber/inDrive local, incluso si solo menciona una parte (ej. "hazme la pantalla de login del conductor", "arma el backend", "diseña la base de datos", "cotización del proyecto"). NO volver a preguntar por contexto de mercado, stack tecnológico ni funciones, ya están decididos en este skill. Consultar los archivos de references/ para el detalle de cada módulo antes de escribir código o entregables.
---

# App de Taxi para Ica — Skill de Desarrollo

Este skill contiene TODAS las decisiones de producto ya tomadas para este proyecto. El objetivo es que, al recibir cualquier pedido de desarrollo, Claude NO vuelva a preguntar "¿qué stack usamos?" o "¿qué funciones debe tener?" — eso ya está resuelto aquí. Solo se debe preguntar por detalles de implementación muy específicos que no estén cubiertos (ej. paleta de colores exacta, nombre comercial final).

## Cómo usar este skill

1. Identifica qué parte del proyecto se está pidiendo (pasajero, conductor, admin, backend, base de datos, cotización, pitch, etc.)
2. Lee el archivo de `references/` correspondiente ANTES de generar código o documentos.
3. Sigue el proceso de desarrollo por fases (abajo) para saber en qué orden construir las cosas y qué producir en cada fase.
4. Genera el entregable (código, documento, diagrama, presentación) usando las skills de creación de archivos correspondientes (docx, pptx, xlsx, frontend-design, etc.) cuando aplique.
5. Si el usuario no especifica en qué fase está, asume que quiere avanzar la siguiente fase pendiente y dilo explícitamente ("Como no tengo el backend aún, empezamos por la Fase 1: base de datos y auth").

## Decisiones de producto ya cerradas (no volver a preguntar)

- **Mercado objetivo:** Ica, Perú. Mercado de taxi por app en expansión (proyección ~US$0.66 mil millones para Perú en 2029). Referentes locales: Taxi Astro, Icataxi (acreditado ante ATU en Lima).
- **Modelo de negocio:** Marketplace de viajes bajo demanda con 3 productos (pasajero, conductor, admin), comisión por viaje al conductor.
- **Diferenciador competitivo:** Posibilidad de negociación de tarifa estilo inDrive (opcional/activable), pago mixto (efectivo + Yape + billetera in-app), foco fuerte en seguridad (botón de pánico, compartir ubicación).
- **Stack tecnológico decidido:** Flutter (apps móviles pasajero/conductor, un solo código para iOS/Android) + Firebase (Auth, Firestore/Realtime DB, Cloud Functions, Cloud Messaging) + Google Maps Platform (geolocalización, rutas, distancia/tiempo). Panel admin: web app (React) contra el mismo backend Firebase o API intermedia en Node.js si se requiere lógica de negocio más compleja (tarifas dinámicas, reportes).
- **Regulación:** Diseñar el registro de conductores/vehículos pensando en una futura acreditación tipo ATU (documentos: licencia, SOAT, tarjeta de propiedad, antecedentes).
- Detalle completo de justificación de mercado: `references/contexto-mercado.md`
- Detalle completo de stack y arquitectura: `references/stack-tecnologico.md`

## Los 3 productos del sistema

| Producto | Usuario | Detalle completo |
|---|---|---|
| App Pasajero | Cliente final que pide viajes | `references/app-pasajero.md` |
| App Conductor | Conductor afiliado | `references/app-conductor.md` |
| Panel Admin | Operador/dueño del negocio | `references/panel-admin.md` |

Cada archivo trae: pantallas exactas, funciones, modelo de datos sugerido, y notas de UX específicas para el mercado de Ica.

## Proceso de desarrollo por fases (seguir este orden salvo indicación contraria)

**Fase 0 — Fundamentos (ya hecho, no repetir)**
Investigación de mercado, definición de producto, stack. Ver references/contexto-mercado.md si se necesita justificar algo ante inversionistas o autoridades.

**Fase 1 — Backend y datos**
- Configurar proyecto Firebase (Auth, Firestore, Storage, Cloud Functions, Cloud Messaging).
- Definir colecciones: `usuarios`, `conductores`, `vehiculos`, `viajes`, `tarifas`, `calificaciones`, `pagos`, `promociones`.
- Reglas de seguridad de Firestore por rol (pasajero/conductor/admin).
- Cloud Functions clave: asignación de conductor más cercano, cálculo de tarifa, triggers de notificación push.

**Fase 2 — App Pasajero (MVP)**
Registro/login → mapa con geolocalización → solicitar viaje → ver conductor asignado en tiempo real → pagar → calificar. Ver `references/app-pasajero.md` para el detalle de cada pantalla.

**Fase 3 — App Conductor (MVP)**
Registro con validación de documentos → recibir y aceptar solicitudes → navegación → iniciar/finalizar viaje → ver ganancias. Ver `references/app-conductor.md`.

**Fase 4 — Panel de Administración**
Gestión de flota, tarifas dinámicas y promociones, monitoreo en mapa en tiempo real, reportes. Ver `references/panel-admin.md`.

**Fase 5 — Funciones adicionales / diferenciadoras**
Botón de pánico, compartir ubicación en tiempo real, negociación de tarifa estilo inDrive, soporte in-app, y (a mediano plazo) paquetería/fletes.

**Fase 6 — QA, piloto y lanzamiento**
Pruebas con conductores piloto en una zona de Ica, ajuste de tarifas base según data real, publicación en Play Store / App Store, plan de adquisición de conductores (el lado de oferta primero, siempre, en modelos de marketplace de transporte).

## Al generar entregables

- **Código (Flutter/Firebase/React):** créalo directamente como archivos de proyecto reales, no pseudo-código, salvo que el usuario pida solo un esquema conceptual.
- **Documentos de negocio (propuesta, cotización, pitch):** usa las skills docx/pptx/xlsx según el formato pedido; no repitas la investigación de mercado completa, resume y cita solo lo relevante desde `references/contexto-mercado.md`.
- **Diagramas de arquitectura o modelo de datos:** usa mermaid en un artifact o markdown.
- Si el pedido es ambiguo entre "código real" y "solo el esquema/documento", asume documento/esquema la primera vez que se toca un módulo, y código real cuando ya se haya acordado el esquema o el usuario diga "empecemos a programar".
