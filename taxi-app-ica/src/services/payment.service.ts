import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database.js';
import { PaymentTransaction, PaymentMethod } from '../types/index.js';
import { config } from '../config/env.js';

export class PaymentService {
  private db = getDatabase();

  /**
   * Procesa la liquidación del pago al finalizar el viaje (Efectivo, Yape o Plin)
   */
  processRidePayment(rideId: string, amount: number, method: PaymentMethod, operationCode?: string): PaymentTransaction {
    const id = `pay_${uuidv4().substring(0, 8)}`;
    const commissionAmount = Math.round(amount * config.COMMISSION_RATE * 100) / 100;
    const driverEarnings = Math.round((amount - commissionAmount) * 100) / 100;

    const opCode = operationCode || (method === 'yape' ? `YAPE-${Math.floor(100000 + Math.random() * 900000)}` : method === 'plin' ? `PLIN-${Math.floor(100000 + Math.random() * 900000)}` : null);

    const stmt = this.db.prepare(`
      INSERT INTO payments (id, ride_id, amount, commission_amount, driver_earnings, method, yape_code, status)
      VALUES (@id, @rideId, @amount, @commissionAmount, @driverEarnings, @method, @yapeCode, 'completed')
    `);

    stmt.run({
      id,
      rideId,
      amount,
      commissionAmount,
      driverEarnings,
      method,
      yapeCode: opCode,
    });

    // Actualizar balance de billetera del conductor
    const ride = this.db.prepare('SELECT driver_id FROM rides WHERE id = ?').get(rideId) as any;
    if (ride?.driver_id) {
      if (method === 'cash') {
        // En efectivo, la app le descuenta la comisión de su billetera
        this.db.prepare(`
          UPDATE drivers 
          SET wallet_balance = wallet_balance - ? 
          WHERE user_id = ?
        `).run(commissionAmount, ride.driver_id);
      } else if (method === 'yape' || method === 'plin') {
        // En Yape o Plin, se acredita la ganancia neta en la billetera
        this.db.prepare(`
          UPDATE drivers 
          SET wallet_balance = wallet_balance + ? 
          WHERE user_id = ?
        `).run(driverEarnings, ride.driver_id);
      }
    }

    return {
      id,
      ride_id: rideId,
      amount,
      commission_amount: commissionAmount,
      driver_earnings: driverEarnings,
      method,
      yape_code: opCode || undefined,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Genera el payload de datos para el QR de Yape de un viaje
   */
  generateYapePaymentInfo(rideId: string, amount: number, driverPhone = '956987111', driverName = 'Mario Huamán García') {
    const yapeRefCode = `YAPE-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      method: 'yape',
      brand_color: '#742284',
      badge_text: '🟣 YAPE OFICIAL',
      ride_id: rideId,
      amount: amount.toFixed(2),
      driver_phone: driverPhone,
      driver_name: driverName,
      operation_code: yapeRefCode,
      qr_payload: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=yape://pay?phone=${driverPhone}&amount=${amount}&ref=${yapeRefCode}`,
      instructions: `Yapea S/ ${amount.toFixed(2)} al número ${driverPhone} (${driverName}) o escanea el código QR.`,
    };
  }

  /**
   * Genera el payload de datos para el QR de Plin de un viaje
   */
  generatePlinPaymentInfo(rideId: string, amount: number, driverPhone = '956987111', driverName = 'Mario Huamán García') {
    const plinRefCode = `PLIN-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      method: 'plin',
      brand_color: '#00D1D2',
      badge_text: '🔵 PLIN OFICIAL (BBVA/Scotiabank/Interbank)',
      ride_id: rideId,
      amount: amount.toFixed(2),
      driver_phone: driverPhone,
      driver_name: driverName,
      operation_code: plinRefCode,
      qr_payload: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=plin://pay?phone=${driverPhone}&amount=${amount}&ref=${plinRefCode}`,
      instructions: `Plinea S/ ${amount.toFixed(2)} al número ${driverPhone} (${driverName}) o escanea el código QR.`,
    };
  }
}
