import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../05-security/auth.routes';
import crmRoutes from '../07-crm/crm.routes';
import catalogRoutes from '../08-catalog/catalog.routes';
import whatsappRoutes from '../10-whatsapp/whatsapp.routes';
import { tenantIsolation } from '../24-multitenant/tenant.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del Core (SKILL-06)
app.use(cors());
app.use(express.json());

// Endpoints de Seguridad y Autenticación (SKILL-05)
app.use('/api/auth', authRoutes);

// Endpoints de CRM (SKILL-07)
app.use('/api/crm', tenantIsolation, crmRoutes);

// Endpoints de Catálogo (SKILL-08)
app.use('/api/catalog', tenantIsolation, catalogRoutes);

// Webhooks de WhatsApp (SKILL-10)
app.use('/api/whatsapp', whatsappRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Smart Publish AI Core Platform Running' });
});

app.listen(PORT, () => {
    console.log(`Core Platform (SKILL-06) levantado en el puerto ${PORT}`);
});
