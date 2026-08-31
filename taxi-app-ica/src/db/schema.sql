-- ==============================================================================
-- SCHEMA OFICIAL V2: MARKETPLACE DE MOVILIDAD TAXI ICA (PRICE INTELLIGENCE ENGINE)
-- ==============================================================================

-- 1. Usuarios (Pasajeros, Conductores, Admins)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK(role IN ('passenger', 'driver', 'admin')),
    rating_avg REAL DEFAULT 5.0,
    total_rides INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Conductores (Perfil extendido con ubicación en tiempo real y billetera)
CREATE TABLE IF NOT EXISTS drivers (
    user_id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'offline' CHECK(status IN ('offline', 'online', 'busy', 'suspended')),
    current_lat REAL DEFAULT -14.06777,
    current_lng REAL DEFAULT -75.72861,
    current_address TEXT DEFAULT 'Plaza de Armas de Ica',
    wallet_balance REAL DEFAULT 50.00,
    commission_rate REAL DEFAULT 0.10,
    last_location_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Vehículos de la flota de Ica
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    driver_id TEXT UNIQUE NOT NULL,
    plate_number TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    year INTEGER NOT NULL,
    photo_url TEXT,
    FOREIGN KEY(driver_id) REFERENCES drivers(user_id) ON DELETE CASCADE
);

-- 4. Documentos de Conductores (Acreditación ATU / Municipalidad de Ica)
CREATE TABLE IF NOT EXISTS driver_documents (
    driver_id TEXT PRIMARY KEY,
    license_number TEXT NOT NULL,
    license_expiry DATE NOT NULL,
    soat_number TEXT NOT NULL,
    soat_expiry DATE NOT NULL,
    property_card TEXT NOT NULL,
    criminal_records_approved INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
    reviewed_at DATETIME,
    review_notes TEXT,
    FOREIGN KEY(driver_id) REFERENCES drivers(user_id) ON DELETE CASCADE
);

-- 5. Viajes (Ride Requests & State Machine)
CREATE TABLE IF NOT EXISTS rides (
    id TEXT PRIMARY KEY,
    passenger_id TEXT NOT NULL,
    driver_id TEXT,
    origin_lat REAL NOT NULL,
    origin_lng REAL NOT NULL,
    origin_address TEXT NOT NULL,
    dest_lat REAL NOT NULL,
    dest_lng REAL NOT NULL,
    dest_address TEXT NOT NULL,
    distance_km REAL NOT NULL,
    duration_minutes INTEGER NOT NULL,
    estimated_fare REAL NOT NULL,
    final_fare REAL,
    negotiated_fare REAL,
    passenger_initial_offer REAL,
    payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'yape', 'plin', 'wallet')),
    status TEXT DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED')),
    sos_triggered INTEGER DEFAULT 0,
    bids_count INTEGER DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY(passenger_id) REFERENCES users(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(user_id)
);

-- 5.1 Pujas y Contraofertas Persistidas en BD con TTL (Hallazgo Crítico #3)
CREATE TABLE IF NOT EXISTS ride_bids (
    id TEXT PRIMARY KEY,
    ride_id TEXT NOT NULL,
    driver_id TEXT NOT NULL,
    offered_fare REAL NOT NULL,
    eta_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY(driver_id) REFERENCES drivers(user_id) ON DELETE CASCADE
);

-- 6. Historial de Inteligencia de Precios (Price Intelligence Engine)
CREATE TABLE IF NOT EXISTS price_intelligence_log (
    id TEXT PRIMARY KEY,
    ride_id TEXT NOT NULL,
    origin_name TEXT NOT NULL,
    dest_name TEXT NOT NULL,
    distance_km REAL NOT NULL,
    duration_minutes INTEGER NOT NULL,
    system_recommended_fare REAL NOT NULL,
    passenger_offer REAL NOT NULL,
    final_agreed_fare REAL NOT NULL,
    total_bids INTEGER DEFAULT 1,
    hour_of_day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Transacciones de Pagos (Efectivo, Yape & Plin)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    ride_id TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    commission_amount REAL NOT NULL,
    driver_earnings REAL NOT NULL,
    method TEXT NOT NULL,
    yape_code TEXT,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ride_id) REFERENCES rides(id)
);

-- 8. Calificaciones y Reseñas con Recálculo Automático (Hallazgo Alto #5)
CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    ride_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewee_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ride_id) REFERENCES rides(id)
);

-- Trigger para recalcular rating_avg en cada calificación
CREATE TRIGGER IF NOT EXISTS trg_recalculate_user_rating
AFTER INSERT ON ratings
BEGIN
  UPDATE users
  SET rating_avg = ROUND((SELECT AVG(score) FROM ratings WHERE reviewee_id = NEW.reviewee_id), 2)
  WHERE id = NEW.reviewee_id;
END;

-- 9. Motor de Tarifas Inteligente Configurable desde Admin
CREATE TABLE IF NOT EXISTS tariff_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_fare REAL DEFAULT 4.00,
    price_per_km REAL DEFAULT 1.40,
    price_per_min REAL DEFAULT 0.12,
    min_fare REAL DEFAULT 6.00,
    min_offer_pct REAL DEFAULT 0.75,
    max_offer_pct REAL DEFAULT 1.40,
    peak_morning_factor REAL DEFAULT 1.05,
    peak_evening_factor REAL DEFAULT 1.15,
    night_factor REAL DEFAULT 1.25,
    huacachina_factor REAL DEFAULT 1.20,
    demand_multiplier REAL DEFAULT 1.00,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
