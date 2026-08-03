import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Loguear el error internamente (idealmente en un sistema como Sentry o Datadog)
    console.error(`[Global Error Handler] Path: ${req.path} | Error:`, err);

    // Evitar filtrar Stack Traces y detalles en producción
    const isProduction = process.env.NODE_ENV === 'production';
    
    const statusCode = err.status || 500;
    const message = isProduction && statusCode === 500
        ? 'Error interno del servidor. Por favor intente más tarde.'
        : err.message || 'Ocurrió un error inesperado';

    res.status(statusCode).json({
        success: false,
        message,
        ...(isProduction ? {} : { stack: err.stack }) // Solo mostrar stack en dev
    });
};
