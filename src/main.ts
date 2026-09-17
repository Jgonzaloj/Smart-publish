import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cabeceras de seguridad HTTP con Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'http:', 'https:', 'data:', 'blob:'],
          upgradeInsecureRequests: null,
        },
      },
      hsts: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  // 2. Limitador de tasa (Rate Limiting) contra ataques de fuerza bruta
  const limiterGeneral = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: 'Demasiadas solicitudes. Por favor, intenta de nuevo en unos minutos.' },
  });
  app.use(limiterGeneral);

  const limiterAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150, // Aumentado para evitar bloqueos involuntarios por CGNAT en telefonía móvil
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: 'Demasiados intentos de inicio de sesión. Por favor espera unos minutos.' },
  });
  app.use('/auth/login', limiterAuth);

  // CORRECCIÓN (parte del hallazgo crítico 1.2): el PIN de 4 dígitos tiene solo
  // 10,000 combinaciones posibles, muchas menos que una contraseña real. Necesita
  // un límite de intentos mucho más agresivo que el login normal.
  const limiterPin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: 'Demasiados intentos de PIN. Por favor espera 15 minutos o inicia sesión con tu contraseña.' },
  });
  app.use('/auth/pin/verificar', limiterPin);

  // 3. Control de orígenes CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : '*';
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 4. Validación de datos de entrada
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(express.static(join(__dirname, '..', 'public')));
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend corriendo en http://localhost:${port}`);
}
bootstrap();

