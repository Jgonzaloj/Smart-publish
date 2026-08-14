# MODELO DE DATOS: Smart Publish AI

Este documento es generado por **SKILL-04 (DATA ARCHITECT)**. Es el único lugar autorizado para definir y alterar el modelo relacional. Si otro Skill (ej. SKILL-11) necesita almacenar datos, debe solicitar un cambio aquí.

## Infraestructura
La base de datos estará alojada en un Droplet de **DigitalOcean** (Ubuntu), utilizando PostgreSQL (recomendado por su soporte robusto para JSONB y relaciones complejas).

> [!NOTE]
> Configuración `.env` necesaria en el Backend:
> `DB_HOST=165.22.12.64`
> `DB_USER=[tu_usuario]`
> `DB_PASSWORD=[tu_password]`
> `DB_NAME=smart_publish_db`

## Esquema de Tablas (MVP)

A continuación, la definición estricta de las tablas que utilizaremos:

### 1. Autenticación y Multi-Tenancy (SKILL-05 & SKILL-24)
- **`users`**: `id`, `email`, `password_hash`, `created_at`
- **`organizations`** (Tenants): `id`, `name`, `billing_email`, `created_at`
- **`members`**: `id`, `user_id`, `organization_id`, `role_id`
- **`roles`**: `id`, `name` (SUPER_ADMIN, ADMIN, OPERATOR, AI_AGENT)

### 2. CRM y Leads (SKILL-07)
- **`customers`**: `id`, `organization_id`, `name`, `phone`, `email`
- **`leads`**: `id`, `customer_id`, `status` (NEW, CONTACTED, QUALIFIED, QUOTED, WON, LOST), `score`, `owner_id` (User/AI)
- **`lead_events`**: `id`, `lead_id`, `event_type`, `description`, `timestamp`

### 3. Catálogo y Cotizaciones (SKILL-08 & SKILL-12)
- **`service_categories`**: `id`, `organization_id`, `name`
- **`services`**: `id`, `category_id`, `name`, `description`
- **`prices`**: `id`, `service_id`, `amount`, `currency`, `conditions`
- **`quotes`**: `id`, `lead_id`, `total_amount`, `valid_until`, `status`
- **`quote_items`**: `id`, `quote_id`, `service_id`, `price_id`, `quantity`

### 4. Motor Conversacional (SKILL-09 & SKILL-10)
- **`conversations`**: `id`, `organization_id`, `customer_id`, `channel` (whatsapp, instagram, web), `status` (open, closed, bot_handled)
- **`messages`**: `id`, `conversation_id`, `sender_type` (user, bot, customer), `content`, `timestamp`

### 5. Observabilidad de IA (SKILL-25)
- **`ai_runs`**: `id`, `organization_id`, `conversation_id`, `tokens_used`, `cost`, `latency_ms`
- **`ai_tasks`**: `id`, `run_id`, `task_type` (triage, quote_generation), `status`

### 6. Billing y Suscripciones (SKILL-23)
- **`subscriptions`**: `id`, `organization_id`, `plan_id`, `status`, `current_period_end`
- **`plans`**: `id`, `name`, `price`, `limits_json`
- **`payments`**: `id`, `organization_id`, `amount`, `status`, `date`

---
*Cualquier alteración a este modelo debe ser aprobada y versionada a través del Orquestador (SKILL-00).*
