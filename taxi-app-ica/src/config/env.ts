import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || 'localhost',
  ENV: process.env.NODE_ENV || 'development',
  
  // Coordenadas centrales de Ica, Perú
  ICA_CENTER: {
    latitude: -14.06777,
    longitude: -75.72861,
    name: 'Plaza de Armas de Ica',
  },

  // Tarifas estándar en Ica (Soles)
  DEFAULT_TARIFF: {
    base_fare: 6.00,       // Tarifa base estándar urbana en Ica
    price_per_km: 1.80,    // S/ 1.80 por kilómetro
    price_per_min: 0.30,   // S/ 0.30 por minuto
    min_fare: 6.00,        // Mínimo de viaje urbano
    night_multiplier: 1.25,// 25% extra de 22:00 a 05:00
    huacachina_surcharge: 3.50, // Recargo turístico hacia el Oasis de Huacachina
  },

  // Comisión por viaje (10% para el conductor)
  COMMISSION_RATE: 0.10,

  // Rutas de almacenamiento
  DB_PATH: path.resolve(process.cwd(), 'storage', 'taxi_ica.sqlite'),
  STORAGE_DIR: path.resolve(process.cwd(), 'storage'),
};

export const ICA_LANDMARKS = [
  { id: 'plaza_armas', name: 'Plaza de Armas de Ica', lat: -14.06777, lng: -75.72861, zone: 'centro' },
  { id: 'huacachina', name: 'Laguna de Huacachina (Oasis)', lat: -14.08745, lng: -75.76332, zone: 'turistica' },
  { id: 'el_quinde', name: 'C.C. El Quinde Shopping Plaza', lat: -14.07542, lng: -75.73418, zone: 'comercial' },
  { id: 'plaza_sol', name: 'C.C. Plaza del Sol (Ica)', lat: -14.06312, lng: -75.73024, zone: 'comercial' },
  { id: 'terminal_terrestre', name: 'Terminal Terrestre de Ica (Soyuz / PerúBus)', lat: -14.07185, lng: -75.73150, zone: 'transporte' },
  { id: 'hospital_regional', name: 'Hospital Regional de Ica', lat: -14.08120, lng: -75.72650, zone: 'salud' },
  { id: 'universidad_unica', name: 'Universidad Nacional San Luis Gonzaga (UNICA)', lat: -14.06110, lng: -75.72240, zone: 'universitaria' },
  { id: 'parcona_plaza', name: 'Plaza Principal de Parcona', lat: -14.05380, lng: -75.70610, zone: 'parcona' },
  { id: 'subtanjalla_centro', name: 'Centro de Subtanjalla', lat: -14.02890, lng: -75.75120, zone: 'subtanjalla' },
  { id: 'la_tinguina', name: 'Plaza de La Tinguiña', lat: -14.04560, lng: -75.71180, zone: 'tinguina' },
  { id: 'san_joaquin', name: 'Residencial San Joaquín', lat: -14.05890, lng: -75.74230, zone: 'residencial' },
];
