import { Request, Response, NextFunction } from 'express';

// Definimos la extensión de Request para Typescript
declare global {
    namespace Express {
        interface Request {
            workspaceId?: string;
        }
    }
}

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extraemos del usuario autenticado de forma confiable (snake_case o camelCase)
        let workspaceId = (req as any).user ? ((req as any).user.workspace_id || (req as any).user.workspaceId) : null;
        
        // 2. Solo como ultimo recurso, permitimos el header (para endpoints API que no pasen por authMiddleware)
        if (!workspaceId) {
            let headerVal = req.headers['x-workspace-id'];
            workspaceId = Array.isArray(headerVal) ? headerVal[0] : (headerVal as string);
        }

        if (!workspaceId) {
            console.warn('[Tenant Isolation] Intento de acceso sin Workspace ID. Ruta:', req.originalUrl);
            return res.status(403).json({
                error: 'FORBIDDEN_TENANT',
                message: 'No se ha provisto un Workspace ID válido para el aislamiento de datos.'
            });
        }

        // Inyectamos el workspaceId en el request para que los controladores lo usen obligatoriamente
        req.workspaceId = workspaceId;
        
        next();
    } catch (error) {
        console.error('[Tenant Isolation] Error en middleware:', error);
        res.status(500).json({ error: 'SERVER_ERROR', message: 'Error interno en validación de tenant.' });
    }
};
