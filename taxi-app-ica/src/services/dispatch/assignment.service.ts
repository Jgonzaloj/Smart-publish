import { getDatabase } from '../../db/database.js';
import { DriverPresenceService } from '../driver/driver-presence.service.js';
import { TripStateService } from '../trip/trip-state.service.js';
import { RideRequest } from '../../types/index.js';

export interface AssignmentResult {
  success: boolean;
  ride?: RideRequest;
  error?: 'RIDE_NOT_FOUND' | 'ALREADY_ASSIGNED' | 'DRIVER_BUSY' | 'INVALID_TRANSITION';
  message: string;
}

export class AssignmentService {
  private db = getDatabase();
  private presenceService = new DriverPresenceService();

  /**
   * Asignación Atómica con Protección contra Condiciones de Carrera (Race Conditions)
   * Si dos conductores pulsan 'Aceptar' al mismo milisegundo, solo 1 gana atómicamente.
   */
  assignDriverAtomically(
    rideId: string,
    driverId: string,
    agreedFare: number,
    getRideFn: (id: string) => RideRequest | null
  ): AssignmentResult {
    const currentRide = getRideFn(rideId);
    if (!currentRide) {
      return { success: false, error: 'RIDE_NOT_FOUND', message: 'El viaje solicitado no existe.' };
    }

    if (currentRide.status === 'ACCEPTED') {
      if (currentRide.driver_id === driverId) {
        return { success: true, ride: currentRide, message: 'Viaje ya se encuentra asignado a este conductor.' };
      }
      return { success: false, error: 'ALREADY_ASSIGNED', message: 'El viaje ya fue tomado por otro conductor de Ica.' };
    }

    if (!TripStateService.isValidTransition(currentRide.status as any, 'ACCEPTED')) {
      return { success: false, error: 'ALREADY_ASSIGNED', message: 'El viaje ya fue tomado o cancelado por otro conductor.' };
    }

    // 1. Intentar actualizar el viaje atómicamente con condición estricta
    const rideUpdate = this.db.prepare(`
      UPDATE rides 
      SET driver_id = ?,
          estimated_fare = ?,
          negotiated_fare = ?,
          status = 'ACCEPTED',
          accepted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status IN ('REQUESTED', 'SEARCHING', 'OFFERED')
    `).run(driverId, agreedFare, agreedFare, rideId);

    if (rideUpdate.changes === 0) {
      return {
        success: false,
        error: 'ALREADY_ASSIGNED',
        message: '¡Demasiado tarde! Otro conductor de Ica aceptó esta carrera una fracción de segundo antes.',
      };
    }

    // 2. Marcar al conductor como 'busy'
    this.presenceService.setDriverStatus(driverId, 'busy');

    const updatedRide = getRideFn(rideId)!;
    return {
      success: true,
      ride: updatedRide,
      message: 'Viaje asignado con éxito de forma atómica.',
    };
  }
}
