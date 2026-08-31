export type TripState =
  | 'REQUESTED'
  | 'SEARCHING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'ARRIVED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'TRIP_STARTED'
  | 'COMPLETED'
  | 'TRIP_COMPLETED'
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_DRIVER';

export class TripStateService {
  private static readonly VALID_TRANSITIONS: Record<TripState, TripState[]> = {
    REQUESTED: ['SEARCHING', 'OFFERED', 'ACCEPTED', 'CANCELLED', 'EXPIRED', 'NO_DRIVER'],
    SEARCHING: ['OFFERED', 'ACCEPTED', 'CANCELLED', 'EXPIRED', 'NO_DRIVER'],
    OFFERED: ['ACCEPTED', 'SEARCHING', 'CANCELLED', 'EXPIRED', 'NO_DRIVER'],
    ACCEPTED: ['DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'ARRIVED', 'IN_PROGRESS', 'CANCELLED'],
    ARRIVED: ['IN_PROGRESS', 'TRIP_STARTED', 'CANCELLED'],
    DRIVER_ARRIVING: ['DRIVER_ARRIVED', 'ARRIVED', 'CANCELLED'],
    DRIVER_ARRIVED: ['TRIP_STARTED', 'IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'TRIP_COMPLETED', 'CANCELLED'],
    TRIP_STARTED: ['TRIP_COMPLETED', 'COMPLETED', 'CANCELLED'],
    COMPLETED: ['PAID'],
    TRIP_COMPLETED: ['PAID'],
    PAID: [], // Estado terminal
    CANCELLED: [], // Estado terminal
    EXPIRED: [], // Estado terminal
    NO_DRIVER: ['SEARCHING', 'CANCELLED'], // Puede reintentar búsqueda
  };

  /**
   * Valida si una transición de estado es legal en el ciclo de vida del viaje
   */
  static isValidTransition(current: TripState, target: TripState): boolean {
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  /**
   * Ejecuta la transición de forma segura o lanza error descriptivo
   */
  static assertTransition(current: TripState, target: TripState): void {
    if (!this.isValidTransition(current, target)) {
      throw new Error(`Transición de estado inválida: No se puede cambiar de '${current}' a '${target}'`);
    }
  }
}
