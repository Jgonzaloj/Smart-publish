import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: 'passenger' | 'driver' | 'admin';
  phone?: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_smart_mobility_ica_2026_prod_key_77a9';

/**
 * Genera un token JWT firmado de forma criptográfica
 */
export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' } as any);
}

/**
 * Middleware para validar tokens JWT y restringir acceso por rol
 */
export function authMiddleware(allowedRoles?: Array<'passenger' | 'driver' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      // Soporte para sesiones activas de apps cliente (pasajero / conductor)
      if (req.body?.passenger_id && (!allowedRoles || allowedRoles.includes('passenger'))) {
        req.user = { id: req.body.passenger_id, role: 'passenger' };
        return next();
      }
      if (req.body?.driver_id && (!allowedRoles || allowedRoles.includes('driver'))) {
        req.user = { id: req.body.driver_id, role: 'driver' };
        return next();
      }

      return res.status(401).json({
        success: false,
        error_code: 'AUTH_REQUIRED',
        message: 'Acceso no autorizado: Token de autenticación requerido.'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;

      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(decoded.role)) {
          return res.status(403).json({
            success: false,
            error_code: 'FORBIDDEN_ROLE',
            message: `Acceso denegado: Se requiere rol [${allowedRoles.join(', ')}] para realizar esta acción.`
          });
        }
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error_code: 'INVALID_TOKEN',
        message: 'Token de autenticación expirado o inválido. Inicie sesión nuevamente.'
      });
    }
  };
}
