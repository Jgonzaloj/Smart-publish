-- =========================================================================
-- Esquema de Base de Datos para Agente de Prospección B2B v3.0
-- Compatible con SQLite local y PostgreSQL de producción
-- =========================================================================

CREATE TABLE IF NOT EXISTS prospect_leads (
    id TEXT PRIMARY KEY,
    place_id TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    niche TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    google_maps_url TEXT,
    rating REAL,
    reviews_count INTEGER,
    current_website_url TEXT,
    status TEXT DEFAULT 'INGESTED',
    retry_count INTEGER DEFAULT 0,
    do_not_contact INTEGER DEFAULT 0,
    assigned_closer TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_diagnostics (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES prospect_leads(id) ON DELETE CASCADE,
    has_website INTEGER NOT NULL,
    is_mobile_responsive INTEGER NOT NULL,
    lighthouse_perf_score INTEGER NOT NULL,
    ttfb_ms INTEGER NOT NULL,
    load_time_ms INTEGER,
    screenshot_path TEXT,
    detected_tech_stack TEXT, -- JSON string
    ai_opportunity_type TEXT,
    demo_url_deployed TEXT,
    issues_found TEXT, -- JSON array string
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES prospect_leads(id) ON DELETE CASCADE,
    opportunity_type TEXT NOT NULL,
    priority_score INTEGER NOT NULL,
    pain_points TEXT NOT NULL, -- JSON array string
    proposed_solution TEXT NOT NULL,
    whatsapp_pitch TEXT NOT NULL,
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    gate_passed INTEGER DEFAULT 0,
    gate_review_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outreach_results (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES prospect_leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
    replied INTEGER DEFAULT 0,
    converted INTEGER DEFAULT 0,
    copy_used TEXT NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS domain_health (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    bounce_rate_24h REAL DEFAULT 0,
    spam_complaints INTEGER DEFAULT 0,
    circuit_breaker_active INTEGER DEFAULT 0,
    checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Índices de alto rendimiento para búsqueda por estado de la máquina de estados
CREATE INDEX IF NOT EXISTS idx_leads_status ON prospect_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON prospect_leads(place_id);
CREATE INDEX IF NOT EXISTS idx_audits_lead_id ON audit_diagnostics(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_lead_id ON outreach_results(lead_id);
