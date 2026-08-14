"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationRoutes = void 0;
const express_1 = require("express");
const automation_controller_1 = require("../controllers/automation.controller");
const campaign_controller_1 = require("../controllers/campaign.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const usage_middleware_1 = require("../middlewares/usage.middleware");
exports.automationRoutes = (0, express_1.Router)();
exports.automationRoutes.post('/schedule', auth_middleware_1.authMiddleware, usage_middleware_1.checkPostUsageLimit, upload_middleware_1.uploadMiddleware.single('image'), automation_controller_1.AutomationController.schedulePost);
exports.automationRoutes.post('/cancel/:postId', auth_middleware_1.authMiddleware, automation_controller_1.AutomationController.cancelPost);
exports.automationRoutes.post('/retry/:postId', auth_middleware_1.authMiddleware, usage_middleware_1.checkPostUsageLimit, automation_controller_1.AutomationController.retryPost);
// Rutas para campañas
exports.automationRoutes.post('/campaigns', auth_middleware_1.authMiddleware, campaign_controller_1.CampaignController.createCampaign);
exports.automationRoutes.get('/campaigns', auth_middleware_1.authMiddleware, campaign_controller_1.CampaignController.getCampaigns);
exports.automationRoutes.delete('/campaigns/:id', auth_middleware_1.authMiddleware, campaign_controller_1.CampaignController.deleteCampaign);
