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
    negotiated_fare,
  });

  // Notificar por WebSockets a todos los conductores y al panel admin
  io.emit('new_ride_available', { ride: result.ride });
  io.emit('admin_event', { type: 'RIDE_REQUESTED', ride: result.ride });

  res.json({ success: true, ride: result.ride, nearby_drivers_count: result.nearby_drivers.length });
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

app.post('/api/drivers/:id/approve', (req, res) => {
  db.prepare('UPDATE driver_documents SET status = "approved", reviewed_at = CURRENT_TIMESTAMP WHERE driver_id = ?').run(req.params.id);
  db.prepare('UPDATE drivers SET status = "online" WHERE user_id = ?').run(req.params.id);
  res.json({ success: true, message: 'Conductor aprobado correctamente' });
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

// ==============================================================================
// WEB SOCKETS (TIEMPO REAL)
// ==============================================================================

io.on('connection', (socket) => {
  socket.on('join_ride', (rideId) => {
    socket.join(`ride_${rideId}`);
  });

  socket.on('driver_move', (data) => {
    const { driver_id, lat, lng, ride_id } = data;
    dispatchService.updateDriverLocation(driver_id, lat, lng);
    if (ride_id) {
      io.emit(`ride_update_${ride_id}`, { type: 'DRIVER_GPS', lat, lng });
    }
    io.emit('driver_gps_update', { driver_id, lat, lng });
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
