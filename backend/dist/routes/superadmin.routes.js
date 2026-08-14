"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminRoutes = void 0;
const express_1 = require("express");
const superadmin_controller_1 = require("../controllers/superadmin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const superadmin_middleware_1 = require("../middlewares/superadmin.middleware");
exports.superAdminRoutes = (0, express_1.Router)();
// Apply auth first, then superadmin check
exports.superAdminRoutes.use(auth_middleware_1.authMiddleware);
exports.superAdminRoutes.use(superadmin_middleware_1.superAdminMiddleware);
exports.superAdminRoutes.get('/dashboard', superadmin_controller_1.SuperAdminController.getDashboardData);
