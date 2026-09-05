"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = require("./routes/auth.routes");
const facebook_routes_1 = require("./routes/facebook.routes");
const tiktok_routes_1 = require("./routes/tiktok.routes");
const linkedin_routes_1 = require("./routes/linkedin.routes");
const ai_routes_1 = require("./routes/ai.routes");
const automation_routes_1 = require("./routes/automation.routes");
const system_routes_1 = require("./routes/system.routes");
const analytics_routes_1 = require("./routes/analytics.routes");
const billing_routes_1 = __importDefault(require("./routes/billing.routes"));
const team_routes_1 = require("./routes/team.routes");
const superadmin_routes_1 = require("./routes/superadmin.routes");
const webhooks_routes_1 = require("./routes/webhooks.routes");
const post_routes_1 = require("./routes/post.routes");
const crm_routes_1 = require("./routes/crm.routes");
const catalog_routes_1 = require("./routes/catalog.routes");
const quotes_routes_1 = require("./routes/quotes.routes");
const conversations_routes_1 = require("./routes/conversations.routes");
const observability_routes_1 = require("./routes/observability.routes");
const error_middleware_1 = require("./middlewares/error.middleware");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Hardening de seguridad con Helmet
app.use((0, helmet_1.default)());
// Middlewares
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id']
}));
// Mount billing routes before express.json() so the webhook can parse the raw body
app.use('/api/billing', billing_routes_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate Limiting general (para todo el API, previene DDoS masivos)
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite a 100 requests por IP
    message: 'Demasiadas peticiones desde esta IP, intente más tarde.'
});
app.use('/api/', apiLimiter);
// Rate Limiting estricto para Login (Fuerza Bruta)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5, // Limite estricto a 5 fallos por IP
    message: 'Demasiados intentos de inicio de sesión. Cuenta temporalmente bloqueada.'
});
// Exponer la carpeta uploads estáticamente (Fase 13)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Smart Publish SaaS API is running successfully',
        timestamp: new Date().toISOString()
    });
});
// Rutas API
app.use('/api/auth', authLimiter, auth_routes_1.authRoutes);
app.use('/api/social/facebook', facebook_routes_1.facebookRoutes);
app.use('/api/social/tiktok', tiktok_routes_1.tiktokRoutes);
app.use('/api/social/linkedin', linkedin_routes_1.linkedinRoutes);
app.use('/api/ai', ai_routes_1.aiRoutes);
app.use('/api/automation', automation_routes_1.automationRoutes);
app.use('/api/system', system_routes_1.systemRoutes);
app.use('/api/analytics', analytics_routes_1.analyticsRoutes);
app.use('/api/team', team_routes_1.teamRoutes);
app.use('/api/superadmin', superadmin_routes_1.superAdminRoutes);
app.use('/api/webhooks', webhooks_routes_1.webhooksRoutes);
app.use('/api/posts', post_routes_1.postRoutes);
app.use('/api/crm', crm_routes_1.crmRoutes);
app.use('/api/catalog', catalog_routes_1.catalogRoutes);
app.use('/api/quotes', quotes_routes_1.quotesRoutes);
app.use('/api/conversations', conversations_routes_1.conversationsRoutes);
app.use('/api/observability', observability_routes_1.observabilityRoutes);
// Manejo seguro de Errores al final de todas las rutas
app.use(error_middleware_1.errorHandler);
// Inicializar Workers (BullMQ)
require("./workers/publish.worker");
require("./workers/campaign.worker");
require("./workers/whatsapp.worker");
const database_1 = require("./config/database");
// Inicialización del Servidor
const startServer = async () => {
    try {
        await (0, database_1.testDatabaseConnection)();
    }
    catch (e) { }
    app.listen(PORT, () => { console.log('API Server running on port ' + PORT); });
};
startServer();
