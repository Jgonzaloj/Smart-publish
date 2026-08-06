import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        workspace_id?: string;
    };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // 1. Extraer token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Acceso denegado. Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verificar firma y expiración
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // 3. Inyectar datos del usuario en la request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            workspace_id: decoded.workspace_id || req.headers['x-workspace-id']
        };

        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
    }
};
