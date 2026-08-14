"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billing_controller_1 = require("../controllers/billing.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
const billingController = new billing_controller_1.BillingController();
// We need raw body for the webhook
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), billingController.handleWebhook.bind(billingController));
// These require authentication and JSON body parsing
router.post('/create-checkout-session', express_2.default.json(), auth_middleware_1.authMiddleware, billingController.createCheckoutSession.bind(billingController));
router.post('/create-portal-session', express_2.default.json(), auth_middleware_1.authMiddleware, billingController.createPortalSession.bind(billingController));
exports.default = router;
