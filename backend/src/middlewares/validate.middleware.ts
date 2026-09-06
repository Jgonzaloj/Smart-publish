import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

/**
 * Middleware para validación declarativa de esquemas Zod en Express.
 * Permite validar body, query params o route params de manera consistente.
 */
export const validate = (schema: ZodSchema, location: RequestLocation = 'body') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync(req[location]);
            req[location] = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
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
