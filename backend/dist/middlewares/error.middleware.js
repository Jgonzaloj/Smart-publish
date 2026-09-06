"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    // Log estructurado con severidad y contexto de la petición
    logger_1.logger.error(`Error no controlado en ${req.method} ${req.path}`, 'GlobalErrorHandler', {
        method: req.method,
        path: req.path,
        error: err.message || err,
        stack: err.stack,
        ip: req.ip
    });
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
exports.errorHandler = errorHandler;
