"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET no esta configurado en las variables de entorno.');
    process.exit(1);
}
const authMiddleware = (req, res, next) => {
    // 1. Extraer token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Acceso denegado. Token no proporcionado.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        // 2. Verificar firma y expiración
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Validacion IDOR: El header x-workspace-id DEBE coincidir con el del JWT
        const headerWorkspaceId = req.headers['x-workspace-id'];
        if (headerWorkspaceId && decoded.workspace_id && headerWorkspaceId !== decoded.workspace_id) {
            return res.status(403).json({ success: false, message: 'FORBIDDEN_TENANT: No tienes acceso a este workspace.' });
        }
        // 3. Inyectar datos del usuario en la request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            workspace_id: decoded.workspace_id
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
    }
};
exports.authMiddleware = authMiddleware;
