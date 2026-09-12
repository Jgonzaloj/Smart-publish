"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config();
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const express = require("express");
const path_1 = require("path");
const helmet_1 = require("helmet");
const express_rate_limit_1 = require("express-rate-limit");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                connectSrc: ["'self'", 'http://localhost:*', 'https:'],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    const limiterGeneral = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 600,
        standardHeaders: true,
        legacyHeaders: false,
        message: { statusCode: 429, message: 'Demasiadas solicitudes. Por favor, intenta de nuevo en unos minutos.' },
    });
    app.use(limiterGeneral);
    const limiterAuth = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        message: { statusCode: 429, message: 'Demasiados intentos de inicio de sesión. Por favor espera 15 minutos.' },
    });
    app.use('/auth/login', limiterAuth);
    const limiterPin = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        message: { statusCode: 429, message: 'Demasiados intentos de PIN. Por favor espera 15 minutos o inicia sesión con tu contraseña.' },
    });
    app.use('/auth/pin/verificar', limiterPin);
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : '*';
    app.enableCors({
        origin: allowedOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.use(express.static((0, path_1.join)(__dirname, '..', 'public')));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Backend corriendo en http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map