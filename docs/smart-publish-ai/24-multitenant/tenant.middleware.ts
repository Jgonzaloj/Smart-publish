import { Request, Response, NextFunction } from 'express';

// Extendemos Request para Typescript
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
        }
    }
}

// SKILL-24: Middleware de aislamiento Multitenant
export function tenantIsolation(req: Request, res: Response, next: NextFunction): void {
    // 1. Extraer el tenantId del header o del JWT (inyectado previamente en el Auth Middleware)
    // Para simplificar el mock, lo tomamos del header X-Tenant-ID
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
        res.status(403).json({ error: 'Acceso Denegado: Faltan credenciales de empresa (Tenant ID no proporcionado).' });
        return;
    }

    // 2. Inyectarlo en la request para que los controladores (ej. CRM) filtren siempre por este ID
    req.tenantId = tenantId;

    // TODO: SKILL-23 (Billing) - Aquí verificaríamos si el tenantId tiene una suscripción activa
    
    next();
}
