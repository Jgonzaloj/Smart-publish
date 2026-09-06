"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Middleware para validación declarativa de esquemas Zod en Express.
 * Permite validar body, query params o route params de manera consistente.
 */
const validate = (schema, location = 'body') => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync(req[location]);
            req[location] = parsed;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const issues = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }));
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: issues
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Error en la validación de la solicitud'
            });
        }
    };
};
exports.validate = validate;
