"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookRoutes = void 0;
const express_1 = require("express");
const facebook_controller_1 = require("../controllers/facebook.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const multer_1 = __importDefault(require("multer"));
// Configurar multer para guardar archivos temporalmente en memoria
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
exports.facebookRoutes = (0, express_1.Router)();
// Endpoint para obtener la URL de login
exports.facebookRoutes.get('/auth-url', auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware, facebook_controller_1.FacebookController.getAuthUrl);
// Endpoint que Facebook llamará de regreso con el código
exports.facebookRoutes.get('/callback', auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware, facebook_controller_1.FacebookController.handleCallback);
// Endpoint para publicar un post en Facebook (acepta un archivo 'image')
exports.facebookRoutes.post('/publish', auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware, upload.single('image'), facebook_controller_1.FacebookController.publishPost);
