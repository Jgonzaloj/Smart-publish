# Diagramas de Arquitectura y Procesos (Smart Publish AI)

Basado en el ejemplo visual que me enviaste y en todo el código que hemos construido, he diseñado estos diagramas técnicos utilizando la notación `Mermaid`. 

Estos gráficos representan exactamente la estructura real de tu servidor actual.

## 1. Diagrama de Arquitectura Global (Todo lo programado)
Este diagrama muestra cómo se conectan los módulos principales de tu sistema (Core, Datos, Agentes de Ventas y Agencia de Marketing) y cómo interactúan con el mundo exterior.

```mermaid
graph TD
    %% Entidades Externas
    User((Usuarios B2C))
    Legacy[Tu Web Actual<br>Smart Publish Frontend]
    LLM((Google Gemini LLM))
    WhatsApp[Meta WhatsApp API]

    %% Sistema Core SaaS
    subgraph "Smart Publish AI (Backend SaaS)"
        Core[Core Server Express<br>SKILL-06]
        Auth[Security & Auth<br>SKILL-05]
        MultiTenant[Multitenant Isolation<br>SKILL-24]
        
        %% Capa de Datos
        subgraph "Capa de Datos"
            CRM[(CRM Leads<br>SKILL-07)]
            Catalog[(Catálogo & Precios<br>SKILL-08)]
        end

        %% Motor de Ventas 24/7
        subgraph "Agente de Ventas (Fase 3)"
            WH[WhatsApp Webhook<br>SKILL-10]
            ConvEngine[Conversation Engine<br>SKILL-09]
            Triage[Triage & Sales Agent<br>SKILL-11]
            Quote[Quotation Engine<br>SKILL-12]
        end

        %% Agencia de Marketing
        subgraph "Agencia de Marketing AI (Fase 4)"
            MktOrch[Marketing Orchestrator<br>SKILL-14]
            Copy[Copywriter<br>SKILL-15]
            Art[Art Director<br>SKILL-16]
            QA[Quality Control<br>SKILL-17]
            Pub[Social Publish Adapter<br>SKILL-18]
        end
    end

    %% Conexiones Core
    Core --> Auth
    Core --> MultiTenant
    MultiTenant --> CRM
    MultiTenant --> Catalog

    %% Conexiones Ventas
    User <-->|Mensajes| WhatsApp
    WhatsApp <--> WH
    WH --> ConvEngine
    ConvEngine <--> Triage
    Triage <-->|Consultas a Gemini| LLM
    Triage -->|Solicita Precio| Quote
    Quote -->|Lee Precios Reales| Catalog

    %% Conexiones Marketing
    Legacy -->|Crea Meta de Negocio| MktOrch
    MktOrch --> Copy
    MktOrch --> Art
    Copy <-->|Genera Texto| LLM
    Art <-->|Genera Prompt Visual| LLM
    Copy --> QA
    Art --> QA
    QA <-->|Audita| LLM
    QA -->|Si aprueba| Pub
    Pub -->|Devuelve Post| Legacy
```

---

## 2. Diagramas de Procesos
Aquí te detallo el "Paso a Paso" de cómo interactúan los agentes de Inteligencia Artificial para resolver tareas específicas sin intervención humana.

### A. Proceso de Ventas 24/7 (B2B2C)
Este es el flujo que ocurre en milisegundos cuando un cliente final escribe a tu WhatsApp de madrugada preguntando por un precio.

```mermaid
sequenceDiagram
    participant Cliente as Cliente (B2C)
    participant WA as WhatsApp API (Meta)
    participant Core as Webhook (SKILL-10)
    participant Triage as IA Triage (SKILL-11)
    participant Quote as Cotizador (SKILL-12)
    participant DB as Catálogo (SKILL-08)

    Cliente->>WA: "Hola, ¿cuánto cuesta hacer una web?"
    WA->>Core: HTTP POST /webhook
    Core-->>WA: 200 OK (Para evitar bloqueos)
    Core->>Triage: Pasa el mensaje al agente de ventas
    Triage->>Triage: Analiza intención con Gemini LLM
    Note over Triage: Detecta intención de "Cotizar"
    Triage->>Quote: Solicita cotizar servicio web
    Quote->>DB: Consulta precio exacto en Base de Datos
    DB-->>Quote: Retorna: 250 USD
    Quote-->>Triage: Genera documento de Cotización Formal
    Triage->>WA: Envía Cotización al cliente
    WA->>Cliente: Recibe mensaje con precios reales
```

### B. Proceso de Creación de Marketing
Este es el flujo cuando el dueño del negocio (B2B) entra a tu plataforma web y le pide a la Inteligencia Artificial que le arme una campaña completa.

```mermaid
sequenceDiagram
    participant Web as Tu Web Actual (Legacy)
    participant Orch as Orquestador (SKILL-14)
    participant Copy as Copywriter (SKILL-15)
    participant Art as Art Director (SKILL-16)
    participant QA as Auditor de Calidad (SKILL-17)

    Web->>Orch: "Objetivo: Promoción de Verano"
    Orch->>Copy: Generar texto persuasivo
    Copy-->>Orch: Retorna Post (con emojis y llamados a la acción)
    Orch->>Art: Entregar texto para idear imagen
    Art-->>Orch: Retorna Prompt visual para el diseñador
    Orch->>QA: Enviar Texto + Imagen para Auditoría
    Note over QA: LLM revisa reglas anti-spam y tono de marca
    alt Si NO aprueba
        QA-->>Orch: Falla. Motivo: Promesa falsa.
        Orch-->>Web: Error. Se necesita re-hacer.
    else Si SÍ aprueba
        QA-->>Orch: Aprobado
        Orch->>Web: Envía post final a tu Dashboard
        Note over Web: Queda en PENDING_APPROVAL<br>listo para publicarse en Meta.
    end
```
