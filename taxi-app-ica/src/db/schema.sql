-- ==============================================================================
-- SCHEMA OFICIAL: TAXI APP ICA (ECOSISTEMA PASAJERO, CONDUCTOR, ADMIN, PAGOS)
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
    criminal_records_approved INTEGER DEFAULT 1,
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
    payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'yape', 'wallet')),
    status TEXT DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED')),
    sos_triggered INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY(passenger_id) REFERENCES users(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(user_id)
);

-- 6. Transacciones de Pagos (Efectivo & Yape)
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

-- 7. Calificaciones y Reseñas
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

-- 8. Tarifas y Reglas Dinámicas de Ica
CREATE TABLE IF NOT EXISTS tariff_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_fare REAL NOT NULL,
    price_per_km REAL NOT NULL,
    price_per_min REAL NOT NULL,
    min_fare REAL NOT NULL,
    night_multiplier REAL DEFAULT 1.25,
    tourist_zone_surcharge REAL DEFAULT 3.50,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
