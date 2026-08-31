export type UserRole = 'passenger' | 'driver' | 'admin';

export type DriverStatus = 'offline' | 'online' | 'busy' | 'suspended';

export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export type RideStatus = 
  | 'REQUESTED'       // Pasajero solicitó viaje, buscando conductor
  | 'ACCEPTED'        // Conductor aceptó, yendo hacia el pasajero
  | 'ARRIVED'         // Conductor llegó al punto de recogida
  | 'IN_PROGRESS'     // Viaje iniciado hacia el destino
  | 'COMPLETED'       // Llegó al destino, pendiente de pago/calificación
  | 'PAID'            // Pago confirmado (Efectivo o Yape)
  | 'CANCELLED';      // Cancelado por pasajero o conductor

export type PaymentMethod = 'cash' | 'yape' | 'wallet';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  zone?: string;
}

export interface User {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  role: UserRole;
  rating_avg: number;
  total_rides: number;
  created_at: string;
}

export interface DriverDocument {
  license_number: string;
  license_expiry: string;
  soat_number: string;
  soat_expiry: string;
  property_card: string;
  criminal_records: boolean;
  status: DocumentStatus;
  reviewed_at?: string;
  review_notes?: string;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  plate_number: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  photo_url?: string;
}

export interface Driver extends User {
  status: DriverStatus;
  current_location: LocationPoint;
  last_location_update: string;
  vehicle?: Vehicle;
  documents?: DriverDocument;
  wallet_balance: number;
  commission_rate: number; // Ej: 0.10 (10% por carrera)
}

export interface TariffRule {
  id: string;
  name: string;
  base_fare: number;             // S/ 4.00 base
  price_per_km: number;          // S/ 1.40 por km
  price_per_min: number;         // S/ 0.12 por min
  min_fare: number;              // S/ 6.00 tarifa mínima
  min_offer_pct: number;         // 0.75 (75%)
  max_offer_pct: number;         // 1.40 (140%)
  peak_morning_factor: number;   // 1.05
  peak_evening_factor: number;   // 1.15
  night_factor: number;          // 1.25
  huacachina_factor: number;     // 1.20
  demand_multiplier: number;     // 1.00
  updated_at?: string;
}

export interface DriverBid {
  id: string;
  ride_id: string;
  driver_id: string;
  driver_name: string;
  driver_rating: number;
  driver_phone: string;
  vehicle_model: string;
  vehicle_plate: string;
  offered_fare: number;
  eta_minutes: number;
  created_at: string;
}

export interface RideRequest {
  id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_rating: number;
  driver_id?: string;
  driver?: Driver;
  origin: LocationPoint;
  destination: LocationPoint;
  distance_km: number;
  duration_minutes: number;
  estimated_fare: number;
  final_fare?: number;
  negotiated_fare?: number;
  payment_method: PaymentMethod;
  status: RideStatus;
  sos_triggered: boolean;
  bids?: DriverBid[];
  route_polyline?: string;
  created_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface PaymentTransaction {
  id: string;
  ride_id: string;
  amount: number;
  commission_amount: number;
  driver_earnings: number;
  method: PaymentMethod;
  yape_code?: string;
  yape_phone?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface RatingReview {
  id: string;
  ride_id: string;
  reviewer_id: string;
  reviewee_id: string;
  score: number; // 1 to 5
  comment?: string;
  created_at: string;
}
