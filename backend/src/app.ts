import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.routes';
import { facebookRoutes } from './routes/facebook.routes';
import { tiktokRoutes } from './routes/tiktok.routes';
import { linkedinRoutes } from './routes/linkedin.routes';
import { aiRoutes } from './routes/ai.routes';
import { automationRoutes } from './routes/automation.routes';
import { systemRoutes } from './routes/system.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import billingRoutes from './routes/billing.routes';
import { teamRoutes } from './routes/team.routes';
import { superAdminRoutes } from './routes/superadmin.routes';
import { webhooksRoutes } from './routes/webhooks.routes';
import { errorHandler } from './middlewares/error.middleware';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Hardening de seguridad con Helmet
app.use(helmet());

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id']
}));
// Mount billing routes before express.json() so the webhook can parse the raw body
app.use('/api/billing', billingRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting general (para todo el API, previene DDoS masivos)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite a 100 requests por IP
    message: 'Demasiadas peticiones desde esta IP, intente más tarde.'
});
app.use('/api/', apiLimiter);

// Rate Limiting estricto para Login (Fuerza Bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, // Limite estricto a 5 fallos por IP
    message: 'Demasiados intentos de inicio de sesión. Cuenta temporalmente bloqueada.'
});

// Exponer la carpeta uploads estáticamente (Fase 13)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Smart Publish SaaS API is running successfully',
        timestamp: new Date().toISOString()
    });
});

// Rutas API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/social/facebook', facebookRoutes);
app.use('/api/social/tiktok', tiktokRoutes);
app.use('/api/social/linkedin', linkedinRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Manejo seguro de Errores al final de todas las rutas
app.use(errorHandler);

// Inicializar Workers (BullMQ)
import './workers/publish.worker';
import './workers/campaign.worker';
import './workers/whatsapp.worker';

import { testDatabaseConnection } from './config/database';


// Inicialización del Servidor
const startServer = async () => {
    try { await testDatabaseConnection(); } catch(e) {}
    app.listen(PORT, () => { console.log('API Server running on port ' + PORT); });
};
startServer();
