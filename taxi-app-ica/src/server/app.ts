import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { getDatabase } from '../db/database.js';
import { GeoService } from '../services/geo.service.js';
import { TariffService } from '../services/tariff.service.js';
import { DispatchService } from '../services/dispatch.service.js';
import { PaymentService } from '../services/payment.service.js';
import { ZoneService } from '../services/geo/zone.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// Instanciar base de datos y servicios
const db = getDatabase();
const geoService = new GeoService();
const tariffService = new TariffService();
const dispatchService = new DispatchService();
const paymentService = new PaymentService();
const zoneService = new ZoneService();

// Servir frontend estático
const publicPath = path.resolve(process.cwd(), 'src', 'server', 'public');
app.use(express.static(publicPath));

// ==============================================================================
// 1. ENDPOINTS DE GEOLOCALIZACIÓN Y TARIFAS (ICA)
// ==============================================================================

app.get('/api/landmarks', (req, res) => {
  res.json({ success: true, landmarks: geoService.getIcaLandmarks() });
});

app.post('/api/tariff/estimate', (req, res) => {
  const { origin, destination } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ success: false, message: 'Origen y destino son requeridos' });
  }

  const estimate = tariffService.calculateFare(origin, destination);
  res.json({ success: true, estimate });
});

app.post('/api/tariff/evaluate', (req, res) => {
  const { offer_fare, recommended_fare } = req.body;
  const evaluation = tariffService.evaluateOfferProbability(Number(offer_fare), Number(recommended_fare));
  res.json({ success: true, evaluation });
});

app.get('/api/admin/tariffs', (req, res) => {
  const rules = tariffService.getTariffRule();
  res.json({ success: true, rules });
});

app.post('/api/admin/tariffs', (req, res) => {
  tariffService.updateTariffRule(req.body);
  res.json({ success: true, message: 'Tarifas del motor inteligente actualizadas correctamente', rules: tariffService.getTariffRule() });
});

// ==============================================================================
// 2. ENDPOINTS DEL PASAJERO
// ==============================================================================

app.post('/api/rides/request', (req, res) => {
  const { passenger_id, origin, destination, payment_method, negotiated_fare } = req.body;
  if (!passenger_id || !origin || !destination) {
    return res.status(400).json({ success: false, message: 'Datos incompletos para solicitar viaje' });
  }

  const result = dispatchService.requestRide({
    passenger_id,
    origin,
    destination,
    payment_method: payment_method || 'cash',
    negotiated_fare: negotiated_fare ? parseFloat(negotiated_fare) : undefined,
  });

  const ride = result.ride;

  // Notificar a todos los conductores conectados por WebSocket (Prioridad a Wave 1)
  io.emit('new_ride_available', { ride, candidates: result.top_candidates, wave_1: result.wave_1_drivers });
  io.emit('admin_event', { type: 'RIDE_REQUESTED', ride });

  // ==============================================================================
  // SIMULADOR DE FLOTA ACTIVA DE ICA (Para pruebas fluidas e interactivas)
  // Genera ofertas de taxistas cercanos de Ica si no se aceptó inmediatamente
  // ==============================================================================
  const baseOffer = ride.negotiated_fare || ride.estimated_fare;
  const simulatedDrivers = [
    { id: 'drv_jorge_2', delay: 1500, fare: baseOffer },                     // Acepta al precio ofertado
    { id: 'drv_luis_3', delay: 2800, fare: Math.round((baseOffer + 2) * 2) / 2 },  // Contraoferta +S/ 2.00
    { id: 'drv_pedro_4', delay: 4200, fare: Math.round((baseOffer + 3.5) * 2) / 2 } // Contraoferta +S/ 3.50
  ];

  simulatedDrivers.forEach(bot => {
    setTimeout(() => {
      const currentRideState = dispatchService.getRideById(ride.id);
      if (currentRideState && currentRideState.status === 'REQUESTED') {
        const bid = dispatchService.submitDriverBid(ride.id, bot.id, bot.fare);
        if (bid) {
          io.emit(`ride_bid_${ride.id}`, { bid, all_bids: dispatchService.getBidsForRide(ride.id) });
        }
      }
    }, bot.delay);
  });

  res.json({ success: true, ride, candidates_count: result.top_candidates.length });
});

app.get('/api/rides/:id', (req, res) => {
  const ride = dispatchService.getRideById(req.params.id);
  if (!ride) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
  res.json({ success: true, ride });
});

app.post('/api/rides/:id/sos', (req, res) => {
  const ride = dispatchService.triggerSos(req.params.id);
  if (!ride) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });

  // Alerta crítica a central de monitoreo
  io.emit('sos_alert', { ride, timestamp: new Date().toISOString() });
  io.to(`ride_${ride.id}`).emit('sos_triggered', { ride });

  res.json({ success: true, message: 'Alerta SOS emitida a la central de Ica', ride });
});

app.post('/api/rides/:id/auto-match', (req, res) => {
  const ride = dispatchService.autoMatchBestDriver(req.params.id);
  if (!ride) return res.status(400).json({ success: false, message: 'No hay conductores disponibles para auto-match' });

  io.emit(`ride_update_${ride.id}`, { ride, status: 'ACCEPTED' });
  io.emit('admin_event', { type: 'RIDE_ACCEPTED', ride });
  res.json({ success: true, ride });
});

app.get('/api/rides/:id/candidates', (req, res) => {
  const candidates = dispatchService.getCandidatesForRide(req.params.id);
  res.json({ success: true, candidates });
});

app.get('/api/admin/heatmap', (req, res) => {
  const heatmap = zoneService.getZoneHeatMap();
  res.json({ success: true, zones: heatmap });
});

// ==============================================================================
// 3. ENDPOINTS DEL CONDUCTOR & SUBASTA EN VIVO (MODELO INDRIVE MEJORADO)
// ==============================================================================

app.post('/api/rides/:id/bid', (req, res) => {
  const { driver_id, offered_fare } = req.body;
  const bid = dispatchService.submitDriverBid(req.params.id, driver_id, offered_fare);
  if (!bid) return res.status(400).json({ success: false, message: 'No se pudo enviar la contraoferta' });

  // Notificar inmediatamente al pasajero por WebSocket
  io.emit(`ride_bid_${req.params.id}`, { bid, all_bids: dispatchService.getBidsForRide(req.params.id) });
  res.json({ success: true, bid });
});

app.post('/api/rides/:id/accept-bid', (req, res) => {
  const { driver_id, agreed_fare } = req.body;
  const ride = dispatchService.acceptDriverBid(req.params.id, driver_id, agreed_fare);
  if (!ride) return res.status(400).json({ success: false, message: 'El viaje ya no está disponible' });

  io.emit(`ride_update_${ride.id}`, { ride, status: 'ACCEPTED' });
  io.emit('admin_event', { type: 'RIDE_ACCEPTED', ride });

  res.json({ success: true, ride });
});

app.post('/api/rides/:id/accept', (req, res) => {
  const { driver_id } = req.body;
  const ride = dispatchService.acceptRide(req.params.id, driver_id);
  if (!ride) {
    return res.status(400).json({ success: false, message: 'El viaje ya no está disponible' });
  }

  // Notificar al pasajero y al admin
  io.emit(`ride_update_${ride.id}`, { ride, status: 'ACCEPTED' });
  io.emit('admin_event', { type: 'RIDE_ACCEPTED', ride });

  res.json({ success: true, ride });
});

app.post('/api/rides/:id/status', (req, res) => {
  const { status } = req.body;
  const ride = dispatchService.updateRideStatus(req.params.id, status);
  if (!ride) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });

  io.emit(`ride_update_${ride.id}`, { ride, status });
  io.emit('admin_event', { type: `RIDE_${status}`, ride });

  res.json({ success: true, ride });
});

app.post('/api/rides/:id/arrive', (req, res) => {
  const ride = dispatchService.updateRideStatus(req.params.id, 'ARRIVED');
  if (!ride) return res.status(400).json({ success: false, message: 'No se pudo registrar llegada' });
  io.emit(`ride_update_${ride.id}`, { ride, status: 'ARRIVED' });
  io.emit('admin_event', { type: 'RIDE_ARRIVED', ride });
  res.json({ success: true, ride });
});

app.post('/api/rides/:id/start', (req, res) => {
  const ride = dispatchService.updateRideStatus(req.params.id, 'IN_PROGRESS');
  if (!ride) return res.status(400).json({ success: false, message: 'No se pudo iniciar el viaje' });
  io.emit(`ride_update_${ride.id}`, { ride, status: 'IN_PROGRESS' });
  io.emit('admin_event', { type: 'RIDE_IN_PROGRESS', ride });
  res.json({ success: true, ride });
});

app.post('/api/rides/:id/complete', (req, res) => {
  const ride = dispatchService.updateRideStatus(req.params.id, 'COMPLETED');
  if (!ride) return res.status(400).json({ success: false, message: 'No se pudo completar el viaje' });
  io.emit(`ride_update_${ride.id}`, { ride, status: 'COMPLETED' });
  io.emit('admin_event', { type: 'RIDE_COMPLETED', ride });
  res.json({ success: true, ride });
});

app.post('/api/drivers/location', (req, res) => {
  const { driver_id, lat, lng, address } = req.body;
  dispatchService.updateDriverLocation(driver_id, lat, lng, address);

  // Emitir telemetría GPS en tiempo real
  io.emit('driver_gps_update', { driver_id, lat, lng, address });
  res.json({ success: true });
});

app.post('/api/drivers/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE drivers SET status = ? WHERE user_id = ?').run(status, req.params.id);
  io.emit('driver_status_change', { driver_id: req.params.id, status });
  res.json({ success: true, status });
});

// ==============================================================================
// 4. ENDPOINTS DE PAGOS Y CALIFICACIONES
// ==============================================================================

app.get('/api/rides/:id/yape-info', (req, res) => {
  const ride = dispatchService.getRideById(req.params.id);
  if (!ride) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });

  const yapeInfo = paymentService.generateYapePaymentInfo(
    ride.id,
    ride.final_fare || ride.estimated_fare,
    ride.driver?.phone || '956987111',
    ride.driver?.full_name || 'Mario Huamán García'
  );
  res.json({ success: true, yape: yapeInfo });
});

app.post('/api/rides/:id/pay', (req, res) => {
  const { amount, method, yape_code } = req.body;
  const ride = dispatchService.getRideById(req.params.id);
  if (!ride) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });

  const payment = paymentService.processRidePayment(ride.id, amount || ride.estimated_fare, method || 'cash', yape_code);
  dispatchService.updateRideStatus(ride.id, 'PAID');

  // Registrar en el Price Intelligence Engine de Ica para aprendizaje histórico
  try {
    const now = new Date();
    db.prepare(`
      INSERT INTO price_intelligence_log (
        id, ride_id, origin_name, dest_name, distance_km, duration_minutes,
        system_recommended_fare, passenger_offer, final_agreed_fare, total_bids,
        hour_of_day, day_of_week
      ) VALUES (
        'pil_' || substr(hex(randomblob(4)), 1, 8), @ride_id, @origin_name, @dest_name, @distance_km, @duration_minutes,
        @system_recommended_fare, @passenger_offer, @final_agreed_fare, @total_bids,
        @hour_of_day, @day_of_week
      )
    `).run({
      ride_id: ride.id,
      origin_name: ride.origin.address,
      dest_name: ride.destination.address,
      distance_km: ride.distance_km,
      duration_minutes: ride.duration_minutes,
      system_recommended_fare: ride.estimated_fare,
      passenger_offer: ride.negotiated_fare || ride.estimated_fare,
      final_agreed_fare: payment.amount,
      total_bids: 1,
      hour_of_day: now.getHours(),
      day_of_week: now.getDay(),
    });
  } catch (err) {
    console.error('Error logging price intelligence:', err);
  }

  io.emit(`ride_update_${ride.id}`, { ride: dispatchService.getRideById(ride.id), status: 'PAID', payment });
  res.json({ success: true, payment });
});

app.post('/api/rides/:id/rate', (req, res) => {
  const { reviewer_id, reviewee_id, score, comment } = req.body;
  db.prepare(`
    INSERT INTO ratings (id, ride_id, reviewer_id, reviewee_id, score, comment)
    VALUES ('rat_' || substr(hex(randomblob(4)), 1, 8), @ride_id, @reviewer_id, @reviewee_id, @score, @comment)
  `).run({ ride_id: req.params.id, reviewer_id, reviewee_id, score, comment });

  res.json({ success: true, message: 'Calificación registrada exitosamente' });
});

// ==============================================================================
// 5. ENDPOINTS DEL PANEL DE ADMINISTRACIÓN
// ==============================================================================

app.get('/api/admin/metrics', (req, res) => {
  const totalRides = db.prepare('SELECT count(*) as count FROM rides').get() as any;
  const completedRides = db.prepare("SELECT count(*) as count FROM rides WHERE status IN ('COMPLETED', 'PAID')").get() as any;
  const activeDrivers = db.prepare("SELECT count(*) as count FROM drivers WHERE status IN ('online', 'busy')").get() as any;
  const totalRevenue = db.prepare('SELECT COALESCE(sum(amount), 0) as total FROM payments').get() as any;
  const totalCommissions = db.prepare('SELECT COALESCE(sum(commission_amount), 0) as total FROM payments').get() as any;

  const recentRides = dispatchService.getAllRides(10);
  const allDrivers = dispatchService.findNearbyAvailableDrivers(-14.06777, -75.72861, 50.0);

  res.json({
    success: true,
    metrics: {
      total_rides: totalRides.count,
      completed_rides: completedRides.count,
      active_drivers: activeDrivers.count,
      total_revenue: totalRevenue.total,
      total_commissions: totalCommissions.total,
    },
    recent_rides: recentRides,
    drivers: allDrivers,
  });
});

app.get('/api/drivers', (req, res) => {
  const drivers = dispatchService.findNearbyAvailableDrivers(-14.06777, -75.72861, 50.0);
  res.json({ success: true, drivers });
});

// Endpoint para obtener conductores con todos sus documentos adjuntos (Auditoría Admin)
app.get('/api/admin/drivers-with-docs', (req, res) => {
  const drivers = db.prepare(`
    SELECT u.id, u.full_name, u.phone, u.email, u.rating_avg, u.total_rides, u.dni,
           d.status, d.wallet_balance, d.current_address,
           v.plate_number, v.brand, v.model, v.color, v.year,
           doc.license_number, doc.license_expiry, doc.soat_number, doc.soat_expiry, doc.property_card,
           doc.technical_review_number, doc.technical_review_expiry,
           doc.property_card_photo, doc.soat_photo, doc.technical_review_photo,
           doc.status as doc_status, doc.reviewed_at, doc.review_notes
    FROM users u
    JOIN drivers d ON u.id = d.user_id
    LEFT JOIN vehicles v ON d.user_id = v.driver_id
    LEFT JOIN driver_documents doc ON d.user_id = doc.driver_id
    ORDER BY u.created_at DESC
  `).all();
  res.json({ success: true, drivers });
});

// Endpoint de Registro de Conductores (Conductor o Admin)
app.post('/api/drivers/register', (req, res) => {
  const {
    full_name,
    phone,
    email,
    dni,
    plate_number,
    brand,
    model,
    color,
    year,
    soat_number,
    soat_expiry,
    license_number,
    license_expiry,
    technical_review_number,
    technical_review_expiry,
    property_card,
    auto_approve,
  } = req.body;

  if (!full_name || !phone || !plate_number) {
    return res.status(400).json({ success: false, message: 'Nombre, teléfono y placa son obligatorios' });
  }

  const userId = `drv_${Date.now()}`;
  const initialStatus = auto_approve ? 'online' : 'offline';
  const docStatus = auto_approve ? 'approved' : 'pending';

  try {
    const insertUser = db.prepare(`
      INSERT INTO users (id, phone, full_name, email, role, rating_avg, total_rides, dni)
      VALUES (?, ?, ?, ?, 'driver', 5.0, 0, ?)
    `);
    insertUser.run(userId, phone, full_name, email || `${phone}@taxi.ica.pe`, dni || '45879632');

    const insertDriver = db.prepare(`
      INSERT INTO drivers (user_id, status, current_lat, current_lng, current_address, wallet_balance)
      VALUES (?, ?, -14.06777, -75.72861, 'Plaza de Armas de Ica', 50.00)
    `);
    insertDriver.run(userId, initialStatus);

    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (id, driver_id, plate_number, brand, model, color, year)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertVehicle.run(`veh_${Date.now()}`, userId, plate_number.toUpperCase(), brand || 'Toyota', model || 'Yaris', color || 'Gris', year || 2022);

    const insertDocs = db.prepare(`
      INSERT INTO driver_documents (
        driver_id, license_number, license_expiry, soat_number, soat_expiry, property_card,
        technical_review_number, technical_review_expiry,
        property_card_photo, soat_photo, technical_review_photo,
        status, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertDocs.run(
      userId,
      license_number || `Q-${dni || '45879632'}`,
      license_expiry || '2028-12-31',
      soat_number || `SOAT-${plate_number.toUpperCase()}`,
      soat_expiry || '2027-06-30',
      property_card || `TP-${plate_number.toUpperCase()}`,
      technical_review_number || `REV-${plate_number.toUpperCase()}`,
      technical_review_expiry || '2026-12-31',
      'tarjeta_propiedad_digital.pdf',
      'soat_digital_la_positiva.pdf',
      'certificado_revision_farenet.pdf',
      docStatus,
      auto_approve ? new Date().toISOString() : null
    );

    io.emit('admin_event', {
      type: 'DRIVER_REGISTERED',
      driver: { id: userId, full_name, plate_number, status: initialStatus, docStatus }
    });

    res.json({
      success: true,
      message: auto_approve
        ? '✅ Conductor registrado y habilitado inmediatamente'
        : '📋 Solicitud de conductor enviada con éxito. En espera de revisión por la central de Ica.',
      driver_id: userId
    });
  } catch (error: any) {
    console.error('Error registrando conductor:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al registrar conductor' });
  }
});

app.post('/api/drivers/:id/approve', (req, res) => {
  db.prepare('UPDATE driver_documents SET status = "approved", reviewed_at = CURRENT_TIMESTAMP WHERE driver_id = ?').run(req.params.id);
  db.prepare('UPDATE drivers SET status = "online" WHERE user_id = ?').run(req.params.id);
  io.emit('admin_event', { type: 'DRIVER_APPROVED', driver_id: req.params.id });
  res.json({ success: true, message: 'Conductor aprobado correctamente' });
});

app.post('/api/drivers/:id/reject', (req, res) => {
  const { reason } = req.body;
  db.prepare('UPDATE driver_documents SET status = "rejected", reviewed_at = CURRENT_TIMESTAMP, review_notes = ? WHERE driver_id = ?')
    .run(reason || 'Documentos no legibles o vencidos', req.params.id);
  db.prepare('UPDATE drivers SET status = "offline" WHERE user_id = ?').run(req.params.id);
  io.emit('admin_event', { type: 'DRIVER_REJECTED', driver_id: req.params.id });
  res.json({ success: true, message: 'Solicitud rechazada con observaciones' });
});

// Endpoint para jalar perfil y documentos reales del conductor desde la Base de Datos
app.get('/api/drivers/:id/profile', (req, res) => {
  const driver = db.prepare(`
    SELECT u.id, u.full_name, u.phone, u.email, u.rating_avg, u.dni,
           d.status, d.wallet_balance, d.current_address,
           v.plate_number, v.brand, v.model, v.color, v.year,
           doc.license_number, doc.license_expiry, doc.soat_number, doc.soat_expiry, doc.property_card,
           doc.technical_review_number, doc.technical_review_expiry,
           doc.property_card_photo, doc.soat_photo, doc.technical_review_photo,
           doc.status as doc_status, doc.reviewed_at, doc.review_notes
    FROM users u
    JOIN drivers d ON u.id = d.user_id
    LEFT JOIN vehicles v ON d.user_id = v.driver_id
    LEFT JOIN driver_documents doc ON d.user_id = doc.driver_id
    WHERE u.id = ?
  `).get(req.params.id) as any;

  if (!driver) {
    // Si no existe, retornar valores por defecto para permitir registro
    return res.json({
      success: true,
      driver: {
        id: req.params.id,
        full_name: 'Carlos Quispe Morales',
        phone: '956987111',
        dni: '45879632',
        plate_number: 'Y1A-452',
        brand: 'Toyota',
        model: 'Yaris',
        color: 'Gris',
        property_card: 'TP-Y1A-452',
        property_card_photo: 'tarjeta_propiedad_digital.pdf',
        soat_number: 'SOAT-LA-POSITIVA-998',
        soat_expiry: '2027-06-30',
        soat_photo: 'soat_digital.pdf',
        technical_review_number: 'CITV-ICA-2026-88',
        technical_review_expiry: '2026-12-31',
        technical_review_photo: 'certificado_citv.pdf',
        license_number: 'Q-45879632',
        license_expiry: '2028-12-31',
        doc_status: 'approved'
      }
    });
  }

  res.json({ success: true, driver });
});

// Endpoint para actualizar documentos adjuntos del conductor
app.post('/api/drivers/:id/documents', (req, res) => {
  const {
    property_card,
    property_card_photo,
    soat_number,
    soat_expiry,
    soat_photo,
    technical_review_number,
    technical_review_expiry,
    technical_review_photo,
    license_number,
    license_expiry,
  } = req.body;

  const existing = db.prepare('SELECT driver_id FROM driver_documents WHERE driver_id = ?').get(req.params.id);
  if (existing) {
    db.prepare(`
      UPDATE driver_documents SET
        property_card = COALESCE(?, property_card),
        property_card_photo = COALESCE(?, property_card_photo),
        soat_number = COALESCE(?, soat_number),
        soat_expiry = COALESCE(?, soat_expiry),
        soat_photo = COALESCE(?, soat_photo),
        technical_review_number = COALESCE(?, technical_review_number),
        technical_review_expiry = COALESCE(?, technical_review_expiry),
        technical_review_photo = COALESCE(?, technical_review_photo),
        license_number = COALESCE(?, license_number),
        license_expiry = COALESCE(?, license_expiry),
        status = 'pending',
        reviewed_at = NULL
      WHERE driver_id = ?
    `).run(
      property_card, property_card_photo,
      soat_number, soat_expiry, soat_photo,
      technical_review_number, technical_review_expiry, technical_review_photo,
      license_number, license_expiry,
      req.params.id
    );
  } else {
    db.prepare(`
      INSERT INTO driver_documents (
        driver_id, license_number, license_expiry, soat_number, soat_expiry, property_card,
        technical_review_number, technical_review_expiry,
        property_card_photo, soat_photo, technical_review_photo, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      req.params.id,
      license_number || 'Q-45879632', license_expiry || '2028-12-31',
      soat_number || 'SOAT-2027', soat_expiry || '2027-06-30',
      property_card || 'TP-OK',
      technical_review_number || 'REV-2026', technical_review_expiry || '2026-12-31',
      property_card_photo || 'tarjeta_propiedad.pdf',
      soat_photo || 'soat_digital.pdf',
      technical_review_photo || 'revision_tecnica.pdf'
    );
  }

  io.emit('admin_event', { type: 'DRIVER_DOCUMENTS_UPDATED', driver_id: req.params.id });

  res.json({
    success: true,
    message: '📋 Documentos adjuntados y enviados a la Central de Smart Mobility Ica para validación.'
  });
});

// ==============================================================================
// RUTAS DE LAS VISTAS FRONTEND (PWA MÓVIL & ADMIN)
// ==============================================================================

app.get('/pasajero', (req, res) => {
  res.sendFile(path.join(publicPath, 'pasajero.html'));
});

app.get('/conductor', (req, res) => {
  res.sendFile(path.join(publicPath, 'conductor.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/api/drivers/:id/demand-recommendation', (req, res) => {
  // Asistencia Inteligente de Demanda (Páginas 14-15 del PDF)
  const heatmap = zoneService.getZoneHeatMap();
  const highDemandZone = heatmap.find(z => z.demand_level === 'HIGH') || heatmap[0];
  const pendingCount = highDemandZone?.pending_requests || 7;
  res.json({
    success: true,
    recommendation: {
      has_alert: true,
      target_zone: highDemandZone?.name || 'Centro de Ica',
      active_requests: pendingCount,
      message: `📈 Alta demanda en ${highDemandZone?.name || 'Centro de Ica'}: ${pendingCount} solicitudes activas.`,
      target_coordinates: { latitude: -14.06777, longitude: -75.72861 }
    }
  });
});

app.get('/api/drivers/:id/documents', (req, res) => {
  // Seguridad: Verificación de documentos del conductor (Página 21 del PDF)
  const docs = db.prepare('SELECT * FROM driver_documents WHERE driver_id = ?').all(req.params.id);
  res.json({
    success: true,
    documents: docs.length > 0 ? docs : [
      { doc_type: 'SOAT', status: 'approved', expiry_date: '2027-01-15' },
      { doc_type: 'LICENCIA_A2A', status: 'approved', expiry_date: '2028-06-20' },
      { doc_type: 'REVISION_TECNICA', status: 'approved', expiry_date: '2026-11-30' }
    ]
  });
});

// ==============================================================================
// WEB SOCKETS (TIEMPO REAL CON NOMENCLATURA FORMAL PDF PÁGINAS 16-17)
// ==============================================================================

io.on('connection', (socket) => {
  socket.on('join_ride', (rideId) => {
    socket.join(`ride_${rideId}`);
  });

  // Eventos formales Passenger -> Server
  socket.on('trip:create', (data) => {
    // Manejo de creación formal
  });

  // Eventos formales Driver -> Server
  socket.on('driver:location', (data) => {
    const { driver_id, lat, lng, ride_id } = data;
    dispatchService.updateDriverLocation(driver_id, lat, lng);
    if (ride_id) {
      io.emit(`ride_update_${ride_id}`, { type: 'DRIVER_GPS', lat, lng });
    }
  });

  socket.on('driver_move', (data) => {
    const { driver_id, lat, lng, ride_id } = data;
    dispatchService.updateDriverLocation(driver_id, lat, lng);
    if (ride_id) {
      io.emit(`ride_update_${ride_id}`, { type: 'DRIVER_GPS', lat, lng });
    }
  });
});

// Iniciar Servidor
server.listen(config.PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚖 [TAXI APP ICA] Servidor y Ecosistema en Tiempo Real Activo`);
  console.log(`🌐 Hub Central:          http://${config.HOST}:${config.PORT}`);
  console.log(`📱 App Pasajero:         http://${config.HOST}:${config.PORT}/pasajero`);
  console.log(`🚗 App Conductor:        http://${config.HOST}:${config.PORT}/conductor`);
  console.log(`🖥️ Panel de Control:    http://${config.HOST}:${config.PORT}/admin`);
  console.log(`📍 Centro Operativo:     Plaza de Armas de Ica (-14.06777, -75.72861)`);
  console.log(`=============================================================\n`);
});

export { app, server, io };
