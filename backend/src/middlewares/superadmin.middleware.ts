import { Request, Response, NextFunction } from 'express';

export const superAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    if (user.role !== 'SUPERADMIN') {
        return res.status(403).json({ success: false, message: 'Acceso denegado: Se requieren privilegios de Super Administrador' });
    }

    next();
};
