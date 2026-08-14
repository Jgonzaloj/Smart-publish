"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const router = (0, express_1.Router)();
exports.analyticsRoutes = router;
// Protegemos todas las rutas de este router con el tenant middleware
router.use(tenant_middleware_1.tenantMiddleware);
router.get('/overview', analytics_controller_1.getEngagement);
