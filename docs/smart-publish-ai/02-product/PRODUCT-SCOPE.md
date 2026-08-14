# DEFINICIÓN DEL PRODUCTO: Smart Publish AI

Este documento es generado por **SKILL-02 (PRODUCTO Y ALCANCE)**. Define exactamente qué estamos construyendo, basándose en la auditoría del sistema legacy. Todo lo que no esté en este documento, **NO SE DESARROLLA** en esta fase.

## 1. Visión
Convertir "Smart Publish" (actualmente una herramienta de programación y redes sociales) en un **AI Business Operating System (Sistema Operativo de Negocios impulsado por IA)**. Una plataforma SaaS unificada que gestione automáticamente leads, ventas, cotizaciones y seguimientos a través de canales digitales, utilizando agentes autónomos.

## 2. Propuesta de Valor
"Tus redes sociales no solo publican, ahora también venden por ti 24/7." 
Ofrecer a las empresas una IA que responde a los clientes en WhatsApp/Redes, clasifica su interés, ofrece cotizaciones precisas y da seguimiento, todo sin intervención humana directa, integrado a su catálogo y pasarelas de pago.

## 3. Usuarios
- **Dueño de Negocio (Super Admin):** Monitorea métricas, configura la IA y controla el billing.
- **Agente Humano (Operator):** Toma el control de la conversación (Human Handoff) cuando la IA no puede resolver un problema.
- **Cliente Final (End User):** Chatea con la IA a través de WhatsApp, Facebook, Instagram o Web Chat.

## 4. Casos de Uso Principales
1. **Atención y Triage:** Un cliente pregunta por un servicio en WhatsApp. La IA categoriza su intención (soporte, ventas, queja).
2. **Generación de Cotización:** Un lead calificado pide precio. La IA consulta `SKILL-08 (Catálogo)` y genera una cotización formal mediante `SKILL-12`.
3. **Follow-Up Automático:** Si el lead no responde la cotización en 24 horas, la IA le envía un mensaje de seguimiento (`SKILL-13`).
4. **Agendamiento:** Si el lead necesita una llamada, la IA revisa el calendario y agenda la cita.

## 5. MVP (Producto Mínimo Viable)
Para lanzar la primera versión de la Inteligencia Artificial Comercial:
- ✅ Integración con el backend existente (Autenticación, Usuarios, Facebook/Tiktok/LinkedIn).
- ✅ Motor de Conversación (SKILL-09) conectado a WhatsApp (SKILL-10).
- ✅ Agente de Ventas/Triage (SKILL-11).
- ✅ Catálogo de Precios (SKILL-08) y Cotizador Básico (SKILL-12).
- ✅ Dashboard simple para métricas (SKILL-21).

## 6. Funcionalidades Futuras (Fuera del MVP)
- Generación autónoma de imágenes (Director de Arte, SKILL-16).
- Campañas de marketing proactivas (Marketing IA, SKILL-14).
- Sistema RAG complejo para manuales empresariales (SKILL-19).

## 7. Límites del Producto (Reglas Estrictas)
- **La IA NUNCA inventa precios.** Siempre consulta el catálogo.
- La lógica de cotización y pagos pertenece a módulos separados, la IA solo orquesta.
- Los datos de inquilinos (SaaS / Multi-tenant) **jamás deben mezclarse** (SKILL-24).

## 8. Prioridades de Desarrollo
1. Diseñar Arquitectura de software y Base de Datos (SKILL-03 y SKILL-04).
2. Seguridad y Core (SKILL-05 y 06).
3. Motor Conversacional y WhatsApp (SKILL-09 y 10).
4. Agente de Ventas (SKILL-11).
