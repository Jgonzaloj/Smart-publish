import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database.js';
import { GeoService } from './geo.service.js';
import { TariffService } from './tariff.service.js';
import { CandidateService } from './dispatch/candidate.service.js';
import { ScoredDriverCandidate } from './dispatch/matching.service.js';
import { AssignmentService } from './dispatch/assignment.service.js';
import { DriverPresenceService } from './driver/driver-presence.service.js';
import { TripStateService } from './trip/trip-state.service.js';
import { RideRequest, RideStatus, Driver, LocationPoint, PaymentMethod, DriverBid } from '../types/index.js';

export interface DispatchResult {
  ride: RideRequest;
  top_candidates: ScoredDriverCandidate[];
  wave_1_drivers: ScoredDriverCandidate[];
  wave_2_drivers: ScoredDriverCandidate[];
}

export class DispatchService {
  private db = getDatabase();
  private geoService = new GeoService();
  private tariffService = new TariffService();
  private candidateService = new CandidateService();

  private activeBids = new Map<string, DriverBid[]>();

  /**
   * 1. Solicita un viaje y ejecuta el Smart Dispatch Engine (Candidatos TOP con Match Score)
   */
  requestRide(data: {
    passenger_id: string;
    origin: LocationPoint;
    destination: LocationPoint;
    payment_method: PaymentMethod;
    negotiated_fare?: number;
    dispatch_mode?: 'AUTO_MATCH' | 'SELECT_DRIVER' | 'BIDDING';
  }): DispatchResult {
    const id = `ride_${uuidv4().substring(0, 8)}`;
    const fareResult = this.tariffService.calculateFare(data.origin, data.destination);

    const passenger = this.db.prepare('SELECT * FROM users WHERE id = ?').get(data.passenger_id) as any;
    const passengerName = passenger?.full_name || 'Carlos Quispe Morales';
    const passengerPhone = passenger?.phone || '956123456';
    const passengerRating = passenger?.rating_avg || 4.9;

    const estimatedFare = data.negotiated_fare || fareResult.recommended_fare;

    const stmt = this.db.prepare(`
      INSERT INTO rides (
        id, passenger_id, origin_lat, origin_lng, origin_address,
        dest_lat, dest_lng, dest_address, distance_km, duration_minutes,
        estimated_fare, negotiated_fare, payment_method, status
      ) VALUES (
        @id, @passenger_id, @origin_lat, @origin_lng, @origin_address,
        @dest_lat, @dest_lng, @dest_address, @distance_km, @duration_minutes,
        @estimated_fare, @negotiated_fare, @payment_method, 'REQUESTED'
      )
    `);

    stmt.run({
      id,
      passenger_id: data.passenger_id,
      origin_lat: data.origin.latitude,
      origin_lng: data.origin.longitude,
      origin_address: data.origin.address,
      dest_lat: data.destination.latitude,
      dest_lng: data.destination.longitude,
      dest_address: data.destination.address,
      distance_km: fareResult.distance_km,
      duration_minutes: fareResult.duration_minutes,
      estimated_fare: estimatedFare,
      negotiated_fare: data.negotiated_fare || null,
      payment_method: data.payment_method,
    });

    // Smart Dispatch: Obtener y rankear el TOP 6 de candidatos por Match Score
    const rankedCandidates = this.candidateService.findAndRankCandidates(
      data.origin.latitude,
      data.origin.longitude,
      5.0, // Radio 5km
      6
    );

    const wave1 = rankedCandidates.filter(c => c.wave === 1);
    const wave2 = rankedCandidates.filter(c => c.wave === 2);

    const ride = this.getRideById(id)!;
    return {
      ride,
      top_candidates: rankedCandidates,
      wave_1_drivers: wave1,
      wave_2_drivers: wave2,
    };
  }

  /**
   * Modo A: Auto-Match — Asigna automáticamente al conductor #1 con mayor Match Score
   */
  autoMatchBestDriver(rideId: string): RideRequest | null {
    const ride = this.getRideById(rideId);
    if (!ride || ride.status !== 'REQUESTED') return null;

    const topCandidate = this.candidateService.findAndRankCandidates(
      ride.origin.latitude,
      ride.origin.longitude,
      5.0,
      1
    )[0];

    if (!topCandidate) return null;

    return this.acceptDriverBid(rideId, topCandidate.driver.id, ride.negotiated_fare || ride.estimated_fare);
  }

  /**
   * Obtiene los candidatos rankeados para que el pasajero elija manualmente
   */
  getCandidatesForRide(rideId: string): ScoredDriverCandidate[] {
    const ride = this.getRideById(rideId);
    if (!ride) return [];

    return this.candidateService.findAndRankCandidates(
      ride.origin.latitude,
      ride.origin.longitude,
      5.0,
      4
    );
  }

  /**
   * Conductor envía una Contraoferta
   */
  submitDriverBid(rideId: string, driverId: string, offeredFare: number): DriverBid | null {
    const ride = this.getRideById(rideId);
    if (!ride || ride.status !== 'REQUESTED') return null;

    const driverRow = this.db.prepare(`
      SELECT u.id, u.full_name, u.phone, u.rating_avg,
             d.current_lat, d.current_lng,
             v.plate_number, v.brand, v.model
      FROM users u
      JOIN drivers d ON u.id = d.user_id
      LEFT JOIN vehicles v ON u.id = v.driver_id
      WHERE u.id = ?
    `).get(driverId) as any;

    if (!driverRow) return null;

    const distanceToOrigin = this.geoService.calculateDistanceKm(
      driverRow.current_lat,
      driverRow.current_lng,
      ride.origin.latitude,
      ride.origin.longitude
    );
    const etaMinutes = this.geoService.estimateDurationMinutes(distanceToOrigin);

    const bid: DriverBid = {
      id: `bid_${uuidv4().substring(0, 8)}`,
      ride_id: rideId,
      driver_id: driverId,
      driver_name: driverRow.full_name,
      driver_rating: Number(driverRow.rating_avg || 5.0),
      driver_phone: driverRow.phone,
      vehicle_model: `${driverRow.brand || 'Toyota'} ${driverRow.model || 'Yaris'}`,
      vehicle_plate: driverRow.plate_number || 'Y1A-452',
      offered_fare: offeredFare,
      eta_minutes: etaMinutes,
      created_at: new Date().toISOString(),
    };

    const currentList = this.activeBids.get(rideId) || [];
    const updatedList = currentList.filter(b => b.driver_id !== driverId);
    updatedList.push(bid);
    this.activeBids.set(rideId, updatedList);

    return bid;
  }

  getBidsForRide(rideId: string): DriverBid[] {
    return this.activeBids.get(rideId) || [];
  }

  private assignmentService = new AssignmentService();
  private presenceService = new DriverPresenceService();

  /**
   * Pasajero Acepta la Oferta de un Conductor Específico (Con Protección Atómica de Concurrencia)
   */
  acceptDriverBid(rideId: string, driverId: string, agreedFare?: number): RideRequest | null {
    const finalFare = agreedFare || this.getRideById(rideId)?.estimated_fare || 10;
    const result = this.assignmentService.assignDriverAtomically(
      rideId,
      driverId,
      finalFare,
      (id: string) => this.getRideById(id)
    );

    if (!result.success) return null;

    this.activeBids.delete(rideId);
    return result.ride || null;
  }

  acceptRide(rideId: string, driverId: string): RideRequest | null {
    return this.acceptDriverBid(rideId, driverId);
  }

  /**
   * Transición Segura de Estados con Validación Formal (TripStateService)
   */
  updateRideStatus(rideId: string, newStatus: RideStatus): RideRequest | null {
    const current = this.getRideById(rideId);
    if (!current) return null;

    // Validación formal contra transiciones inválidas (ej. COMPLETED -> SEARCHING)
    if (!TripStateService.isValidTransition(current.status as any, newStatus as any)) {
      console.warn(`Transición rechazada: ${current.status} -> ${newStatus}`);
      return null;
    }

    let updateSql = 'UPDATE rides SET status = ?';
    const params: any[] = [newStatus];

    if (newStatus === 'IN_PROGRESS') {
      updateSql += ', started_at = CURRENT_TIMESTAMP';
    } else if (newStatus === 'COMPLETED' || newStatus === 'PAID') {
      updateSql += ', completed_at = CURRENT_TIMESTAMP, final_fare = estimated_fare';
    }

    updateSql += ' WHERE id = ?';
    params.push(rideId);

    this.db.prepare(updateSql).run(...params);

    if (newStatus === 'COMPLETED' || newStatus === 'PAID' || newStatus === 'CANCELLED') {
      if (current.driver_id) {
        this.presenceService.releaseDriver(current.driver_id);
      }
    }

    return this.getRideById(rideId);
  }

  triggerSos(rideId: string): RideRequest | null {
    const stmt = this.db.prepare('UPDATE rides SET sos_triggered = 1 WHERE id = ?');
    stmt.run(rideId);
    return this.getRideById(rideId);
  }

  getRideById(rideId: string): RideRequest | null {
    const row = this.db.prepare(`
      SELECT r.*, 
             u.full_name as passenger_name, u.phone as passenger_phone, u.rating_avg as passenger_rating,
             d.status as driver_status, d.current_lat as driver_lat, d.current_lng as driver_lng, d.current_address as driver_address,
             du.full_name as driver_name, du.phone as driver_phone, du.rating_avg as driver_rating,
             v.plate_number, v.brand, v.model, v.color
      FROM rides r
      JOIN users u ON r.passenger_id = u.id
      LEFT JOIN drivers d ON r.driver_id = d.user_id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN vehicles v ON d.user_id = v.driver_id
      WHERE r.id = ?
    `).get(rideId) as any;

    if (!row) return null;

    let driver: Driver | undefined;
    if (row.driver_id) {
      driver = {
        id: row.driver_id,
        phone: row.driver_phone,
        full_name: row.driver_name,
        role: 'driver',
        rating_avg: row.driver_rating || 4.9,
        total_rides: 50,
        status: row.driver_status,
        current_location: {
          latitude: row.driver_lat,
          longitude: row.driver_lng,
          address: row.driver_address,
        },
        vehicle: {
          id: `veh_${row.driver_id}`,
          driver_id: row.driver_id,
          plate_number: row.plate_number,
          brand: row.brand,
          model: row.model,
          color: row.color,
          year: 2022,
        },
        wallet_balance: 60.0,
        commission_rate: 0.10,
        created_at: new Date().toISOString(),
      };
    }

    return {
      id: row.id,
      passenger_id: row.passenger_id,
      passenger_name: row.passenger_name,
      passenger_phone: row.passenger_phone,
      passenger_rating: row.passenger_rating,
      driver_id: row.driver_id,
      driver,
      origin: { latitude: row.origin_lat, longitude: row.origin_lng, address: row.origin_address },
      destination: { latitude: row.dest_lat, longitude: row.dest_lng, address: row.dest_address },
      distance_km: row.distance_km,
      duration_minutes: row.duration_minutes,
      estimated_fare: row.estimated_fare,
      final_fare: row.final_fare,
      negotiated_fare: row.negotiated_fare,
      payment_method: row.payment_method,
      status: row.status,
      sos_triggered: Boolean(row.sos_triggered),
      created_at: row.created_at,
      accepted_at: row.accepted_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
    };
  }

  updateDriverLocation(driverId: string, lat: number, lng: number, address = 'Ica') {
    this.db.prepare(`
      UPDATE drivers
      SET current_lat = ?, current_lng = ?, current_address = ?, last_location_update = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(lat, lng, address, driverId);
  }

  getAllRides(limit = 20): RideRequest[] {
    const rows = this.db.prepare('SELECT id FROM rides ORDER BY created_at DESC LIMIT ?').all(limit) as { id: string }[];
    return rows.map(r => this.getRideById(r.id)!).filter(Boolean);
  }

  findNearbyAvailableDrivers(lat: number, lng: number, maxRadiusKm = 5.0): Driver[] {
    return this.candidateService.findAndRankCandidates(lat, lng, maxRadiusKm, 20).map(c => c.driver);
  }

  getActiveDrivers(): Driver[] {
    return this.candidateService.findAndRankCandidates(-14.06777, -75.72861, 20.0, 50).map(c => c.driver);
  }
}
