import { ICA_LANDMARKS, config } from '../config/env.js';
import { LocationPoint } from '../types/index.js';

export class GeoService {
  /**
   * Calcula la distancia geodésica en kilómetros entre dos coordenadas usando la fórmula de Haversine
   */
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Estima el tiempo de viaje en minutos según el tráfico urbano de Ica (~28 km/h promedio)
   */
  estimateDurationMinutes(distanceKm: number): number {
    const averageSpeedKmH = 26; // Velocidad promedio en calles de Ica
    const hours = distanceKm / averageSpeedKmH;
    const minutes = Math.ceil(hours * 60) + 2; // 2 min de margen por semáforos
    return Math.max(3, minutes);
  }

  /**
   * Obtiene todos los lugares conocidos y puntos de referencia en Ica
   */
  getIcaLandmarks() {
    return ICA_LANDMARKS;
  }

  /**
   * Resuelve o busca un punto por nombre o aproximación
   */
  findClosestLandmark(lat: number, lng: number): LocationPoint {
    let closest = ICA_LANDMARKS[0];
    let minDistance = 9999;

    for (const landmark of ICA_LANDMARKS) {
      const dist = this.calculateDistanceKm(lat, lng, landmark.lat, landmark.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = landmark;
      }
    }

    return {
      latitude: lat,
      longitude: lng,
      address: closest.name,
      landmark: closest.name,
      zone: closest.zone,
    };
  }

  /**
   * Determina si una coordenada está dentro de la zona turística de Huacachina
   */
  isHuacachinaZone(lat: number, lng: number): boolean {
    const huacachina = ICA_LANDMARKS.find(l => l.id === 'huacachina');
    if (!huacachina) return false;
    const distance = this.calculateDistanceKm(lat, lng, huacachina.lat, huacachina.lng);
    return distance <= 1.8; // Radio de 1.8 km alrededor de la laguna
  }
}
