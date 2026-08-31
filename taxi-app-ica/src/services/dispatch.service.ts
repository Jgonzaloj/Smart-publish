import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database.js';
import { GeoService } from './geo.service.js';
import { TariffService } from './tariff.service.js';
import { RideRequest, RideStatus, Driver, LocationPoint, PaymentMethod, DriverBid } from '../types/index.js';

export class DispatchService {
  private db = getDatabase();
  private geoService = new GeoService();
  private tariffService = new TariffService();

  /**
   * 1. Crea una nueva solicitud de viaje y busca conductores cercanos en Ica
   */
  requestRide(data: {
    passenger_id: string;
    origin: LocationPoint;
    destination: LocationPoint;
    payment_method: PaymentMethod;
    negotiated_fare?: number;
  }): { ride: RideRequest; nearby_drivers: Driver[] } {
    const id = `ride_${uuidv4().substring(0, 8)}`;
    const fareResult = this.tariffService.calculateFare(data.origin, data.destination);
    
    // Obtener datos del pasajero
    const passenger = this.db.prepare('SELECT * FROM users WHERE id = ?').get(data.passenger_id) as any;
    const passengerName = passenger?.full_name || 'Pasajero';
    const passengerPhone = passenger?.phone || '956000000';
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

    const nearbyDrivers = this.findNearbyAvailableDrivers(data.origin.latitude, data.origin.longitude, 6.0); // radio 6km

    const ride = this.getRideById(id)!;
    return { ride, nearby_drivers: nearbyDrivers };
  }

  /**
   * 2. Encuentra conductores online disponibles ordenados por cercanía
   */
  findNearbyAvailableDrivers(lat: number, lng: number, maxRadiusKm = 5.0): Driver[] {
    const rows = this.db.prepare(`
      SELECT u.id, u.phone, u.full_name, u.email, u.role, u.rating_avg, u.total_rides, u.created_at,
             d.status, d.current_lat, d.current_lng, d.current_address, d.wallet_balance, d.commission_rate, d.last_location_update,
             v.plate_number, v.brand, v.model, v.color, v.year, v.photo_url
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON d.user_id = v.driver_id
      WHERE d.status = 'online'
    `).all() as any[];

    const driversWithDistance = rows.map(r => {
      const distance = this.geoService.calculateDistanceKm(lat, lng, r.current_lat, r.current_lng);
      return {
        driver: {
          id: r.id,
          phone: r.phone,
          full_name: r.full_name,
          email: r.email,
          role: 'driver' as const,
          rating_avg: Number(r.rating_avg),
          total_rides: Number(r.total_rides),
          created_at: r.created_at,
          status: r.status,
          current_location: {
            latitude: Number(r.current_lat),
            longitude: Number(r.current_lng),
            address: r.current_address,
          },
          last_location_update: r.last_location_update,
          wallet_balance: Number(r.wallet_balance),
          commission_rate: Number(r.commission_rate),
          vehicle: r.plate_number ? {
            id: `veh_${r.id}`,
            driver_id: r.id,
            plate_number: r.plate_number,
            brand: r.brand,
            model: r.model,
            color: r.color,
            year: Number(r.year),
            photo_url: r.photo_url,
          } : undefined,
        },
        distance,
      };
    });

    // Filtrar por radio y ordenar por el más cercano
    return driversWithDistance
      .filter(d => d.distance <= maxRadiusKm)
      .sort((a, b) => a.distance - b.distance)
      .map(d => d.driver);
  }

  private activeBids = new Map<string, DriverBid[]>();

  /**
   * 3a. Conductor envía una Contraoferta (Modelo inDrive)
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
    // Filtrar si el conductor ya tenía una puja previa para actualizarla
    const updatedList = currentList.filter(b => b.driver_id !== driverId);
    updatedList.push(bid);
    this.activeBids.set(rideId, updatedList);

    return bid;
  }

  getBidsForRide(rideId: string): DriverBid[] {
    return this.activeBids.get(rideId) || [];
  }

  /**
   * 3b. Pasajero Acepta la Oferta de un Conductor Específico
   */
  acceptDriverBid(rideId: string, driverId: string, agreedFare?: number): RideRequest | null {
    const finalFare = agreedFare || this.getRideById(rideId)?.estimated_fare || 10;
    const stmt = this.db.prepare(`
      UPDATE rides 
      SET driver_id = @driverId, estimated_fare = @finalFare, negotiated_fare = @finalFare, status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP
      WHERE id = @rideId AND status = 'REQUESTED'
    `);
    const result = stmt.run({ rideId, driverId, finalFare });
    if (result.changes === 0) return null;

    this.activeBids.delete(rideId); // Limpiar pujas
    this.db.prepare("UPDATE drivers SET status = 'busy' WHERE user_id = ?").run(driverId);
    return this.getRideById(rideId);
  }

  /**
   * 3. Conductor Acepta el Viaje directamente con el precio del pasajero
   */
  acceptRide(rideId: string, driverId: string): RideRequest | null {
    return this.acceptDriverBid(rideId, driverId);
  }

  /**
   * 4. Transición de Estado del Viaje (State Machine)
   */
  updateRideStatus(rideId: string, newStatus: RideStatus): RideRequest | null {
    const current = this.getRideById(rideId);
    if (!current) return null;

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

    // Si terminó o se canceló, liberar al conductor
    if (['COMPLETED', 'PAID', 'CANCELLED'].includes(newStatus) && current.driver_id) {
      this.db.prepare("UPDATE drivers SET status = 'online' WHERE user_id = ?").run(current.driver_id);
    }

    return this.getRideById(rideId);
  }

  /**
   * 5. Activar Alerta SOS de Emergencia
   */
  triggerSos(rideId: string): RideRequest | null {
    this.db.prepare('UPDATE rides SET sos_triggered = 1 WHERE id = ?').run(rideId);
    return this.getRideById(rideId);
  }

  /**
   * 6. Actualizar Ubicación GPS en vivo del Conductor
   */
  updateDriverLocation(driverId: string, lat: number, lng: number, address?: string): void {
    this.db.prepare(`
      UPDATE drivers 
      SET current_lat = @lat, current_lng = @lng, current_address = COALESCE(@address, current_address), last_location_update = CURRENT_TIMESTAMP
      WHERE user_id = @driverId
    `).run({ driverId, lat, lng, address: address || null });
  }

  /**
   * 7. Obtener detalle completo del viaje
   */
  getRideById(rideId: string): RideRequest | null {
    const row = this.db.prepare(`
      SELECT r.*, 
             p.full_name as passenger_name, p.phone as passenger_phone, p.rating_avg as passenger_rating,
             d.full_name as driver_name, d.phone as driver_phone, d.rating_avg as driver_rating,
             v.plate_number, v.brand, v.model, v.color, v.year,
             dr.current_lat as driver_lat, dr.current_lng as driver_lng, dr.current_address as driver_address
      FROM rides r
      JOIN users p ON r.passenger_id = p.id
      LEFT JOIN users d ON r.driver_id = d.id
      LEFT JOIN drivers dr ON r.driver_id = dr.user_id
      LEFT JOIN vehicles v ON r.driver_id = v.driver_id
      WHERE r.id = ?
    `).get(rideId) as any;

    if (!row) return null;

    return {
      id: row.id,
      passenger_id: row.passenger_id,
      passenger_name: row.passenger_name,
      passenger_phone: row.passenger_phone,
      passenger_rating: Number(row.passenger_rating || 5.0),
      driver_id: row.driver_id || undefined,
      driver: row.driver_id ? {
        id: row.driver_id,
        phone: row.driver_phone,
        full_name: row.driver_name,
        role: 'driver',
        rating_avg: Number(row.driver_rating || 5.0),
        total_rides: 45,
        created_at: '',
        status: 'busy',
        current_location: {
          latitude: Number(row.driver_lat || row.origin_lat),
          longitude: Number(row.driver_lng || row.origin_lng),
          address: row.driver_address || '',
        },
        last_location_update: new Date().toISOString(),
        wallet_balance: 50.0,
        commission_rate: 0.10,
        vehicle: row.plate_number ? {
          id: `veh_${row.driver_id}`,
          driver_id: row.driver_id,
          plate_number: row.plate_number,
          brand: row.brand,
          model: row.model,
          color: row.color,
          year: Number(row.year || 2022),
        } : undefined,
      } : undefined,
      origin: {
        latitude: Number(row.origin_lat),
        longitude: Number(row.origin_lng),
        address: row.origin_address,
      },
      destination: {
        latitude: Number(row.dest_lat),
        longitude: Number(row.dest_lng),
        address: row.dest_address,
      },
      distance_km: Number(row.distance_km),
      duration_minutes: Number(row.duration_minutes),
      estimated_fare: Number(row.estimated_fare),
      final_fare: row.final_fare ? Number(row.final_fare) : undefined,
      negotiated_fare: row.negotiated_fare ? Number(row.negotiated_fare) : undefined,
      payment_method: row.payment_method as PaymentMethod,
      status: row.status as RideStatus,
      sos_triggered: Boolean(row.sos_triggered),
      created_at: row.created_at,
      accepted_at: row.accepted_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
    };
  }

  /**
   * Obtiene todos los viajes para el panel de administración
   */
  getAllRides(limit = 50) {
    const rows = this.db.prepare('SELECT id FROM rides ORDER BY created_at DESC LIMIT ?').all(limit) as { id: string }[];
    return rows.map(r => this.getRideById(r.id)!);
  }
}
