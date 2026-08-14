"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminMiddleware = void 0;
const superAdminMiddleware = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (user.role !== 'SUPERADMIN') {
        return res.status(403).json({ success: false, message: 'Acceso denegado: Se requieren privilegios de Super Administrador' });
    }
    next();
};
exports.superAdminMiddleware = superAdminMiddleware;
