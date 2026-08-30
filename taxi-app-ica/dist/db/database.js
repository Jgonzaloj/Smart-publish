import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let dbInstance = null;
export function getDatabase() {
    if (!dbInstance) {
        if (!fs.existsSync(config.STORAGE_DIR)) {
            fs.mkdirSync(config.STORAGE_DIR, { recursive: true });
        }
        dbInstance = new Database(config.DB_PATH);
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('foreign_keys = ON');
        initSchema(dbInstance);
        seedInitialData(dbInstance);
    }
    return dbInstance;
}
function initSchema(db) {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const srcSchemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
    const targetPath = fs.existsSync(schemaPath) ? schemaPath : srcSchemaPath;
    if (fs.existsSync(targetPath)) {
        const schemaSql = fs.readFileSync(targetPath, 'utf8');
        db.exec(schemaSql);
    }
}
function seedInitialData(db) {
    // 1. Sembrar Tarifas de Ica si no existen
    const tariffCount = db.prepare('SELECT count(*) as count FROM tariff_rules').get();
    if (tariffCount.count === 0) {
        db.prepare(`
      INSERT INTO tariff_rules (id, name, base_fare, price_per_km, price_per_min, min_fare, night_multiplier, tourist_zone_surcharge)
      VALUES ('tariff_ica_standard', 'Tarifa Urbana Estándar Ica', @base_fare, @price_per_km, @price_per_min, @min_fare, @night_multiplier, @huacachina_surcharge)
    `).run(config.DEFAULT_TARIFF);
    }
    // 2. Sembrar Pasajero de Prueba
    const passengerCount = db.prepare("SELECT count(*) as count FROM users WHERE role = 'passenger'").get();
    if (passengerCount.count === 0) {
        db.prepare(`
      INSERT INTO users (id, phone, full_name, email, role, rating_avg, total_rides)
      VALUES ('usr_passenger_demo', '956123456', 'Carlos Quispe Morales', 'carlos.ica@gmail.com', 'passenger', 4.9, 12)
    `).run();
    }
    // 3. Sembrar Conductores de la Flota de Ica (Distribuidos en puntos estratégicos)
    const driverCount = db.prepare('SELECT count(*) as count FROM drivers').get();
    if (driverCount.count === 0) {
        const seedDrivers = [
            {
                id: 'drv_mario_1',
                phone: '956987111',
                name: 'Mario Huamán García',
                email: 'mario.taxi@ica.pe',
                lat: -14.06820,
                lng: -75.72910,
                address: 'Cerca a Plaza de Armas de Ica',
                plate: 'Y1A-452',
                brand: 'Toyota',
                model: 'Yaris',
                color: 'Gris Plata',
                year: 2022,
                rating: 4.95,
            },
            {
                id: 'drv_jorge_2',
                phone: '956987222',
                name: 'Jorge Ramos Mendoza',
                email: 'jorge.taxi@ica.pe',
                lat: -14.07480,
                lng: -75.73390,
                address: 'Av. Los Maestros (Cerca El Quinde)',
                plate: 'Y2B-891',
                brand: 'Hyundai',
                model: 'Accent',
                color: 'Blanco',
                year: 2021,
                rating: 4.88,
            },
            {
                id: 'drv_pedro_3',
                phone: '956987333',
                name: 'Pedro Espinoza Palomino',
                email: 'pedro.taxi@ica.pe',
                lat: -14.08500,
                lng: -75.75950,
                address: 'Camino a Huacachina',
                plate: 'Y3C-104',
                brand: 'Kia',
                model: 'Rio Sedán',
                color: 'Negro',
                year: 2023,
                rating: 5.00,
            },
            {
                id: 'drv_raul_4',
                phone: '956987444',
                name: 'Raúl Medina Canales',
                email: 'raul.taxi@ica.pe',
                lat: -14.05420,
                lng: -75.70890,
                address: 'Av. Pachacútec (Parcona)',
                plate: 'Y4D-553',
                brand: 'Nissan',
                model: 'Versa',
                color: 'Azul Noche',
                year: 2020,
                rating: 4.75,
            }
        ];
        for (const d of seedDrivers) {
            // Usuario
            db.prepare(`
        INSERT OR IGNORE INTO users (id, phone, full_name, email, role, rating_avg, total_rides)
        VALUES (@id, @phone, @name, @email, 'driver', @rating, 45)
      `).run(d);
            // Conductor
            db.prepare(`
        INSERT OR IGNORE INTO drivers (user_id, status, current_lat, current_lng, current_address, wallet_balance, commission_rate)
        VALUES (@id, 'online', @lat, @lng, @address, 65.50, 0.10)
      `).run(d);
            // Vehículo
            db.prepare(`
        INSERT OR IGNORE INTO vehicles (id, driver_id, plate_number, brand, model, color, year)
        VALUES ('veh_' || @id, @id, @plate, @brand, @model, @color, @year)
      `).run(d);
            // Documentos Aprobados
            db.prepare(`
        INSERT OR IGNORE INTO driver_documents (driver_id, license_number, license_expiry, soat_number, soat_expiry, property_card, status)
        VALUES (@id, 'Q' || @phone, '2028-12-31', 'SOAT-POSITIVA-' || @plate, '2027-06-30', 'TP-ICA-' || @plate, 'approved')
      `).run(d);
        }
    }
    // 4. Sembrar Administrador
    db.prepare(`
    INSERT OR IGNORE INTO users (id, phone, full_name, email, role, rating_avg, total_rides)
    VALUES ('usr_admin_ica', '956000001', 'Administrador Central Ica', 'admin@taxiica.pe', 'admin', 5.0, 0)
  `).run();
}
